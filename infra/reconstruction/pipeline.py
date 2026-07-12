#!/usr/bin/env python3
"""
Foto(lar)/video → GLB reconstruction pipeline. Entegre worker'ın çekirdeği.

KANITLANDI (2026-07-12): gerçek çoklu-açı görüntülerden SfM 80/80 kamera register,
GLB üretti. Vendor'sız, GPU'suz (CPU) çalışır — kaba (visual-hull) ama gerçek mesh.

Genişletilebilir: --method hull (CPU, hızlı, kaba) | dense (GPU, 3DGS, kaliteli — TODO).
Reusable: CLI + import edilebilir fonksiyonlar. SaaS worker bunu shell/queue ile çağırır.

Kullanım:
  python pipeline.py --frames-dir <klasör> --out model.glb [--method hull] [--voxel 128]
  python pipeline.py --video <mp4> --out model.glb            # ffmpeg ile kare çıkarır

Gerekli: pip install -r requirements.txt ; ffmpeg (video girdisi için).
KRİTİK: Görüntüler ürünü FARKLI AÇILARDAN düzgün kapsamalı (kamera etrafında dönmeli;
141° boşluk = o yüz bozuk). AI-video "turntable"i genelde yetersiz kapsar.
"""
import argparse
import subprocess
import sys
import tempfile
from pathlib import Path


def extract_frames(video: Path, out_dir: Path, fps: int = 10) -> int:
    out_dir.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(video), "-vf", f"fps={fps}", str(out_dir / "f_%03d.png")],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return len(list(out_dir.glob("*.png")))


def run_sfm(frames: Path, work: Path):
    """COLMAP SfM (pycolmap): feature → match → mapping. Kamera pozları + sparse."""
    import pycolmap

    db = work / "db.db"
    sparse = work / "sparse"
    sparse.mkdir(exist_ok=True)
    if db.exists():
        db.unlink()
    pycolmap.extract_features(db, frames)
    pycolmap.match_exhaustive(db)
    maps = pycolmap.incremental_mapping(db, frames, sparse)
    if not maps:
        raise RuntimeError("SfM başarısız — görüntüler yetersiz kapsıyor/tutarsız")
    rec = max(maps.values(), key=lambda r: r.num_reg_images())
    return rec


def visual_hull(rec, frames: Path, out: Path, N: int = 128):
    """Silüet-carving → marching cubes → GLB. CPU, kaba dış-kabuk (girinti yok)."""
    import numpy as np
    import trimesh
    from PIL import Image
    from rembg import remove
    from skimage import measure

    pts = np.array([p.xyz for p in rec.points3D.values()])
    lo, hi = np.percentile(pts, 3, 0), np.percentile(pts, 97, 0)
    c = (lo + hi) / 2
    r = (hi - lo).max() * 0.6
    lo, hi = c - r, c + r
    xs, ys, zs = (np.linspace(lo[i], hi[i], N) for i in range(3))
    gx, gy, gz = np.meshgrid(xs, ys, zs, indexing="ij")
    V = np.stack([gx.ravel(), gy.ravel(), gz.ravel()], 1)
    occ = np.ones(V.shape[0], bool)

    for im in rec.images.values():
        cam = rec.cameras[im.camera_id]
        cfw = im.cam_from_world
        cfw = cfw() if callable(cfw) else cfw
        Rt = cfw.matrix()
        raw = Image.open(frames / im.name).convert("RGB")
        alpha = np.array(remove(raw))[:, :, 3] > 128
        Xc = (Rt[:, :3] @ V.T + Rt[:, 3:4]).T
        front = Xc[:, 2] > 1e-6
        norm = np.zeros((V.shape[0], 2))
        norm[front] = Xc[front, :2] / Xc[front, 2:3]
        px = cam.img_from_cam(norm)
        u, v = np.round(px[:, 0]).astype(int), np.round(px[:, 1]).astype(int)
        inb = front & (u >= 0) & (u < cam.width) & (v >= 0) & (v < cam.height)
        inside = np.zeros(V.shape[0], bool)
        inside[inb] = alpha[v[inb], u[inb]]
        occ &= inside

    if occ.sum() < 50:
        raise RuntimeError("hull boş — kapsama/silüet yetersiz")
    grid = occ.reshape(N, N, N).astype(np.float32)
    verts, faces, _, _ = measure.marching_cubes(grid, level=0.5)
    verts = lo + verts / (N - 1) * (hi - lo)
    mesh = trimesh.Trimesh(vertices=verts, faces=faces)
    if mesh.body_count > 1:
        mesh = max(mesh.split(only_watertight=False), key=lambda m: len(m.faces))
    mesh.export(out)
    return len(mesh.vertices), len(mesh.faces)


def reconstruct(frames_dir: Path, out: Path, method: str = "hull", voxel: int = 128) -> dict:
    """Reusable giriş noktası. frames_dir → GLB. Genişletme: method="dense" (3DGS/GPU)."""
    with tempfile.TemporaryDirectory() as tmp:
        rec = run_sfm(frames_dir, Path(tmp))
        info = {"cameras": rec.num_reg_images(), "points": rec.num_points3D(), "method": method}
        if method == "hull":
            nv, nf = visual_hull(rec, frames_dir, out, N=voxel)
            info.update(vertices=nv, faces=nf, glb=str(out))
        elif method == "dense":
            # TODO: COLMAP dense (CUDA) veya 3DGS (OpenSplat/gsplat) → texture'lı mesh.
            raise NotImplementedError("dense/3DGS henüz yok — GPU worker gerektirir")
        else:
            raise ValueError(f"bilinmeyen method: {method}")
        return info


def main():
    ap = argparse.ArgumentParser(description="Foto/video → GLB reconstruction")
    ap.add_argument("--frames-dir")
    ap.add_argument("--video")
    ap.add_argument("--out", required=True)
    ap.add_argument("--method", default="hull", choices=["hull", "dense"])
    ap.add_argument("--voxel", type=int, default=128)
    ap.add_argument("--fps", type=int, default=10)
    a = ap.parse_args()

    if a.video:
        fd = Path(tempfile.mkdtemp()) / "frames"
        n = extract_frames(Path(a.video), fd)
        print(f"video → {n} kare")
    elif a.frames_dir:
        fd = Path(a.frames_dir)
    else:
        ap.error("--frames-dir veya --video gerekli")

    info = reconstruct(fd, Path(a.out), a.method, a.voxel)
    print(f"✔ {info}")


if __name__ == "__main__":
    sys.exit(main())
