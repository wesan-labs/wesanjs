-- Default tenant + admin membership. Idempotent. Existing single-tenant data
-- backfills to this tenant (see content-plugin tenant_id migration). The fixed id
-- `tenant_default` is referenced by those backfills, so keep it stable.

INSERT INTO tenant (id, slug, name, status, created_at, updated_at)
VALUES ('tenant_default', 'default', 'Default', 'active', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Bind the existing admin user to the default tenant as admin (env-specific email).
INSERT INTO tenant_membership (id, tenant_id, user_id, role, created_at, updated_at)
SELECT 'tnm_default_admin', 'tenant_default', u.id, 'admin', now(), now()
FROM "user" u
WHERE u.email = 'admin@helm.local'
ON CONFLICT (id) DO NOTHING;
