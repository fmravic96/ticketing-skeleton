"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { dbErrorMessage } from "@/lib/errors"
import { requireUser } from "@/lib/auth"
import { requireCurrentOrg, setCurrentOrg } from "@/lib/org"
import { createClient } from "@/lib/supabase/server"

export type OrgState = { error?: string; message?: string } | null

export async function switchOrganization(formData: FormData) {
  const slug = String(formData.get("slug") ?? "")
  const { memberships } = await requireCurrentOrg()
  if (!memberships.some((membership) => membership.slug === slug)) return
  await setCurrentOrg(slug)
  redirect("/events")
}

export async function createOrganization(
  _state: OrgState,
  formData: FormData,
): Promise<OrgState> {
  await requireUser()
  const name = String(formData.get("name") ?? "").trim()
  if (name.length < 2) return { error: "Name must be at least 2 characters." }

  const supabase = await createClient()
  const { data: orgId, error } = await supabase.rpc("create_organization", {
    org_name: name,
  })
  if (error || !orgId) {
    return { error: error ? dbErrorMessage(error) : "Could not create the organization." }
  }

  const { data: org } = await supabase.from("organizations").select("slug").eq("id", orgId).single()
  if (!org) return { error: "Organization was created but could not be opened." }
  await setCurrentOrg(org.slug)
  redirect("/events")
}

export async function renameOrganization(
  _state: OrgState,
  formData: FormData,
): Promise<OrgState> {
  const { org } = await requireCurrentOrg()
  const name = String(formData.get("name") ?? "").trim()
  if (name.length < 2) return { error: "Name must be at least 2 characters." }

  const supabase = await createClient()
  const { error } = await supabase.from("organizations").update({ name }).eq("id", org.id)
  if (error) return { error: dbErrorMessage(error) }
  revalidatePath("/members")
  return { message: "Saved." }
}

export async function inviteMember(_state: OrgState, formData: FormData): Promise<OrgState> {
  const { org } = await requireCurrentOrg()
  const email = String(formData.get("email") ?? "").trim()
  const role = String(formData.get("role") ?? "member")

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("invite_member", {
    org_id: org.id,
    member_email: email,
    member_role: role,
  })
  if (error) return { error: dbErrorMessage(error) }

  revalidatePath("/members")
  return {
    message: data === "invited" ? "Invite saved. They join when they sign up." : "Member added.",
  }
}

export async function updateMemberRole(formData: FormData) {
  const { org } = await requireCurrentOrg()
  const memberId = String(formData.get("memberId") ?? "")
  const role = String(formData.get("role") ?? "")
  const supabase = await createClient()
  await supabase.rpc("set_member_role", {
    org_id: org.id,
    member_id: memberId,
    new_role: role,
  })
  revalidatePath("/members")
}

export async function removeMember(formData: FormData) {
  const { org } = await requireCurrentOrg()
  const memberId = String(formData.get("memberId") ?? "")
  const supabase = await createClient()
  await supabase.rpc("remove_member", {
    org_id: org.id,
    member_id: memberId,
  })
  revalidatePath("/members")
}

export async function revokeInvite(formData: FormData) {
  await requireCurrentOrg()
  const inviteId = String(formData.get("inviteId") ?? "")
  const supabase = await createClient()
  await supabase.rpc("revoke_invite", { invite_id: inviteId })
  revalidatePath("/members")
}
