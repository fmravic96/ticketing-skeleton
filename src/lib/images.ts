const imageTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const

export type EventImageExtension = (typeof imageTypes)[keyof typeof imageTypes]

export const eventImageMaxBytes = 2 * 1024 * 1024

export function readEventImage(
  value: FormDataEntryValue | null,
):
  | { ok: true; file: null }
  | { ok: true; file: File; extension: EventImageExtension }
  | { ok: false; error: string } {
  if (!(value instanceof File) || value.size === 0) return { ok: true, file: null }
  const extension = imageTypes[value.type as keyof typeof imageTypes]
  if (!extension) return { ok: false, error: "Image must be a JPEG, PNG, or WebP." }
  if (value.size > eventImageMaxBytes) return { ok: false, error: "Image must be 2 MB or smaller." }
  return { ok: true, file: value, extension }
}

export function eventImageObjectPath(orgId: string, extension: EventImageExtension) {
  return `${orgId}/${crypto.randomUUID()}.${extension}`
}

export function eventImageUrl(path: string | null) {
  if (!path) return null
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  return `${base}/storage/v1/object/public/event-images/${path}`
}
