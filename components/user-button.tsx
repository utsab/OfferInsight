import { auth } from "auth"
import { SignIn } from "./auth-components"
import { AuthenticatedUserButton } from "./authenticated-user-button"
import { InstructorAuthenticatedButton } from "./instructor-components"
import { getInstructorSession } from "@/app/lib/instructor-auth"
import './user-button.css';

export async function UserButton() {
  const session = await auth()
  const instructor = await getInstructorSession()
  
  // If instructor is signed in, show instructor UI
  if (instructor) {
    return <InstructorAuthenticatedButton />
  }
  
  // If regular user is signed in, show user UI
  if (session?.user) {
    return <AuthenticatedUserButton />
  }
  
  // If no one is signed in, show sign-in button
  return (
    <div className="user-button-container flex items-center space-x-2 sm:space-x-3">
      <SignIn />
    </div>
  )
}
