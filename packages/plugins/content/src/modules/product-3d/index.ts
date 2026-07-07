import { Module } from "@medusajs/framework/utils"
import Product3DModuleService from "./service"

// camelCase ŞART (dash yasak — container resolution kırılır)
export const PRODUCT_3D_MODULE = "product3d"

export default Module(PRODUCT_3D_MODULE, {
  service: Product3DModuleService,
})
