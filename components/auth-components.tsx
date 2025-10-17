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
      <Button 
        className="bg-electric-blue hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        {...props}
      >
        Sign In
      </Button>
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
      <Button 
        variant="ghost" 
        className="text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
        {...props}
      >
        Sign Out
      </Button>
    </form>
  );
}