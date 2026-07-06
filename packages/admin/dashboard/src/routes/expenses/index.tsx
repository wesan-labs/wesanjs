import { DocumentText, Trash, XMark } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Hint,
  IconButton,
  Input,
  Label,
  Select,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { useState, type ReactNode } from "react"
import {
  FileType,
  FileUpload,
} from "../../components/common/file-upload"
import {
  useCreateExpense,
  useDeleteExpense,
  useDisplayCurrency,
  useExpenses,
  useUploadExpenseInvoice,
  type ExpenseRow,
} from "../../hooks/api/revenue"
import { Money } from "../dashboards/kit"

const CATEGORIES = [
  { value: "infra", label: "Altyapı" },
  { value: "api", label: "API" },
  { value: "ads", label: "Reklam" },
  { value: "other", label: "Diğer" },
] as const

const INVOICE_FORMATS = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]

const INVOICE_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.webp"
const MAX_INVOICE_BYTES = 10 * 1024 * 1024

const categoryLabel = (value: string) =>
  CATEGORIES.find((c) => c.value === value)?.label ?? value

const ExpenseItem = ({
  e,
  onDelete,
}: {
  e: ExpenseRow
  onDelete: (id: string) => void
}) => (
  <div className="flex items-start justify-between gap-x-4 py-3">
    <div className="flex min-w-0 flex-1 flex-col gap-y-1.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Text size="small" weight="plus" className="truncate">
          {e.description}
        </Text>
        <Badge size="2xsmall" color="grey">
          {categoryLabel(e.category)}
        </Badge>
        {e.recurring ? (
          <Badge size="2xsmall" color="blue">
            sabit
          </Badge>
        ) : null}
      </div>
      <Text size="xsmall" className="text-ui-fg-muted">
        {[
          e.vendor,
          e.invoice_number ? `#${e.invoice_number}` : null,
          !e.recurring
            ? new Date(e.occurred_at).toLocaleDateString("tr-TR")
            : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </Text>
      {e.invoice_url ? (
        <a
          href={e.invoice_url}
          target="_blank"
          rel="noreferrer"
          className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover inline-flex w-fit items-center gap-x-1.5 text-xs"
        >
          <DocumentText className="size-3.5 shrink-0" />
          Faturayı görüntüle
        </a>
      ) : (
        <Text size="xsmall" className="text-ui-fg-disabled">
          Fatura eklenmemiş
        </Text>
      )}
    </div>
    <div className="flex shrink-0 items-center gap-x-2">
      <Text size="small" weight="plus" className="tabular-nums">
        <Money amount={e.amount} currency={e.currency} />
      </Text>
      <IconButton
        size="small"
        variant="transparent"
        onClick={() => onDelete(e.id)}
      >
        <Trash className="text-ui-fg-muted" />
      </IconButton>
    </div>
  </div>
)

const Field = ({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) => (
  <div className={className ?? "flex flex-col gap-y-2"}>
    <Label size="small" weight="plus">
      {label}
    </Label>
    {children}
  </div>
)

export const Component = () => {
  const displayCurrency = useDisplayCurrency()
  const { expenses } = useExpenses()
  const create = useCreateExpense()
  const del = useDeleteExpense()
  const uploadInvoice = useUploadExpenseInvoice()
  const today = new Date().toISOString().slice(0, 10)
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string>()
  const [form, setForm] = useState({
    description: "",
    amount: "",
    currency: displayCurrency?.toUpperCase() ?? "USD",
    category: "other",
    occurred_at: today,
    recurring: false,
    vendor: "",
    invoice_number: "",
  })

  const resetForm = () => {
    setForm({
      description: "",
      amount: "",
      currency: displayCurrency?.toUpperCase() ?? form.currency,
      category: "other",
      occurred_at: today,
      recurring: false,
      vendor: "",
      invoice_number: "",
    })
    setInvoiceFile(null)
    setUploadError(undefined)
  }

  const submit = async () => {
    try {
      let invoice_url: string | null = null
      if (invoiceFile) {
        const uploaded = await uploadInvoice.mutateAsync(invoiceFile)
        invoice_url = uploaded.url
      }

      create.mutate(
        {
          description: form.description.trim(),
          amount: Number(form.amount),
          currency: form.currency.toUpperCase(),
          category: form.category,
          occurred_at: form.occurred_at,
          recurring: form.recurring,
          vendor: form.vendor.trim() || null,
          invoice_number: form.invoice_number.trim() || null,
          invoice_url,
        },
        {
          onSuccess: () => {
            toast.success("Gider eklendi")
            resetForm()
          },
          onError: (e: Error) =>
            toast.error(e?.message || "Gider eklenemedi"),
        }
      )
    } catch (e) {
      toast.error((e as Error)?.message || "Fatura yüklenemedi")
    }
  }

  const valid =
    form.description.trim().length > 0 &&
    Number(form.amount) > 0 &&
    form.currency.trim().length === 3

  const fixed = expenses.filter((e) => e.recurring)
  const extra = expenses.filter((e) => !e.recurring)
  const busy = create.isPending || uploadInvoice.isPending

  const onInvoiceUploaded = (files: FileType[]) => {
    setUploadError(undefined)
    const file = files[0]?.file
    if (!file) {
      return
    }
    if (!INVOICE_FORMATS.includes(file.type)) {
      setUploadError("PDF, JPEG, PNG veya WebP yükleyin")
      return
    }
    setInvoiceFile(file)
  }

  return (
    <div className="flex w-full max-w-5xl flex-col gap-y-3">
      <Container className="p-6">
        <Heading level="h2">Giderler</Heading>
        <Text size="small" className="text-ui-fg-subtle mt-1">
          Sabit ve ekstra giderler — fatura bilgisi ve belge ekleyerek muhasebe
          kaydı tutun
        </Text>
      </Container>

      <Container className="flex flex-col gap-y-6 p-6">
        <div>
          <Heading level="h3">Gider ekle</Heading>
          <Text size="small" className="text-ui-fg-muted mt-1">
            Net kâr hesabına dahil edilir
          </Text>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">
          <div className="flex flex-col gap-y-4">
            <Text
              size="small"
              weight="plus"
              className="text-ui-fg-subtle uppercase tracking-wide"
            >
              Gider bilgisi
            </Text>

            <Field label="Açıklama">
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="AWS sunucu, Render, reklam bütçesi…"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tutar">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                  placeholder="0.00"
                />
              </Field>
              <Field label="Para birimi">
                <Input
                  value={form.currency}
                  maxLength={3}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      currency: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="USD"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Kategori">
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    {CATEGORIES.map((c) => (
                      <Select.Item key={c.value} value={c.value}>
                        {c.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Field>
              <Field label="Tarih">
                <Input
                  type="date"
                  value={form.occurred_at}
                  onChange={(e) =>
                    setForm({ ...form, occurred_at: e.target.value })
                  }
                />
              </Field>
            </div>

            <div className="bg-ui-bg-subtle border-ui-border-base flex items-center justify-between rounded-lg border px-4 py-3">
              <div className="flex flex-col gap-y-0.5">
                <Label size="small" weight="plus">
                  Sabit gider
                </Label>
                <Text size="xsmall" className="text-ui-fg-muted">
                  Her ay tekrar eden gider olarak kaydet
                </Text>
              </div>
              <Switch
                checked={form.recurring}
                onCheckedChange={(v) => setForm({ ...form, recurring: v })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-y-4">
            <Text
              size="small"
              weight="plus"
              className="text-ui-fg-subtle uppercase tracking-wide"
            >
              Fatura
            </Text>

            <Field label="Tedarikçi">
              <Input
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                placeholder="AWS, Google Ads, Figma…"
              />
            </Field>

            <Field label="Fatura numarası">
              <Input
                value={form.invoice_number}
                onChange={(e) =>
                  setForm({ ...form, invoice_number: e.target.value })
                }
                placeholder="INV-2026-001"
              />
            </Field>

            <Field label="Belge">
              {invoiceFile ? (
                <div className="bg-ui-bg-component border-ui-border-base flex items-center justify-between gap-x-3 rounded-lg border px-3 py-2">
                  <div className="flex min-w-0 items-center gap-x-2">
                    <DocumentText className="text-ui-fg-muted size-4 shrink-0" />
                    <Text size="small" className="truncate">
                      {invoiceFile.name}
                    </Text>
                  </div>
                  <IconButton
                    size="small"
                    variant="transparent"
                    type="button"
                    onClick={() => setInvoiceFile(null)}
                  >
                    <XMark className="text-ui-fg-muted" />
                  </IconButton>
                </div>
              ) : (
                <FileUpload
                  label="Fatura veya fiş yükle"
                  hint="PDF, JPEG, PNG veya WebP — en fazla 10 MB"
                  multiple={false}
                  formats={[...INVOICE_FORMATS, INVOICE_EXTENSIONS]}
                  maxFileSize={MAX_INVOICE_BYTES}
                  hasError={!!uploadError}
                  onUploaded={(files, rejected) => {
                    if (rejected?.length) {
                      setUploadError("Dosya 10 MB'dan büyük olamaz")
                      return
                    }
                    onInvoiceUploaded(files)
                  }}
                />
              )}
              {uploadError ? (
                <Hint variant="error">{uploadError}</Hint>
              ) : null}
            </Field>
          </div>
        </div>

        <div className="border-ui-border-base flex justify-end border-t pt-4">
          <Button onClick={submit} isLoading={busy} disabled={!valid}>
            Gideri kaydet
          </Button>
        </div>
      </Container>

      <Container className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <Heading level="h3">Sabit giderler</Heading>
          <Badge size="2xsmall" color="blue">
            her ay
          </Badge>
        </div>
        {fixed.length ? (
          <div className="border-ui-border-base flex flex-col divide-y rounded-lg border px-4">
            {fixed.map((e) => (
              <ExpenseItem key={e.id} e={e} onDelete={del.mutate} />
            ))}
          </div>
        ) : (
          <Text size="small" className="text-ui-fg-muted">
            Sabit gider yok
          </Text>
        )}
      </Container>

      <Container className="p-6">
        <Heading level="h3" className="mb-3">
          Ekstra giderler
        </Heading>
        {extra.length ? (
          <div className="border-ui-border-base flex flex-col divide-y rounded-lg border px-4">
            {extra.map((e) => (
              <ExpenseItem key={e.id} e={e} onDelete={del.mutate} />
            ))}
          </div>
        ) : (
          <Text size="small" className="text-ui-fg-muted">
            Ekstra gider yok
          </Text>
        )}
      </Container>
    </div>
  )
}
