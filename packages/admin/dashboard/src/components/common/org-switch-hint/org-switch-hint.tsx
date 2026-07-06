import { Button, Container, Text } from "@medusajs/ui"
import {
  setActiveTenantId,
  type Tenant,
} from "../../../hooks/api/tenants"

type OrgSwitchHintProps = {
  show: boolean
  targetTenant?: Tenant | null
  activeTenant?: Tenant | null
  title: string
  body: string
  buttonLabel: string
}

export const OrgSwitchHint = ({
  show,
  targetTenant,
  activeTenant,
  title,
  body,
  buttonLabel,
}: OrgSwitchHintProps) => {
  if (!show || !targetTenant) {
    return null
  }

  return (
    <Container className="border-ui-border-interactive bg-ui-bg-subtle flex flex-col gap-y-3 border p-5">
      <Text size="small" weight="plus">
        {title}
      </Text>
      <Text size="small" className="text-ui-fg-subtle">
        {body
          .replace("{{target}}", targetTenant.name)
          .replace("{{active}}", activeTenant?.name ?? "—")}
      </Text>
      <div>
        <Button size="small" onClick={() => setActiveTenantId(targetTenant.id)}>
          {buttonLabel.replace("{{target}}", targetTenant.name)}
        </Button>
      </div>
    </Container>
  )
}
