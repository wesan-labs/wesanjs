import { MedusaService } from "@medusajs/framework/utils"
import Tenant from "./models/tenant"
import TenantMembership from "./models/tenant-membership"

class TenantModuleService extends MedusaService({
  Tenant,
  TenantMembership,
}) {}

export default TenantModuleService
