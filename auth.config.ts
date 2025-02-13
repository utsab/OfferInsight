import EmailProvider from "next-auth/providers/email"
import GitHub from "next-auth/providers/github"
import type { NextAuthConfig } from "next-auth"

export default {
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET
    }),
    EmailProvider({
      id: "email",
      name: "email",
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM
    })
  ]
} satisfies NextAuthConfig
