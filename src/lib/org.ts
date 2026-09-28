import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export type OrgRole = "owner" | "admin" | "member"

export const currentOrgCookie = "current_org"

export type Membership = {
  id: string
  name: string
  slug: string
  role: OrgRole
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
}

export function canManageMembers(role: OrgRole) {
  return role === "owner" || role === "admin"
}

export async function listMemberships(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name, slug)")
    .eq("user_id", userId)

  return (data ?? []).flatMap((membership) => {
    const organization = membership.organizations
    if (!organization) return []
    return [
      {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        role: membership.role,
      } satisfies Membership,
    ]
  })
}

export async function setCurrentOrg(slug: string) {
  const cookieStore = await cookies()
  cookieStore.set(currentOrgCookie, slug, cookieOptions)
}

export async function clearCurrentOrg() {
  const cookieStore = await cookies()
  cookieStore.set(currentOrgCookie, "", { ...cookieOptions, maxAge: 0 })
}

export async function requireCurrentOrg() {
  const claims = await requireUser()
  const memberships = await listMemberships(claims.sub)
  if (memberships.length === 0) redirect("/signup")

  const slug = (await cookies()).get(currentOrgCookie)?.value
  const current = memberships.find((membership) => membership.slug === slug)
  if (!current) redirect(`/enter?org=${memberships[0].slug}`)

  const email = typeof claims.email === "string" ? claims.email : ""
  return { org: current, memberships, userId: claims.sub, email }
}
