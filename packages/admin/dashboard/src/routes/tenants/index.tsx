import { useState } from "react"
import {
  Badge,
  Button,
  Container,
  FocusModal,
  Heading,
  Input,
  Label,
  Select,
  Table,
  Tabs,
  Text,
  clx,
  toast,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import {
  getActiveTenantId,
  setActiveTenantId,
  useAddTenantMember,
  useCreateTenant,
  useRemoveTenantMember,
  useTenantDetail,
  useTenants,
  useUpdateTenant,
} from "../../hooks/api/tenants"

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useTranslation()
  return (
    <Badge size="2xsmall" color={status === "active" ? "green" : "orange"}>
      {status === "active" ? t("tenants.active") : t("tenants.suspended")}
    </Badge>
  )
}

// Ayarlar sekmesi — ad/durum düzenle (kontrollü form, kaydet).
const SettingsTab = ({
  tenantId,
  name,
  status,
}: {
  tenantId: string
  name: string
  status: string
}) => {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name, status })
  const update = useUpdateTenant(tenantId)

  return (
    <div className="flex max-w-md flex-col gap-y-4 p-6">
      <div className="flex flex-col gap-y-2">
        <Label>{t("tenants.settings.name")}</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-y-2">
        <Label>{t("tenants.settings.status")}</Label>
        <Select
          value={form.status}
          onValueChange={(v) => setForm({ ...form, status: v })}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="active">{t("tenants.active")}</Select.Item>
            <Select.Item value="suspended">
              {t("tenants.suspended")}
            </Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div>
        <Button
          size="small"
          isLoading={update.isPending}
          onClick={() =>
            update.mutate(form, {
              onSuccess: () => toast.success(t("tenants.settings.saved")),
              onError: (e: Error) =>
                toast.error(e?.message || t("tenants.member.error")),
            })
          }
        >
          {t("tenants.settings.save")}
        </Button>
      </div>
    </div>
  )
}

// Üyeler sekmesi — tablo + satır-içi e-posta ile ekleme.
const MembersTab = ({ tenantId }: { tenantId: string }) => {
  const { t } = useTranslation()
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
          toast.success(t("tenants.member.addedToast"))
          setEmail("")
        },
        onError: (e: Error) =>
          toast.error(e?.message || t("tenants.member.error")),
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
          placeholder={t("tenants.member.invitePh")}
        />
        <Select value={role} onValueChange={setRole}>
          <Select.Trigger className="w-36">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="admin">admin</Select.Item>
            <Select.Item value="manager">manager</Select.Item>
            <Select.Item value="member">member</Select.Item>
          </Select.Content>
        </Select>
        <Button
          size="small"
          variant="secondary"
          isLoading={addMember.isPending}
          onClick={submit}
        >
          {t("tenants.member.add")}
        </Button>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{t("tenants.member.email")}</Table.HeaderCell>
            <Table.HeaderCell>{t("tenants.member.role")}</Table.HeaderCell>
            <Table.HeaderCell>{t("tenants.member.added")}</Table.HeaderCell>
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
              <Table.Cell>
                {new Date(m.created_at).toLocaleDateString()}
              </Table.Cell>
              <Table.Cell className="text-right">
                <Button
                  size="small"
                  variant="transparent"
                  onClick={() =>
                    removeMember.mutate(m.id, {
                      onSuccess: () =>
                        toast.success(t("tenants.member.removedToast")),
                      onError: (e: Error) =>
                        toast.error(e?.message || t("tenants.member.error")),
                    })
                  }
                >
                  {t("tenants.member.remove")}
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  )
}

