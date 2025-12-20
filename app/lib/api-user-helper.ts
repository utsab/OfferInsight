"use server";

import { auth } from "@/auth";
import { getInstructorSession } from "@/app/lib/instructor-auth";
import { prisma } from "@/db";
import { NextRequest } from "next/server";

/**
 * Helper function to determine which userId to use for API requests.
 * 
 * - If userId query parameter is provided, checks if requester is an instructor
 * - If instructor, returns the provided userId
 * - If not instructor but userId provided, returns null (unauthorized)
 * - If no userId param, returns the session user's id
 * 
 * @param request - The NextRequest object containing query parameters
 * @returns Object with userId and error (if any)
 */
export async function getUserIdForRequest(request: NextRequest | Request): Promise<{ userId: string | null; error: string | null }> {
  const session = await auth();
  
  // Check for userId query parameter
  const url = new URL(request.url);
  const userIdParam = url.searchParams.get("userId");

  // If no userId param, use session user's ID
  if (!userIdParam) {
    if (!session?.user?.id && !session?.user?.email) {
      return { userId: null, error: "Unauthorized" };
    }

    // Handle both session.user.id and session.user.email cases
    if (session.user.id) {
      return { userId: session.user.id, error: null };
    }

    // If using email, fetch user to get ID
    if (session.user.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (!user) {
        return { userId: null, error: "User not found" };
      }
      return { userId: user.id, error: null };
    }

    return { userId: null, error: "Unauthorized" };
  }

  // userId param is provided - check if requester is instructor
  const instructor = await getInstructorSession();
  if (!instructor) {
    return { userId: null, error: "Unauthorized: Only instructors can view other users' data" };
  }

  // Verify the userId exists
  const targetUser = await prisma.user.findUnique({
    where: { id: userIdParam },
    select: { id: true },
  });

  if (!targetUser) {
    return { userId: null, error: "User not found" };
  }

  return { userId: userIdParam, error: null };
}

/**
 * Helper function for GET requests that only need request URL (NextRequest)
 */
export async function getUserIdFromRequest(request: Request): Promise<{ userId: string | null; error: string | null }> {
  return getUserIdForRequest(request);
}

