import Link from "next/link"

import { AuthForm } from "@/components/auth-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use the email and password for your organizer account.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <AuthForm mode="sign-in" nextPath={next} />
          <p className="text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/signup" className="text-foreground underline-offset-4 hover:underline">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
