import { MedusaService } from "@medusajs/framework/utils"
import Product3DAsset from "./models/product-3d-asset"
import type { Product3DAssetDTO } from "../../lib/three-d/types"

// Açık DTO generic'i (CLAUDE.md §5.1) — MedusaService'in model'den derin tip
// çıkarımını kırar, "TS2589 excessively deep" build uyarısını önler.
class Product3DModuleService extends MedusaService<{
  Product3DAsset: { dto: Product3DAssetDTO }
}>({
  Product3DAsset,
}) {}

export default Product3DModuleService
