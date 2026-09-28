import { NextResponse } from "next/server"

import { getClaims } from "@/lib/auth"
import { listMemberships, setCurrentOrg } from "@/lib/org"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const claims = await getClaims()
  if (!claims?.sub) {
    return NextResponse.redirect(new URL("/login", url.origin))
  }

  const memberships = await listMemberships(claims.sub)
  const requested = url.searchParams.get("org")
  const chosen = memberships.find((membership) => membership.slug === requested) ?? memberships[0]
  if (!chosen) {
    return NextResponse.redirect(new URL("/signup", url.origin))
  }

  await setCurrentOrg(chosen.slug)
  const next = url.searchParams.get("next")
  const destination =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/events"
  return NextResponse.redirect(new URL(destination, url.origin))
}
