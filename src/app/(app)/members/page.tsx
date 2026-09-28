import { removeMember, revokeInvite, updateMemberRole } from "@/app/orgs/actions"
import { Select } from "@/components/form"
import { InviteMemberForm, RenameOrgForm } from "@/components/member-forms"
import { OrgForm } from "@/components/org-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { canManageMembers, requireCurrentOrg } from "@/lib/org"
import { createClient } from "@/lib/supabase/server"

export default async function MembersPage() {
  const { org, userId } = await requireCurrentOrg()
  const role = org.role
  const supabase = await createClient()
  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("user_id, role, profiles(display_name, email)")
      .eq("organization_id", org.id),
    supabase.from("organization_invites").select("id, email, role").eq("organization_id", org.id),
  ])

  const manage = canManageMembers(role)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">
          Owners and admins invite people. Members can work on events.
        </p>
      </div>
      <ul className="divide-y rounded-xl ring-1 ring-foreground/10">
        {(members ?? []).map((member) => {
          const profile = member.profiles
          const label = profile?.display_name || profile?.email || "Member"
          const canEditRole = role === "owner" && member.role !== "owner" && member.user_id !== userId
          const canRemove =
            manage && member.user_id !== userId && (role === "owner" || member.role === "member")

          return (
            <li
              key={member.user_id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <span>
                <span className="block font-medium">{label}</span>
                <span className="text-sm text-muted-foreground">{profile?.email}</span>
              </span>
              <span className="flex items-center gap-2">
                {canEditRole ? (
                  <form action={updateMemberRole} className="flex items-center gap-2">
                    <input type="hidden" name="memberId" value={member.user_id} />
                    <Select name="role" defaultValue={member.role} className="w-auto">
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </Select>
                    <Button type="submit" variant="outline" size="sm">
                      Save
                    </Button>
                  </form>
                ) : (
                  <span className="text-sm text-muted-foreground capitalize">{member.role}</span>
                )}
                {canRemove ? (
                  <form action={removeMember}>
                    <input type="hidden" name="memberId" value={member.user_id} />
                    <Button type="submit" variant="outline" size="sm">
                      Remove
                    </Button>
                  </form>
                ) : null}
              </span>
            </li>
          )
        })}
      </ul>
      {invites?.length ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Pending invites</h2>
          <ul className="divide-y rounded-xl ring-1 ring-foreground/10">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span>
                  <span className="block">{invite.email}</span>
                  <span className="text-sm text-muted-foreground capitalize">{invite.role}</span>
                </span>
                {manage ? (
                  <form action={revokeInvite}>
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Revoke
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {manage ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Invite</CardTitle>
              <CardDescription>
                Existing accounts are added now. New emails join on sign-up.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteMemberForm role={role} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Renaming does not change which organization is open.</CardDescription>
            </CardHeader>
            <CardContent>
              <RenameOrgForm key={org.name} name={org.name} />
            </CardContent>
          </Card>
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Another organization</CardTitle>
          <CardDescription>You become the owner, and the portal switches to it.</CardDescription>
        </CardHeader>
        <CardContent>
          <OrgForm />
        </CardContent>
      </Card>
    </div>
  )
}
