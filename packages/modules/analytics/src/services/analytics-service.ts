import {
  TrackAnalyticsEventDTO,
  IdentifyAnalyticsEventDTO,
  Context,
} from "@medusajs/types"
import {
  MedusaError,
  MedusaService,
  InjectManager,
  MedusaContext,
} from "@medusajs/framework/utils"
import AnalyticsProviderService from "./provider-service"
import { AnalyticsMetricSnapshot, AnalyticsBootstrapToken, AnalyticsEvent } from "../models"
import {
  generateBootstrapToken,
  hashBootstrapToken,
  platformRuntimeConfig,
  tokenHint,
  type RuntimeAnalyticsConfig,
} from "../lib/bootstrap"

type InjectedDependencies = {
  analyticsProviderService: AnalyticsProviderService
}

export type BootstrapConfigResult = {
  valid: boolean
  tenant_id?: string | null
  product_id?: string
  config?: RuntimeAnalyticsConfig
}

export default class AnalyticsService
  extends MedusaService({
    AnalyticsMetricSnapshot,
    AnalyticsBootstrapToken,
    AnalyticsEvent,
  })
{
  protected readonly analyticsProviderService_: AnalyticsProviderService

  constructor({ analyticsProviderService }: InjectedDependencies) {
    // @ts-ignore
    super(...arguments)
    this.analyticsProviderService_ = analyticsProviderService
  }

  __hooks = {
    onApplicationShutdown: async () => {
      await this.analyticsProviderService_.shutdown()
    },
  }

  getProvider() {
    return this.analyticsProviderService_
  }

  async track(data: TrackAnalyticsEventDTO): Promise<void> {
    try {
      await this.analyticsProviderService_.track(data)
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Error tracking event for ${data.event}: ${error.message}`
      )
    }
  }

  async identify(data: IdentifyAnalyticsEventDTO): Promise<void> {
    try {
      await this.analyticsProviderService_.identify(data)
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Error identifying event for ${
          "group" in data ? data.group.id : data.actor_id
        }: ${error.message}`
      )
    }
  }

  @InjectManager()
  async listSnapshotsForProduct(
    tenantId: string | undefined,
    productId: string,
    days = 30,
    @MedusaContext() sharedContext: Context = {}
  ) {
    const since = new Date()
    since.setUTCDate(since.getUTCDate() - days)
    since.setUTCHours(0, 0, 0, 0)

    const filter: Record<string, unknown> = {
      product_id: productId,
      date: { $gte: since },
    }
    if (tenantId) {
      filter.tenant_id = tenantId
    }

    return this.listAnalyticsMetricSnapshots(
      filter,
      { order: { date: "ASC" }, take: 500 },
      sharedContext
    )
  }

  @InjectManager()
  async getBootstrapHint(
    tenantId: string | undefined,
    productId: string,
    @MedusaContext() sharedContext: Context = {}
  ) {
    const filter: Record<string, unknown> = { product_id: productId }
    if (tenantId) {
      filter.tenant_id = tenantId
    }

    const [row] = await this.listAnalyticsBootstrapTokens(
      filter,
      { take: 1 },
      sharedContext
    )
    return row?.token_hint ?? null
  }

  @InjectManager()
  async rotateBootstrapToken(
    tenantId: string | undefined,
    productId: string,
    @MedusaContext() sharedContext: Context = {}
  ) {
    const raw = generateBootstrapToken()
    const hash = hashBootstrapToken(raw)
    const hint = tokenHint(raw)

    const filter: Record<string, unknown> = { product_id: productId }
    if (tenantId) {
      filter.tenant_id = tenantId
    }

    const [existing] = await this.listAnalyticsBootstrapTokens(
      filter,
      { take: 1 },
      sharedContext
    )

    if (existing) {
      await this.updateAnalyticsBootstrapTokens(
        {
          id: existing.id,
          token_hash: hash,
          token_hint: hint,
          rotated_at: new Date(),
        },
        sharedContext
      )
    } else {
      await this.createAnalyticsBootstrapTokens(
        {
          product_id: productId,
          tenant_id: tenantId ?? null,
          token_hash: hash,
          token_hint: hint,
          rotated_at: new Date(),
        },
        sharedContext
      )
    }

    return { token: raw, hint }
  }

  @InjectManager()
  async recordIngestEvent(
    input: {
      tenant_id?: string | null
      product_id: string
      event: string
      distinct_id: string
      occurred_at?: Date
      properties?: Record<string, unknown> | null
    },
    @MedusaContext() sharedContext: Context = {}
  ) {
    await this.createAnalyticsEvents(
      {
        tenant_id: input.tenant_id ?? null,
        product_id: input.product_id,
        event: input.event,
        distinct_id: input.distinct_id,
        occurred_at: input.occurred_at ?? new Date(),
        properties: input.properties ?? null,
      },
      sharedContext
    )

    try {
      await this.track({
        event: input.event,
        actor_id: input.distinct_id,
        properties: {
          ...input.properties,
          product_id: input.product_id,
          tenant_id: input.tenant_id,
        },
      })
    } catch {
      // Builtin relay: DB is source of truth; provider relay is optional.
    }
  }

  @InjectManager()
  async listEventsForDay(
    tenantId: string | undefined,
    productId: string,
    day: Date,
    @MedusaContext() sharedContext: Context = {}
  ) {
    const start = new Date(day.toISOString().slice(0, 10))
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 1)

    const filter: Record<string, unknown> = {
      product_id: productId,
      occurred_at: { $gte: start, $lt: end },
    }
    if (tenantId) {
      filter.tenant_id = tenantId
    }

    const rows = await this.listAnalyticsEvents(
      filter,
      { take: 50000, order: { occurred_at: "ASC" } },
      sharedContext
    )

    return rows.map((r: { event: string; distinct_id: string }) => ({
      event: r.event,
      distinct_id: r.distinct_id,
    }))
  }

  @InjectManager()
  async upsertMetricSnapshot(
    input: {
      tenant_id?: string | null
      product_id: string
      date: Date
      source: string
      metric: string
      value: number
      dimensions?: Record<string, unknown> | null
    },
    @MedusaContext() sharedContext: Context = {}
  ) {
    const day = new Date(input.date.toISOString().slice(0, 10))

    const filter: Record<string, unknown> = {
      product_id: input.product_id,
      date: day,
      source: input.source,
      metric: input.metric,
    }
    if (input.tenant_id) {
      filter.tenant_id = input.tenant_id
    }

    const [existing] = await this.listAnalyticsMetricSnapshots(
      filter,
      { take: 1 },
      sharedContext
    )

    const data = {
      tenant_id: input.tenant_id ?? null,
      product_id: input.product_id,
      date: day,
      source: input.source,
      metric: input.metric,
      value: input.value,
      dimensions: input.dimensions ?? null,
    }

    if (existing) {
      await this.updateAnalyticsMetricSnapshots(
        { id: existing.id, ...data },
        sharedContext
      )
      return existing.id
    }

    const created = await this.createAnalyticsMetricSnapshots(data, sharedContext)
    return Array.isArray(created) ? created[0]?.id : created?.id
  }

  @InjectManager()
  async recordDayMetrics(
    tenantId: string | undefined,
    productId: string,
    day: Date,
    metrics: Array<{
      source: string
      metric: string
      value: number
      dimensions?: Record<string, unknown> | null
    }>,
    @MedusaContext() sharedContext: Context = {}
  ) {
    for (const m of metrics) {
      await this.upsertMetricSnapshot(
        {
          tenant_id: tenantId ?? null,
          product_id: productId,
          date: day,
          source: m.source,
          metric: m.metric,
          value: m.value,
          dimensions: m.dimensions ?? null,
        },
        sharedContext
      )
    }
  }

  @InjectManager()
  async resolveBootstrapConfig(
    rawToken: string,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<BootstrapConfigResult> {
    const hash = hashBootstrapToken(rawToken)
    const [row] = await this.listAnalyticsBootstrapTokens(
      { token_hash: hash },
      { take: 1 },
      sharedContext
    )

    if (!row) {
      return { valid: false }
    }

    return {
      valid: true,
      tenant_id: row.tenant_id,
      product_id: row.product_id,
      config: platformRuntimeConfig(),
    }
  }
}
