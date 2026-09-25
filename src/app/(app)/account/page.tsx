import { requireUser } from "@/lib/auth"
import { ProfileForm } from "@/components/profile-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function AccountPage() {
  const claims = await requireUser()
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", claims.sub)
    .maybeSingle()

  const email = typeof claims.email === "string" ? claims.email : ""

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">{email}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Only you can read and update this row.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm key={profile?.display_name ?? ""} displayName={profile?.display_name ?? ""} />
        </CardContent>
      </Card>
    </div>
  )
}
