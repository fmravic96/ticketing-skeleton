import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import type { Database } from "@/lib/database"

function copyAuthResponse(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie)
  })
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header)
    if (value) to.headers.set(header, value)
  }
  return to
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          )
        },
      },
    },
  )

  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  const path = request.nextUrl.pathname
  const isAuthRoute = path === "/login" || path === "/signup"
  const isProtected = path.startsWith("/events") || path.startsWith("/account")

  if (!userId && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", path)
    return copyAuthResponse(supabaseResponse, NextResponse.redirect(url))
  }

  if (userId && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/events"
    url.search = ""
    return copyAuthResponse(supabaseResponse, NextResponse.redirect(url))
  }

  return supabaseResponse
}
