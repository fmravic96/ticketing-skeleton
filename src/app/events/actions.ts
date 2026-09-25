"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export type EventFormState = { error: string } | null

function readEvent(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim()
  const startsAtRaw = String(formData.get("startsAt") ?? "")
  const capacity = Number(formData.get("capacity"))
  const startsAt = new Date(startsAtRaw)

  if (!title) return { ok: false as const, error: "Title is required." }
  if (Number.isNaN(startsAt.getTime())) {
    return { ok: false as const, error: "Start time is required." }
  }
  if (!Number.isInteger(capacity) || capacity < 1) {
    return { ok: false as const, error: "Capacity must be a whole number greater than zero." }
  }

  return {
    ok: true as const,
    title,
    starts_at: startsAt.toISOString(),
    capacity,
  }
}

export async function createEvent(
  _state: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const claims = await requireUser()
  const parsed = readEvent(formData)
  if (!parsed.ok) return { error: parsed.error }

  const supabase = await createClient()
  const { error } = await supabase.from("events").insert({
    owner_id: claims.sub,
    title: parsed.title,
    starts_at: parsed.starts_at,
    capacity: parsed.capacity,
  })

  if (error) return { error: error.message }
  revalidatePath("/events")
  redirect("/events")
}

export async function updateEvent(
  _state: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireUser()
  const id = String(formData.get("id") ?? "")
  const parsed = readEvent(formData)
  if (!parsed.ok) return { error: parsed.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("events")
    .update({
      title: parsed.title,
      starts_at: parsed.starts_at,
      capacity: parsed.capacity,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: "Event not found." }
  revalidatePath("/events")
  revalidatePath(`/events/${id}`)
  redirect("/events")
}

export async function deleteEvent(formData: FormData) {
  await requireUser()
  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase.from("events").delete().eq("id", id)
  revalidatePath("/events")
  redirect("/events")
}
