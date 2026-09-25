import Link from "next/link"

import { AuthForm } from "@/components/auth-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SignupPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Email and password. Confirmation is off on the local stack.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <AuthForm mode="sign-up" />
          <p className="text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
