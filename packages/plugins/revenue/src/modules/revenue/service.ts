import { MedusaService } from "@medusajs/framework/utils"
import RevenueSource from "./models/revenue-source"
import RevenueEvent from "./models/revenue-event"
import Expense from "./models/expense"
import MetricSnapshot from "./models/metric-snapshot"

class RevenueModuleService extends MedusaService({
  RevenueSource,
  RevenueEvent,
  Expense,
  MetricSnapshot,
}) {}

export default RevenueModuleService
