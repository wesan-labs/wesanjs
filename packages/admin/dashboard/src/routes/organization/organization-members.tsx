import { useState } from "react"
import { CORE_LAYOUT_IDS } from "@medusajs/admin-shared"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Select,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { SingleColumnPageSkeleton } from "../../components/common/skeleton"
import { LayoutComposer } from "../../components/layout-composer"
import { useFeatureFlag } from "../../providers/feature-flag-provider"
import { usePermissions } from "../../providers/permissions-provider"
import {
  useActiveTenant,
  useAddTenantMember,
  useRemoveTenantMember,
  useTenantDetail,
} from "../../hooks/api/tenants"

export const Component = () => {
  const { t } = useTranslation()
  const { activeTenant, isLoading } = useActiveTenant()
  const isRbacEnabled = useFeatureFlag("rbac")
  const { hasPermission } = usePermissions()
  const canManageRoles =
    isRbacEnabled && hasPermission("rbac_role:read")

  if (isLoading) {
    return (
      <LayoutComposer
        widgetsZonePrefix="organization.team"
        preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
        sections={{
          main: <SingleColumnPageSkeleton sections={1} />,
        }}
      />
    )
  }

  if (!activeTenant) {
    return (
      <LayoutComposer
        widgetsZonePrefix="organization.team"
        preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
        sections={{
          main: (
            <LayoutComposer.Entry id="OrganizationTeamEmpty">
              <Container className="flex flex-col gap-y-3 p-6">
                <Heading level="h1">{t("organization.team.domain")}</Heading>
                <Text className="text-ui-fg-subtle">
                  {t("organization.team.noOrg")}
                </Text>
                <Link
                  to="/settings/organization"
                  className="text-ui-fg-interactive text-sm"
                >
                  {t("organization.team.createLink")}
                </Link>
              </Container>
            </LayoutComposer.Entry>
          ),
        }}
      />
    )
  }

  return (
    <LayoutComposer
      widgetsZonePrefix="organization.team"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="OrganizationTeam">
              <Container className="divide-y p-0">
                <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
                  <div>
                    <Heading level="h1">{t("organization.team.domain")}</Heading>
                    <Text size="small" className="text-ui-fg-subtle">
                      {t("organization.team.hint", { name: activeTenant.name })}
                    </Text>
                  </div>
                  {canManageRoles ? (
                    <Button size="small" variant="secondary" asChild>
                      <Link to="/settings/roles">
                        {t("organization.team.manageRoles")}
                      </Link>
                    </Button>
                  ) : null}
                </div>
                <MembersSection tenantId={activeTenant.id} />
              </Container>
            </LayoutComposer.Entry>

            <LayoutComposer.Entry id="OrganizationTeamHint">
              <Container className="px-6 py-4">
                <Text size="small" className="text-ui-fg-subtle">
                  {isRbacEnabled
                    ? t("organization.team.rbacHint")
                    : t("organization.team.membershipHint")}
                </Text>
              </Container>
            </LayoutComposer.Entry>
          </>
        ),
      }}
    />
  )
}

const MembersSection = ({ tenantId }: { tenantId: string }) => {
  const { t } = useTranslation()
  const isRbacEnabled = useFeatureFlag("rbac")
  const { members } = useTenantDetail(tenantId)
  const addMember = useAddTenantMember(tenantId)
  const removeMember = useRemoveTenantMember(tenantId)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("admin")

  const submit = () => {
    const v = email.trim()
    if (!v) {
      return
    }
    addMember.mutate(
      { email: v, role },
      {
        onSuccess: () => {
          toast.success(t("organization.member.addedToast"))
          setEmail("")
        },
        onError: (e: Error) =>
          toast.error(e?.message || t("organization.member.error")),
      }
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-2 px-6 py-4">
        <Input
          className="w-64"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={t("organization.member.invitePh")}
        />
        <Select value={role} onValueChange={setRole}>
          <Select.Trigger className="w-36">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="admin">
              {t("organization.member.roles.admin")}
            </Select.Item>
            <Select.Item value="manager">
              {t("organization.member.roles.manager")}
            </Select.Item>
            <Select.Item value="member">
              {t("organization.member.roles.member")}
            </Select.Item>
          </Select.Content>
        </Select>
        <Button
          size="small"
          variant="secondary"
          isLoading={addMember.isPending}
          onClick={submit}
        >
          {t("organization.member.add")}
        </Button>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{t("organization.member.email")}</Table.HeaderCell>
            <Table.HeaderCell>{t("organization.member.role")}</Table.HeaderCell>
            {isRbacEnabled ? (
              <Table.HeaderCell>
                {t("organization.member.moduleRole")}
              </Table.HeaderCell>
            ) : null}
            <Table.HeaderCell>{t("organization.member.added")}</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {members.map((m) => (
            <Table.Row key={m.id}>
              <Table.Cell>{m.email ?? m.user_id}</Table.Cell>
              <Table.Cell>
                <Badge size="2xsmall" color="grey">
                  {m.role}
                </Badge>
              </Table.Cell>
              {isRbacEnabled ? (
                <Table.Cell>
                  <Text size="small" className="text-ui-fg-subtle font-mono">
                    {m.rbac_role_id ?? "—"}
                  </Text>
                </Table.Cell>
              ) : null}
              <Table.Cell>
                {new Date(m.created_at).toLocaleDateString()}
              </Table.Cell>
              <Table.Cell className="text-right">
                <div className="flex items-center justify-end gap-x-1">
                  <Button size="small" variant="transparent" asChild>
                    <Link to={`/settings/users/${m.user_id}`}>
                      {t("organization.member.permissions")}
                    </Link>
                  </Button>
                  <Button
                    size="small"
                    variant="transparent"
                    onClick={() =>
                      removeMember.mutate(m.id, {
                        onSuccess: () =>
                          toast.success(t("organization.member.removedToast")),
                        onError: (e: Error) =>
                          toast.error(
                            e?.message || t("organization.member.error")
                          ),
                      })
                    }
                  >
                    {t("organization.member.remove")}
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}
