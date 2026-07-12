# Reconstruction worker — foto(lar) → GLB

Ürün fotoğraflarından **gerçek 3D mesh (GLB)** üretir. Vendor'sız, çağrı-başı ücretsiz.
İçerik stüdyosunun "3D" adımının entegre motoru (spec `2026-07-13-content-studio-ux-reframe.md` §U2).

## Kanıt
2026-07-12: gerçek çoklu-açı görüntülerden SfM **80/80 kamera** register, GLB üretti.
Tümü pip (brew YOK), CPU (CUDA YOK). Kaba (visual-hull) ama gerçek mesh.

## Kur & çalıştır
```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt   # + ffmpeg
.venv/bin/python pipeline.py --frames-dir <foto-klasörü> --out model.glb
.venv/bin/python pipeline.py --video <mp4> --out model.glb           # ffmpeg ile kare çıkarır
```

## Pipeline
```
foto/video → (ffmpeg kareler) → COLMAP SfM (pycolmap) → rembg silüet → visual-hull → marching cubes → GLB
```

## ⚠️ Kritik girdi kuralı
Görüntüler ürünü **düzgün kapsamalı** — kamera ürünün etrafında dönmeli, sabit mesafe,
sade zemin. **Boşluk = o yüz bozuk.** AI-video "turntable"i genelde yetersiz kapsar
(kanıt: Veo orbit → 141° boşluk → çöp). Gerçek fotoğraflar veya iyi-kapsamalı video şart.

## Genişletme noktaları (reusable/extensible)
- `reconstruct(frames_dir, out, method=...)` import edilebilir.
- **`--method dense`** (TODO): COLMAP dense (CUDA) veya 3DGS (OpenSplat/gsplat) → doku + girinti + kaliteli mesh. GPU worker gerektirir. Visual-hull yeterli değilse buraya.
- SaaS entegrasyonu: bir job queue worker'ı bu script'i shell/subprocess ile çağırır; çıktı GLB'yi re-host'a (S3/R2) yükler. TS sözleşme: `packages/plugins/content/src/lib/three-d/reconstruction/contract.ts`.
