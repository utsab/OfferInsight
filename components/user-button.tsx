import { Button } from "./ui/button"
import { auth } from "auth"
import { SignIn, SignOut } from "./auth-components"

export async function UserButton() {
  const session = await auth()
  console.log("asdfasdfasdfasdfkasjhdlfkajsh")
  console.log(session?.user)
  if (!session?.user) return <SignIn />
  return <SignOut />
}
