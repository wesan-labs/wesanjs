import { ArrowDownTray, Trash } from "@medusajs/icons"
import { Badge, Drawer, IconButton, Text, Tooltip, clx } from "@medusajs/ui"
import {
  useContentItems,
  useDeleteContentItem,
} from "../../../hooks/api/content"
import { CopyButton } from "./copy-button"

/** Saved content library in a drawer: images + texts, delete, send-to-studio. */
export const LibraryDrawer = ({
  open,
  onOpenChange,
  onUseImage,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onUseImage: (dataUrl: string, label: string) => void
}) => {
  const { data, isLoading } = useContentItems({ enabled: open })
  const del = useDeleteContentItem()

  const items = data?.items ?? []
  const images = items.filter((i) => i.kind === "image")
  const texts = items.filter((i) => i.kind === "text")

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Kütüphane</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-6 overflow-y-auto">
          {isLoading ? (
            <Text size="small" className="text-ui-fg-subtle">
              Yükleniyor…
            </Text>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-y-1 py-10 text-center">
              <Text weight="plus">Kütüphane boş</Text>
              <Text size="small" className="text-ui-fg-subtle">
                Stüdyoda ürettiklerini "Kaydet" ile buraya ekle.
              </Text>
            </div>
          ) : (
            <>
              {images.length > 0 && (
                <section className="flex flex-col gap-y-2">
                  <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase tracking-wider">
                    Görseller ({images.length})
                  </Text>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {images.map((it) => (
                      <div
                        key={it.id}
                        className="group border-ui-border-base relative aspect-square overflow-hidden rounded-lg border"
                      >
                        <img
                          src={it.value}
                          alt={it.title ?? ""}
                          className="size-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-x-1 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Tooltip content="Stüdyoya al">
                            <IconButton
                              size="2xsmall"
                              variant="transparent"
                              className="text-white"
                              onClick={() =>
                                onUseImage(it.value, it.title ?? "Kütüphane")
                              }
                            >
                              <ArrowDownTray />
                            </IconButton>
                          </Tooltip>
                          <Tooltip content="Sil">
                            <IconButton
                              size="2xsmall"
                              variant="transparent"
                              className="text-white"
                              onClick={() => del.mutate(it.id)}
                            >
                              <Trash />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {texts.length > 0 && (
                <section className="flex flex-col gap-y-2">
                  <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase tracking-wider">
                    Metinler ({texts.length})
                  </Text>
                  <div className="flex flex-col gap-y-2">
                    {texts.map((it) => (
                      <div
                        key={it.id}
                        className="border-ui-border-base flex flex-col gap-y-1 rounded-lg border p-3"
                      >
                        <div className="flex items-center justify-between gap-x-2">
                          <div className="flex min-w-0 items-center gap-x-2">
                            <Text size="xsmall" weight="plus" className="truncate">
                              {it.title || "Metin"}
                            </Text>
                            {it.language && (
                              <Badge size="2xsmall" color="blue">
                                {it.language}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-x-1">
                            <CopyButton value={it.value} />
                            <IconButton
                              size="2xsmall"
                              variant="transparent"
                              onClick={() => del.mutate(it.id)}
                            >
                              <Trash />
                            </IconButton>
                          </div>
                        </div>
                        <Text
                          size="xsmall"
                          className={clx("text-ui-fg-subtle line-clamp-3 whitespace-pre-wrap")}
                        >
                          {it.value}
                        </Text>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}
