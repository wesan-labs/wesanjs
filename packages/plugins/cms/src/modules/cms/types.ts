export const CMS_MODULE = "cms"

export enum CmsCollectionKind {
  // Tek kayıt (ör. site-bundle: bütün site içeriği tek entry).
  SINGLETON = "singleton",
  // Çok kayıt (ör. blog, changelog, newsroom).
  COLLECTION = "collection",
}

export enum CmsEntryStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
}
