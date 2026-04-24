import "next-auth/jwt"
import { prisma } from "@/db"

import NextAuth from "next-auth"
import authConfig from "./auth.config"
 
import { PrismaAdapter } from "@auth/prisma-adapter"
 
 
export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        (token as { prismaUserId?: string }).prismaUserId = user.id;
      }
      return token;
    },

    async redirect({ url, baseUrl }) {
      // Handle relative paths - allow them to pass through
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      // Handle full URLs within baseUrl
      if (url.startsWith(baseUrl)) {
        return url
      }
      
      // Default fallback to homepage
      return baseUrl
    },
   
    async session({ session, token }) {
      const email =
        (typeof session.user?.email === "string" && session.user.email) ||
        (typeof token.email === "string" && token.email) ||
        undefined;

      let dbUser = email
        ? await prisma.user.findUnique({ where: { email } })
        : null;

      const prismaUserId = (token as { prismaUserId?: string }).prismaUserId;
      if (!dbUser && prismaUserId) {
        dbUser = await prisma.user.findUnique({ where: { id: prismaUserId } });
      }

      if (dbUser) {
        session.user = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email ?? undefined,
          emailVerified: dbUser.emailVerified ?? null,
          image: dbUser.image,
          onboardingProgress: dbUser.onboardingProgress,
          targetOfferDate: dbUser.targetOfferDate,
          appsWithOutreachPerWeek: dbUser.appsWithOutreachPerWeek,
          linkedinOutreachPerWeek: dbUser.linkedinOutreachPerWeek,
          inPersonEventsPerMonth: dbUser.inPersonEventsPerMonth,
          careerFairsPerYear: dbUser.careerFairsPerYear,
          resetStartDate: dbUser.resetStartDate,
        } as typeof session.user;
      }

      return session;
    },
  }
})
