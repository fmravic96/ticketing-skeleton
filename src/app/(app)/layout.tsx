import { AppShell } from "@/components/app-shell"
import { requireUser } from "@/lib/auth"

export default async function SignedInLayout({ children }: LayoutProps<"/">) {
  const claims = await requireUser()
  const email = typeof claims.email === "string" ? claims.email : ""

  return <AppShell email={email}>{children}</AppShell>
}
