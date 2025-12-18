"use server"

import { signIn, signOut } from "auth"

export async function handleSignIn(provider?: string) {
  await signIn(provider, { callbackUrl: '/dashboard' })
}

export async function handleSignOut() {
  await signOut({ redirect: false })
}