import Link from "next/link"

import { signOut } from "@/app/auth/actions"
import { switchOrganization } from "@/app/orgs/actions"
import { Button } from "@/components/ui/button"
import type { Membership } from "@/lib/org"

export function AppShell({
  email,
  org,
  memberships,
  children,
}: {
  email: string
  org: Membership
  memberships: Membership[]
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-4">
            <p className="truncate text-sm font-medium">{org.name}</p>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/events">Events</Link>
              <Link href="/members" className="text-muted-foreground hover:text-foreground">
                Members
              </Link>
              <Link href="/account" className="text-muted-foreground hover:text-foreground">
                Account
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
        {memberships.length > 1 ? (
          <div className="mx-auto flex w-full max-w-3xl gap-3 px-4 pb-3 text-sm">
            {memberships.map((membership) => (
              <form key={membership.slug} action={switchOrganization}>
                <input type="hidden" name="slug" value={membership.slug} />
                <button
                  type="submit"
                  className={
                    membership.slug === org.slug
                      ? "font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }
                >
                  {membership.name}
                </button>
              </form>
            ))}
          </div>
        ) : null}
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8">{children}</main>
    </div>
  )
}
