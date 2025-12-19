"use server"

import { signIn, signOut } from "auth"

export async function handleSignIn(provider?: string) {
  // Explicitly redirect to dashboard after sign-in
  // Dashboard layout will handle onboarding redirects
  await signIn(provider, { redirectTo: '/dashboard' })
}

export async function handleSignOut() {
  // Redirect to homepage after sign out
  await signOut({ redirectTo: '/' })
}