import { AppShell } from "@/components/app-shell"
import { requireCurrentOrg } from "@/lib/org"

export default async function SignedInLayout({ children }: LayoutProps<"/">) {
  const { email, org, memberships } = await requireCurrentOrg()

  return (
    <AppShell email={email} org={org} memberships={memberships}>
      {children}
    </AppShell>
  )
}
