export enum RevenueSourceType {
  REVENUECAT = "revenuecat",
  STRIPE = "stripe",
  PADDLE = "paddle",
  IYZICO = "iyzico",
  MANUAL = "manual",
}

export enum RevenueEventKind {
  SUBSCRIPTION_INITIAL = "subscription_initial",
  SUBSCRIPTION_RENEWAL = "subscription_renewal",
  ONE_TIME = "one_time",
  REFUND = "refund",
  AD_EARNING = "ad_earning",
}

export enum ExpenseCategory {
  INFRA = "infra",
  API = "api",
  ADS = "ads",
  OTHER = "other",
}

export const REVENUE_MODULE = "revenue"
