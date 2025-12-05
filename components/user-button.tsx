import { auth } from "auth"
import { SignIn } from "./auth-components"
import { AuthenticatedUserButton } from "./authenticated-user-button"
import './user-button.css';

export async function UserButton() {
  const session = await auth()
  if (!session?.user) return <div className="user-button-container"><SignIn /></div>
  
  return <AuthenticatedUserButton />
}
