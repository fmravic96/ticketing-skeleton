"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { dbErrorMessage } from "@/lib/errors"
import { readEvent } from "@/lib/events"
import { requireCurrentOrg } from "@/lib/org"
import { createClient } from "@/lib/supabase/server"

export type EventFormState = { error: string } | null

async function saveEvent(eventId: string | null, formData: FormData) {
  const { org } = await requireCurrentOrg()
  const parsed = readEvent(formData)
  if (!parsed.ok) return { error: parsed.error }

  const event = parsed.value
  const supabase = await createClient()
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
  })

  if (error || !data) return { error: error ? dbErrorMessage(error) : "Could not save the event." }
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
  await supabase.from("events").delete().eq("id", id).eq("organization_id", org.id)
  revalidatePath("/events")
  redirect("/events")
}
