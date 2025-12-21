"use server"

import { signIn, signOut, auth } from "auth"
import { redirect } from "next/navigation"

export async function handleSignIn(provider?: string) {
  // Check if user is already authenticated
  // This prevents issues when multiple tabs try to sign in simultaneously
  const session = await auth()
  if (session?.user) {
    // Already signed in, just redirect to dashboard
    redirect('/dashboard')
    return
  }
  
  // Explicitly redirect to dashboard after sign-in
  // Dashboard layout will handle onboarding redirects
  await signIn(provider, { redirectTo: '/dashboard' })
}

export async function handleSignOut() {
  // Redirect to homepage after sign out
  await signOut({ redirectTo: '/' })
}