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
  const router = useRouter();

  const onSignOut = async () => {
    await handleSignOut();
    router.push("/");
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSignOut();
      }}
    >
      <Button variant="ghost" {...props}>
        Sign Out
      </Button>
    </form>
  );
}