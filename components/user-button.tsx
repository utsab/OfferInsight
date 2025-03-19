import { Button } from "./ui/button"
import { auth } from "auth"
import { SignIn, SignOut } from "./auth-components"
import './user-button.css';

export async function UserButton() {
  const session = await auth()
  if (!session?.user) return <div className="user-button-container"><SignIn /></div>
  return <div className="user-button-container"><SignOut /></div>
}
