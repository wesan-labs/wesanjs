import { definePolicies } from "@medusajs/framework/utils"
import { generateResourcePolicies } from "../utils"

export const revenuePolicies = definePolicies(
  generateResourcePolicies(["revenue", "expense"])
)
