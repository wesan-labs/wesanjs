import { Link } from "react-router-dom"
import {
  Button,
  Container,
  Heading,
  Text,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useFeatureFlag } from "../../providers/feature-flag-provider"
import { usePermissions } from "../../providers/permissions-provider"
import { useActiveTenant } from "../../hooks/api/tenants"

/** Org hub — shortcuts to team, roles, policies. */
export const OrganizationHub = () => {
  const { t } = useTranslation()
  const { activeTenant } = useActiveTenant()
  const isRbacEnabled = useFeatureFlag("rbac")
  const { hasPermission } = usePermissions()

  const canRoles = isRbacEnabled && hasPermission("rbac_role:read")
  const canPolicies = isRbacEnabled && hasPermission("rbac_policy:read")

  if (!activeTenant) {
    return null
  }

  return (
    <Container className="bg-ui-bg-subtle divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">{t("organization.hub.title")}</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          {t("organization.hub.hint")}
        </Text>
      </div>
      <div className="flex flex-wrap gap-2 px-6 py-4">
        <Button size="small" variant="secondary" asChild>
          <Link to="/settings/organization/members">
            {t("organization.team.domain")}
          </Link>
        </Button>
        {canRoles ? (
          <Button size="small" variant="secondary" asChild>
            <Link to="/settings/roles">{t("roles.domain")}</Link>
          </Button>
        ) : null}
        {canPolicies ? (
          <Button size="small" variant="secondary" asChild>
            <Link to="/settings/policies">{t("policies.domain")}</Link>
          </Button>
        ) : null}
      </div>
      {!isRbacEnabled ? (
        <div className="px-6 pb-4">
          <Text size="small" className="text-ui-fg-muted">
            {t("organization.hub.rbacOff")}
          </Text>
        </div>
      ) : null}
    </Container>
  )
}
