/**
 * Reconstruction worker sözleşmesi — backend ↔ worker paylaşılan arayüz.
 * Worker: foto(lar) → GLB (infra/reconstruction/pipeline.py). Reusable/extensible:
 * yeni method/param eklemek tek satır; backend job atar, worker koşar, GLB döner.
 */

/** hull = CPU/hızlı/kaba · dense = GPU/kaliteli (3DGS, gelecek). */
export type ReconstructionMethod = "hull" | "dense"

export const DEFAULT_RECONSTRUCTION_METHOD: ReconstructionMethod = "hull"

/** Worker'a giden iş. `images` = ürün fotoğrafları (worker'ın erişebileceği URL). */
export interface ReconstructionJob {
  id: string
  images: string[]
  method?: ReconstructionMethod
  /** hull voxel çözünürlüğü (kalite/hız). */
  voxel?: number
}

/** Worker sonucu — GLB URL'i (re-host'lanmış) veya hata. */
export interface ReconstructionResult {
  status: "ready" | "failed"
  glbUrl?: string
  cameras?: number // register olan kamera sayısı (kapsama kalitesi göstergesi)
  error?: string
}

/** Kapsama eşiği (PhotoSet ile paylaşılan kanıt-temelli değerler). */
export const RECON_MIN_IMAGES = 4
export const RECON_GOOD_IMAGES = 6