export const Component = () => {
  const { t } = useTranslation()
  const { tenants, isLoading } = useTenants()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", slug: "" })
  const createTenant = useCreateTenant()
  const activeId = getActiveTenantId()

  const selected =
    tenants.find((x) => x.id === selectedId) ?? tenants[0] ?? null
  const activeTenant = tenants.find((x) => x.id === activeId)

  return (
    <div className="flex flex-col gap-y-3">
      {activeId ? (
        <Container className="bg-ui-bg-subtle flex flex-wrap items-center justify-between gap-2 px-6 py-3">
          <div className="flex items-center gap-x-2">
            <Badge size="2xsmall" color="blue">
              {t("tenants.activeTenant")}
            </Badge>
            <Text size="small" weight="plus">
              {activeTenant?.name ?? activeId}
            </Text>
            <Text size="small" className="text-ui-fg-muted">
              — {t("tenants.activeBanner")}
            </Text>
          </div>
          <Button
            size="small"
            variant="secondary"
            onClick={() => setActiveTenantId(null)}
          >
            {t("tenants.clearActive")}
          </Button>
        </Container>
      ) : null}

      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h2">{t("tenants.title")}</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              {t("tenants.hint")}
            </Text>
          </div>
          <Button size="small" onClick={() => setOpen(true)}>
            {t("tenants.newTenant")}
          </Button>
        </div>

        {isLoading ? (
          <div className="px-6 py-8">
            <Text className="text-ui-fg-subtle">{t("tenants.loading")}</Text>
          </div>
        ) : tenants.length === 0 ? (
          <div className="px-6 py-8">
            <Text className="text-ui-fg-subtle">{t("tenants.empty")}</Text>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t("tenants.name")}</Table.HeaderCell>
                <Table.HeaderCell>{t("tenants.slug")}</Table.HeaderCell>
                <Table.HeaderCell>{t("tenants.status")}</Table.HeaderCell>
                <Table.HeaderCell className="text-right">
                  {t("tenants.members")}
                </Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {tenants.map((x) => (
                <Table.Row
                  key={x.id}
                  onClick={() => setSelectedId(x.id)}
                  className={clx("cursor-pointer", {
                    "bg-ui-bg-highlight": x.id === selected?.id,
                  })}
                >
                  <Table.Cell>
                    <div className="flex items-center gap-x-2">
                      {x.name}
                      {x.id === activeId ? (
                        <Badge size="2xsmall" color="blue">
                          {t("tenants.activeTenant")}
                        </Badge>
                      ) : null}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="font-mono">
                      {x.slug}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <StatusBadge status={x.status} />
                  </Table.Cell>
                  <Table.Cell className="text-right tabular-nums">
                    {x.member_count ?? 0}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {x.id !== activeId ? (
                      <Button
                        size="small"
                        variant="transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveTenantId(x.id)
                        }}
                      >
                        {t("tenants.makeActive")}
                      </Button>
                    ) : null}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>

      {selected ? (
        <Container className="divide-y p-0">
          <div className="flex items-center gap-x-2 px-6 py-4">
            <Heading level="h2">{selected.name}</Heading>
            <StatusBadge status={selected.status} />
            <Text size="small" className="text-ui-fg-muted font-mono">
              {selected.slug}
            </Text>
          </div>
          <Tabs defaultValue="members">
            <div className="px-6 pt-3">
              <Tabs.List>
                <Tabs.Trigger value="members">
                  {t("tenants.detailTabs.members")}
                </Tabs.Trigger>
                <Tabs.Trigger value="settings">
                  {t("tenants.detailTabs.settings")}
                </Tabs.Trigger>
              </Tabs.List>
            </div>
            <Tabs.Content value="members">
              <MembersTab tenantId={selected.id} />
            </Tabs.Content>
            <Tabs.Content value="settings">
              <SettingsTab
                key={selected.id}
                tenantId={selected.id}
                name={selected.name}
                status={selected.status}
              />
            </Tabs.Content>
          </Tabs>
        </Container>
      ) : null}

      <FocusModal open={open} onOpenChange={setOpen}>
        <FocusModal.Content>
          <FocusModal.Header>
            <div className="flex items-center justify-end gap-x-2">
              <FocusModal.Close asChild>
                <Button
                  size="small"
                  variant="secondary"
                  disabled={createTenant.isPending}
                >
                  {t("tenants.create.cancel")}
                </Button>
              </FocusModal.Close>
              <Button
                size="small"
                isLoading={createTenant.isPending}
                disabled={!form.name.trim() || !form.slug.trim()}
                onClick={() =>
                  createTenant.mutate(
                    { name: form.name.trim(), slug: form.slug.trim() },
                    {
                      onSuccess: () => {
                        toast.success(t("tenants.create.created"))
                        setOpen(false)
                        setForm({ name: "", slug: "" })
                      },
                      onError: (e: Error) =>
                        toast.error(e?.message || t("tenants.create.error")),
                    }
                  )
                }
              >
                {t("tenants.create.save")}
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-1 flex-col items-center overflow-auto py-8">
            <div className="flex w-full max-w-lg flex-col gap-y-4">
              <div className="flex flex-col gap-y-2">
                <Label>{t("tenants.name")}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("tenants.create.namePh")}
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label>{t("tenants.slug")}</Label>
                <Input
                  className="font-mono"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder={t("tenants.create.slugPh")}
                />
              </div>
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
    </div>
  )
}
