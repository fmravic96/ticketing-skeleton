import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { getClaims } from "@/lib/auth"

export default async function HomePage() {
  const claims = await getClaims()
  if (claims?.sub) redirect("/events")

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-4 py-16">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Organizer workspace</p>
        <h1 className="text-4xl font-medium tracking-tight">Events you run, in one list.</h1>
        <p className="max-w-md text-muted-foreground">
          Sign in to keep a profile and the events you own. Tickets, holds, and payments come later.
        </p>
      </div>
      <div className="flex gap-3">
        <Button nativeButton={false} render={<Link href="/signup" />}>
          Create account
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/login" />}>
          Sign in
        </Button>
      </div>
    </main>
  )
}
