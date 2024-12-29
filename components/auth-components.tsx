"use client"

import { handleSignIn, handleSignOut } from "./auth-actions"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"

export function SignIn({
  provider,
  ...props
}: { provider?: string } & React.ComponentPropsWithRef<typeof Button>) {
  return (
    <form
      action={handleSignIn.bind(null, provider)}
    >
      <Button {...props}>Sign In</Button>
    </form>
  )
}

export function SignOut(props: React.ComponentPropsWithRef<typeof Button>) {
  const router = useRouter()

  return (
    <form
      action={async () => {
        await handleSignOut()
        router.push("/")
      }}
      className="w-full"
    >
      <Button variant="ghost" className="w-full p-0" {...props}>
        Sign Out
      </Button>
    </form>
  )
}