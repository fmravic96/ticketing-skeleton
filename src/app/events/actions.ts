"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { dbErrorMessage } from "@/lib/errors"
import { readEvent } from "@/lib/events"
import { eventImageObjectPath, readEventImage } from "@/lib/images"
import { requireCurrentOrg } from "@/lib/org"
import { createClient } from "@/lib/supabase/server"

export type EventFormState = { error: string } | null

async function saveEvent(eventId: string | null, formData: FormData) {
  const { org } = await requireCurrentOrg()
  const parsed = readEvent(formData)
  if (!parsed.ok) return { error: parsed.error }
  const image = readEventImage(formData.get("image"))
  if (!image.ok) return { error: image.error }

  const event = parsed.value
  const supabase = await createClient()
  let previousPath: string | null = null
  if (eventId) {
    const { data: existing } = await supabase
      .from("events")
      .select("image_path")
      .eq("id", eventId)
      .eq("organization_id", org.id)
      .maybeSingle()
    if (!existing) return { error: "Event not found." }
    previousPath = existing.image_path
  }

  let imagePath = previousPath
  let uploadedPath: string | null = null
  if (image.file) {
    uploadedPath = eventImageObjectPath(org.id, image.extension)
    const { error: uploadError } = await supabase.storage
      .from("event-images")
      .upload(uploadedPath, image.file, { contentType: image.file.type })
    if (uploadError) return { error: dbErrorMessage(uploadError) }
    imagePath = uploadedPath
  } else if (formData.get("removeImage") === "on") {
    imagePath = null
  }

  const { data, error } = await supabase.rpc("save_event", {
    event_id: eventId,
    org_id: org.id,
    event_title: event.title,
    event_description: event.description ?? "",
    event_venue: event.venue ?? "",
    event_starts_at: event.starts_at,
    event_ends_at: event.ends_at,
    event_capacity: event.capacity,
    event_status: event.status,
    tickets: event.tickets,
    event_image_path: imagePath,
  })

  if (error || !data) {
    if (uploadedPath) await supabase.storage.from("event-images").remove([uploadedPath])
    return { error: error ? dbErrorMessage(error) : "Could not save the event." }
  }
  if (previousPath && previousPath !== imagePath) {
    await supabase.storage.from("event-images").remove([previousPath])
  }
  revalidatePath("/events")
  revalidatePath(`/events/${data}`)
  redirect("/events")
}

export async function createEvent(
  _state: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  return saveEvent(null, formData)
}

export async function updateEvent(
  _state: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Event not found." }
  return saveEvent(id, formData)
}

export async function deleteEvent(formData: FormData) {
  const { org } = await requireCurrentOrg()
  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from("events")
    .select("image_path")
    .eq("id", id)
    .eq("organization_id", org.id)
    .maybeSingle()
  await supabase.from("events").delete().eq("id", id).eq("organization_id", org.id)
  if (existing?.image_path) await supabase.storage.from("event-images").remove([existing.image_path])
  revalidatePath("/events")
  redirect("/events")
}
