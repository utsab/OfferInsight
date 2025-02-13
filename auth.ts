import "next-auth/jwt"
import { prisma } from "@/db"

import NextAuth from "next-auth"
import authConfig from "./auth.config"
 
import { PrismaClient } from "@prisma/client"
import { PrismaAdapter } from "@auth/prisma-adapter"
 
 
export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
})



// export const { handlers, auth, signIn, signOut } = NextAuth({
//   debug: !!process.env.AUTH_DEBUG,
//   theme: { logo: "https://authjs.dev/img/logo-sm.png" },
//   providers: [
//     GitHub({
//       clientId: process.env.AUTH_GITHUB_ID,
//       clientSecret: process.env.AUTH_GITHUB_SECRET
//     }),
//     EmailProvider({
//       server: process.env.EMAIL_SERVER,
//       from: process.env.EMAIL_FROM
//     })
//   ],
//   secret: process.env.AUTH_SECRET,
//   basePath: "/auth",
//   session: { strategy: "jwt" },
//   callbacks: {
//     async signIn({ user, account, profile }) {

//       try {

//         const existingUser = await prisma.user.findUnique({
//           where: { email: user.email },
//         })


//         if (!existingUser) {
//           await prisma.user.create({
//             data: {
//               id: user.id,
//               name: user.name,
//               email: user.email,
//             },
//           })
//         }
//         return true
//       } catch (error) {
//         //console.error("Error checking or creating user:", error)
//         console.log("Error checking or creating user:", error.stack)
//         return false
//       }
//     },
//     authorized({ request, auth }) {
//       const { pathname } = request.nextUrl
//       if (pathname.startsWith("/dashboard")) return !!auth
//       return true
//     },
//     jwt({ token, trigger, session, account }) {
//       if (trigger === "update") token.name = session.user.name
//       if (account?.provider === "keycloak") {
//         return { ...token, accessToken: account.access_token }
//       }
//       return token
//     },
//     async session({ session, token }) {
//       if (token?.accessToken) session.accessToken = token.accessToken

//       return session
//     },
//   },
//   experimental: { enableWebAuthn: true },
// })

// declare module "next-auth" {
//   interface Session {
//     accessToken?: string
//   }
// }

// declare module "next-auth/jwt" {
//   interface JWT {
//     accessToken?: string
//   }
// }