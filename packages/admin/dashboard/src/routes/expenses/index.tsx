import { Trash } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  IconButton,
  Input,
  Label,
  Switch,
  Text,
} from "@medusajs/ui"
import { useState } from "react"
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  type ExpenseRow,
} from "../../hooks/api/revenue"
import { Money } from "../dashboards/kit"

const CATEGORIES = ["infra", "api", "ads", "other"] as const

const ExpenseItem = ({
  e,
  onDelete,
}: {
  e: ExpenseRow
  onDelete: (id: string) => void
}) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex min-w-0 flex-col">
      <Text size="small" className="truncate">
        {e.description}
      </Text>
      <Text size="xsmall" className="text-ui-fg-muted">
        {e.category}
        {e.recurring ? "" : ` · ${new Date(e.occurred_at).toLocaleDateString()}`}
      </Text>
    </div>
    <div className="flex shrink-0 items-center gap-x-3">
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

export const Component = () => {
  const { expenses } = useExpenses()
  const create = useCreateExpense()
  const del = useDeleteExpense()
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    description: "",
    amount: "",
    currency: "USD",
    category: "other",
    occurred_at: today,
    recurring: false,
  })

  const submit = () => {
    create.mutate(
      {
        description: form.description.trim(),
        amount: Number(form.amount),
        currency: form.currency.toUpperCase(),
        category: form.category,
        occurred_at: form.occurred_at,
        recurring: form.recurring,
      },
      {
        onSuccess: () =>
          setForm({ ...form, description: "", amount: "", recurring: false }),
      }
    )
  }

  const valid =
    form.description.trim().length > 0 &&
    Number(form.amount) > 0 &&
    form.currency.trim().length === 3

  const fixed = expenses.filter((e) => e.recurring)
  const extra = expenses.filter((e) => !e.recurring)

  return (
    <div className="flex w-full flex-col gap-y-3">
      <Container className="p-6">
        <Heading level="h2">Giderler</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Sabit (her ay tekrar eden) ve ekstra giderler — net kâr hesabına girer
        </Text>
      </Container>

      <Container className="flex flex-col gap-y-4 p-6">
        <Heading level="h3">Gider Ekle</Heading>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-48 flex-1 flex-col gap-y-1">
            <Label size="xsmall">Açıklama</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="AWS, Render, reklam bütçesi…"
            />
          </div>
          <div className="flex w-24 flex-col gap-y-1">
            <Label size="xsmall">Tutar</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div className="flex w-20 flex-col gap-y-1">
            <Label size="xsmall">Birim</Label>
            <Input
              value={form.currency}
              maxLength={3}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label size="xsmall">Kategori</Label>
            <select
              className="bg-ui-bg-field border-ui-border-base h-8 rounded-md border px-2 text-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-y-1">
            <Label size="xsmall">Tarih</Label>
            <Input
              type="date"
              value={form.occurred_at}
              onChange={(e) => setForm({ ...form, occurred_at: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-x-2 pb-1">
            <Switch
              checked={form.recurring}
              onCheckedChange={(v) => setForm({ ...form, recurring: v })}
            />
            <Label size="xsmall">Sabit (her ay)</Label>
          </div>
          <Button onClick={submit} isLoading={create.isPending} disabled={!valid}>
            Ekle
          </Button>
        </div>
      </Container>

      <Container className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <Heading level="h3">Sabit Giderler</Heading>
          <Badge size="2xsmall" color="blue">
            her ay
          </Badge>
        </div>
        {fixed.length ? (
          <div className="flex flex-col divide-y">
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
          Ekstra Giderler
        </Heading>
        {extra.length ? (
          <div className="flex flex-col divide-y">
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
