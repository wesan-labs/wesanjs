#!/usr/bin/env node
// #0014 / #0009 — RLS doğrulama script'i (kanıt katmanı).
//
// Ne kanıtlar:
//   1. KATALOG: tenant_id kolonu olan gerçek tablolarda RLS gerçekten ENABLE mı,
//      policy takılı mı (uykuda policy ≠ koruma; rowsecurity=false → FAIL).
//   2. ROL HİJYENİ: levios_app'te BYPASSRLS/SUPERUSER yok (checklist anti-pattern).
//   3. DAVRANIŞ (canary tablo, gerçek şemadan bağımsız deterministik):
//      - var UNSET  → 0 satır (strict deny)
//      - var=ten_a  → sadece ten_a satırları
//      - çapraz INSERT (ten_b) → WITH CHECK reddi
//      - txn içinde SET LOCAL → txn bitince eski değere döner
//
// Kullanım:  DATABASE_URL=postgres://postgres:postgres@localhost:5432/helm \
//            node packages/plugins/tenant/scripts/verify-rls.mjs
// Not: superuser bağlantısı gerekir (rol parolası + canary kurulumu için).
//      LEVIOS_APP_PASSWORD env ile override edilebilir (default: levios_app_dev).

import pg from "pg"

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/helm"
const APP_ROLE = "levios_app"
const APP_PASSWORD = process.env.LEVIOS_APP_PASSWORD ?? "levios_app_dev"
const CANARY = "rls_canary_0014"

// RLS migration'larının kapsadığı tablolar (content/cms/revenue plugin'leri).
const EXPECTED_RLS_TABLES = [
  "content_item",
  "social_snapshot",
  "cms_site",
  "cms_collection",
  "cms_entry",
  "revenue_app",
  "revenue_source",
  "revenue_event",
  "revenue_metric_snapshot",
  "revenue_expense",
]

const results = []
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail })
  console.log(`${ok ? "  ✓" : "  ✗ FAIL"} ${name}${detail ? ` — ${detail}` : ""}`)
}

const appUrl = () => {
  const u = new URL(DATABASE_URL)
  u.username = APP_ROLE
  u.password = APP_PASSWORD
  return u.toString()
}

