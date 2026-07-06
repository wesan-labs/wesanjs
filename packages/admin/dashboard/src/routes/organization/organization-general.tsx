import { useEffect, useState } from "react"
import { CORE_LAYOUT_IDS } from "@medusajs/admin-shared"
import {
  Badge,
  Button,
  Container,
  FocusModal,
  Heading,
  Input,
  Label,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { SingleColumnPageSkeleton } from "../../components/common/skeleton"
import { LayoutComposer } from "../../components/layout-composer"
import {
  setActiveTenantId,
  useActiveTenant,
  useCreateTenant,
  useUpdateTenant,
} from "../../hooks/api/tenants"
import { OrganizationHub } from "./organization-hub"

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useTranslation()
  return (
    <Badge size="2xsmall" color={status === "active" ? "green" : "orange"}>
      {status === "active"
        ? t("organization.active")
        : t("organization.suspended")}
    </Badge>
  )
}

export const Component = () => {
  const { t } = useTranslation()
  const { activeTenant, tenants, isLoading, storedTenantId } = useActiveTenant()
  const [open, setOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: "", slug: "" })
  const [form, setForm] = useState({ name: "", status: "active" })
  const createTenant = useCreateTenant()
  const update = useUpdateTenant(activeTenant?.id ?? "")

  useEffect(() => {
    if (activeTenant) {
      setForm({ name: activeTenant.name, status: activeTenant.status })
    }
  }, [activeTenant?.id, activeTenant?.name, activeTenant?.status])

  const storedId = storedTenantId

  if (isLoading) {
    return (
      <LayoutComposer
        widgetsZonePrefix="organization.details"
        preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
        sections={{
          main: <SingleColumnPageSkeleton sections={2} />,
        }}
      />
    )
  }

  if (!activeTenant) {
    return (
      <LayoutComposer
        widgetsZonePrefix="organization.details"
        preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
        sections={{
          main: (
            <LayoutComposer.Entry id="OrganizationEmpty">
              <Container className="flex flex-col gap-y-4 p-6">
                <Heading level="h1">{t("organization.domain")}</Heading>
                <Text className="text-ui-fg-subtle">{t("organization.empty")}</Text>
                <div>
                  <Button size="small" onClick={() => setOpen(true)}>
                    {t("organization.new")}
                  </Button>
                </div>
                <CreateOrgModal
                  open={open}
                  onOpenChange={setOpen}
                  form={createForm}
                  setForm={setCreateForm}
                  createTenant={createTenant}
                />
              </Container>
            </LayoutComposer.Entry>
          ),
        }}
      />
    )
  }

  return (
    <>
      <LayoutComposer
        widgetsZonePrefix="organization.details"
        preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
        sections={{
          main: (
            <>
              {storedId ? (
                <LayoutComposer.Entry id="OrganizationActiveScope">
                  <Container className="bg-ui-bg-subtle flex flex-wrap items-center justify-between gap-2 px-6 py-3">
                    <div className="flex items-center gap-x-2">
                      <Badge size="2xsmall" color="blue">
                        {t("organization.activeScope")}
                      </Badge>
                      <Text size="small" weight="plus">
                        {activeTenant.name}
                      </Text>
                      <Text size="small" className="text-ui-fg-muted">
                        — {t("organization.activeBanner")}
                      </Text>
                    </div>
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => setActiveTenantId(null)}
                    >
                      {t("organization.clearActive")}
                    </Button>
                  </Container>
                </LayoutComposer.Entry>
              ) : null}

              <LayoutComposer.Entry id="OrganizationGeneral">
                <Container className="divide-y p-0">
                  <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
                    <div>
                      <Heading level="h1">{t("organization.domain")}</Heading>
                      <Text size="small" className="text-ui-fg-subtle">
                        {t("organization.hint")}
                      </Text>
                    </div>
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => setOpen(true)}
                    >
                      {t("organization.new")}
                    </Button>
                  </div>

                  {tenants.length > 1 ? (
                    <div className="flex flex-col gap-y-2 px-6 py-4">
                      <Label>{t("organization.switch")}</Label>
                      <Select
                        value={activeTenant.id}
                        onValueChange={(id) => setActiveTenantId(id)}
                      >
                        <Select.Trigger className="max-w-md">
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          {tenants.map((x) => (
                            <Select.Item key={x.id} value={x.id}>
                              {x.name}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                    </div>
                  ) : null}

                  <div className="flex max-w-lg flex-col gap-y-4 px-6 py-6">
                    <div className="flex items-center gap-x-2">
                      <StatusBadge status={activeTenant.status} />
                      <Text size="small" className="text-ui-fg-muted font-mono">
                        {activeTenant.slug}
                      </Text>
                    </div>

                    <div className="flex flex-col gap-y-2">
                      <Label>{t("organization.name")}</Label>
                      <Input
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex flex-col gap-y-2">
                      <Label>{t("organization.status")}</Label>
                      <Select
                        value={form.status}
                        onValueChange={(v) => setForm({ ...form, status: v })}
                      >
                        <Select.Trigger>
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Item value="active">
                            {t("organization.active")}
                          </Select.Item>
                          <Select.Item value="suspended">
                            {t("organization.suspended")}
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
                            onSuccess: () =>
                              toast.success(t("organization.saved")),
                            onError: (e: Error) =>
                              toast.error(
                                e?.message || t("organization.member.error")
                              ),
                          })
                        }
                      >
                        {t("organization.save")}
                      </Button>
                    </div>
                  </div>
                </Container>
              </LayoutComposer.Entry>

              <LayoutComposer.Entry id="OrganizationHub">
                <OrganizationHub />
              </LayoutComposer.Entry>
            </>
          ),
        }}
      />
      <CreateOrgModal
        open={open}
        onOpenChange={setOpen}
        form={createForm}
        setForm={setCreateForm}
        createTenant={createTenant}
      />
    </>
  )
}

const CreateOrgModal = ({
  open,
  onOpenChange,
  form,
  setForm,
  createTenant,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  form: { name: string; slug: string }
  setForm: (v: { name: string; slug: string }) => void
  createTenant: ReturnType<typeof useCreateTenant>
}) => {
  const { t } = useTranslation()

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex items-center justify-end gap-x-2">
            <FocusModal.Close asChild>
              <Button
                size="small"
                variant="secondary"
                disabled={createTenant.isPending}
              >
                {t("organization.create.cancel")}
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
                      toast.success(t("organization.create.created"))
                      onOpenChange(false)
                      setForm({ name: "", slug: "" })
                    },
                    onError: (e: Error) =>
                      toast.error(e?.message || t("organization.create.error")),
                  }
                )
              }
            >
              {t("organization.create.save")}
            </Button>
          </div>
        </FocusModal.Header>
        <FocusModal.Body className="flex flex-1 flex-col items-center overflow-auto py-8">
          <div className="flex w-full max-w-lg flex-col gap-y-4">
            <div className="flex flex-col gap-y-2">
              <Label>{t("organization.name")}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("organization.create.namePh")}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label>{t("organization.slug")}</Label>
              <Input
                className="font-mono"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder={t("organization.create.slugPh")}
              />
            </div>
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}
