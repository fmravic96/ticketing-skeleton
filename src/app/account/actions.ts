"use server"

import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export type ProfileState = { error?: string; saved?: boolean } | null

export async function updateProfile(
  _state: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const claims = await requireUser()
  const displayName = String(formData.get("displayName") ?? "").trim()
  if (!displayName) return { error: "Display name is required." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", claims.sub)

  if (error) return { error: error.message }
  revalidatePath("/account")
  return { saved: true }
}
