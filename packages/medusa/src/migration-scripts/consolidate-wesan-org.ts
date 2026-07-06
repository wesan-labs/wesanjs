#!/usr/bin/env node

/**
 * Migration Script: Move legacy Default-org revenue + social data into Wesan org.
 *
 * Before multi-tenant, integrations lived on tenant_default. CMS pilot data is on
 * ten_wesan. Solo operators expect one org — this script merges Default → Wesan.
 * Idempotent: only rows still on tenant_default (or NULL social snapshots) move.
 */

import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const WESAN_TENANT_ID = "ten_wesan"
const LEGACY_TENANT_ID = "tenant_default"

const TABLES_WITH_TENANT = [
  "revenue_app",
  "revenue_source",
  "revenue_expense",
  "revenue_event",
  "revenue_metric_snapshot",
] as const

export default async function consolidateWesanOrg({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any

  const wesanRow = await knex("tenant")
    .select("id")
    .where({ id: WESAN_TENANT_ID })
    .first()

  if (!wesanRow) {
    logger.info(
      `Wesan tenant (${WESAN_TENANT_ID}) not found — skipping consolidate-wesan-org.`
    )
    return
  }

  let moved = 0
  const stamp = { tenant_id: WESAN_TENANT_ID, updated_at: knex.fn.now() }

  for (const table of TABLES_WITH_TENANT) {
    const count = await knex(table)
      .where({ tenant_id: LEGACY_TENANT_ID })
      .whereNull("deleted_at")
      .update(stamp)
    moved += count
    if (count) {
      logger.info(`consolidate-wesan-org: ${table} → ${count} row(s)`)
    }
  }

  const socialCount = await knex("social_snapshot")
    .whereNull("deleted_at")
    .where(function (this: any) {
      this.where({ tenant_id: LEGACY_TENANT_ID }).orWhereNull("tenant_id")
    })
    .update(stamp)

  moved += socialCount
  if (socialCount) {
    logger.info(`consolidate-wesan-org: social_snapshot → ${socialCount} row(s)`)
  }

  logger.info(
    moved
      ? `consolidate-wesan-org complete — ${moved} row(s) now under Wesan (${WESAN_TENANT_ID}).`
      : "consolidate-wesan-org: nothing to move (already consolidated)."
  )
}
