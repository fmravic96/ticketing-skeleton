import Link from "next/link"

import { signOut } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"

export function AppShell({
  email,
  children,
}: {
  email: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/events" className="font-medium">
              Events
            </Link>
            <Link href="/account" className="text-muted-foreground hover:text-foreground">
              Account
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8">{children}</main>
    </div>
  )
}