async function main() {
  const su = new pg.Client({ connectionString: DATABASE_URL })
  await su.connect()
  console.log(`\n[1/4] Katalog denetimi (${new URL(DATABASE_URL).pathname.slice(1)})`)

  // Rol var mı? (migration'lar yaratır — yoksa önce migrate)
  const { rows: roleRows } = await su.query(
    `SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = $1`,
    [APP_ROLE]
  )
  if (!roleRows.length) {
    check(`rol '${APP_ROLE}' mevcut`, false, "önce RLS migration'larını çalıştır (medusa db:migrate)")
    return finish(su)
  }
  check(`rol '${APP_ROLE}' mevcut`, true)
  check(
    `'${APP_ROLE}' BYPASSRLS/SUPERUSER değil`,
    !roleRows[0].rolsuper && !roleRows[0].rolbypassrls,
    `super=${roleRows[0].rolsuper} bypassrls=${roleRows[0].rolbypassrls}`
  )

  // tenant_id kolonlu tablolar × RLS durumu
  const { rows: tables } = await su.query(`
    SELECT c.relname AS table, c.relrowsecurity AS rls, c.relforcerowsecurity AS force,
           EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid) AS has_policy
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns col
        WHERE col.table_schema = 'public' AND col.table_name = c.relname
          AND col.column_name = 'tenant_id'
      )
    ORDER BY 1
  `)
  const byName = new Map(tables.map((t) => [t.table, t]))
  for (const t of EXPECTED_RLS_TABLES) {
    const row = byName.get(t)
    if (!row) {
      check(`tablo ${t}`, true, "DB'de yok (plugin migrate edilmemiş) — atlandı [uyarı]")
      continue
    }
    check(`RLS aktif+policy'li: ${t}`, row.rls && row.has_policy,
      `rowsecurity=${row.rls} policy=${row.has_policy}${row.force ? "" : " (FORCE yok — owner bypass eder, runtime rolü owner olmadığı sürece sorun değil)"}`)
  }
  // Kapsam dışı ama tenant_id'li tablolar → görünürlük
  for (const row of tables) {
    if (!EXPECTED_RLS_TABLES.includes(row.table) && row.table !== CANARY && !row.rls) {
      console.log(`  ⚠ tenant_id'li ama RLS'siz tablo: ${row.table} (rollout kapsamına alınmalı — #0005)`)
    }
  }

  // Runtime rol notu
  const { rows: me } = await su.query(`SELECT current_user, usesuper FROM pg_user WHERE usename = current_user`)
  console.log(`  ℹ bu bağlantının rolü: ${me[0]?.current_user} (superuser=${me[0]?.usesuper}) — dev'de beklenen; prod runtime '${APP_ROLE}' olmalı (ADR-0001)`)

  console.log(`\n[2/4] Canary kurulumu (superuser)`)
  await su.query(`ALTER ROLE ${APP_ROLE} WITH LOGIN PASSWORD '${APP_PASSWORD.replace(/'/g, "''")}'`)
  await su.query(`DROP TABLE IF EXISTS ${CANARY}`)
  await su.query(`CREATE TABLE ${CANARY} (id serial PRIMARY KEY, tenant_id text NOT NULL, note text)`)
  await su.query(`ALTER TABLE ${CANARY} ENABLE ROW LEVEL SECURITY`)
  await su.query(`ALTER TABLE ${CANARY} FORCE ROW LEVEL SECURITY`)
  await su.query(`
    CREATE POLICY tenant_isolation_${CANARY} ON ${CANARY}
    FOR ALL TO ${APP_ROLE}
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id())
  `)
  await su.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ${CANARY} TO ${APP_ROLE}`)
  await su.query(`GRANT USAGE, SELECT ON SEQUENCE ${CANARY}_id_seq TO ${APP_ROLE}`)
  await su.query(`INSERT INTO ${CANARY} (tenant_id, note) VALUES ('ten_a','a1'), ('ten_a','a2'), ('ten_b','b1')`)
  console.log(`  ✓ ${CANARY}: 2×ten_a + 1×ten_b satır (superuser ile)`)

  console.log(`\n[3/4] Davranış testleri ('${APP_ROLE}' bağlantısıyla)`)
  const app = new pg.Client({ connectionString: appUrl() })
  await app.connect()

  const count = async (where = "") =>
    Number((await app.query(`SELECT count(*) c FROM ${CANARY} ${where}`)).rows[0].c)

  // T1 — var unset → strict deny (0 satır)
  check("var UNSET → 0 satır (strict deny)", (await count()) === 0)

  // T2 — var=ten_a → sadece kendi satırları
  await app.query(`SELECT set_config('app.current_tenant_id', 'ten_a', false)`)
  check("var=ten_a → 2 satır", (await count()) === 2)
  check("var=ten_a → ten_b görünmez", (await count(`WHERE tenant_id='ten_b'`)) === 0)

  // T3 — çapraz INSERT reddi (WITH CHECK)
  let crossInsertBlocked = false
  try {
    await app.query(`INSERT INTO ${CANARY} (tenant_id, note) VALUES ('ten_b','sızma')`)
  } catch (e) {
    crossInsertBlocked = /row-level security/i.test(e.message)
  }
  check("çapraz INSERT (ten_b) → WITH CHECK reddi", crossInsertBlocked)
  check("kendi INSERT (ten_a) → kabul", await app.query(`INSERT INTO ${CANARY} (tenant_id, note) VALUES ('ten_a','a3')`).then(() => true).catch(() => false))

  // T4 — SET LOCAL txn-scoped (checklist: transaction dışında no-op)
  await app.query("BEGIN")
  await app.query(`SELECT set_config('app.current_tenant_id', 'ten_b', true)`) // local=true
  const inTxn = await count()
  await app.query("COMMIT")
  const afterTxn = await count(`WHERE tenant_id='ten_a'`)
  check("txn içi SET LOCAL ten_b → 1 satır", inTxn === 1)
  check("txn sonrası ten_a'ya geri döner", afterTxn === 3)

  await app.end()

  console.log(`\n[4/4] Temizlik`)
  await su.query(`DROP TABLE IF EXISTS ${CANARY}`)
  console.log(`  ✓ ${CANARY} silindi`)

  return finish(su)
}

async function finish(su) {
  await su.end()
  const failed = results.filter((r) => !r.ok)
  console.log(`\n${"─".repeat(50)}\nSONUÇ: ${results.length - failed.length}/${results.length} geçti${failed.length ? ` — ${failed.length} FAIL` : " ✓"}`)
  process.exit(failed.length ? 1 : 0)
}

main().catch((e) => {
  console.error(`\nScript hatası: ${e.message}`)
  console.error("DB ayakta mı? DATABASE_URL doğru mu? (docker compose up -d postgres)")
  process.exit(2)
})
