/** Pure permission helpers — not a "use server" module (Next requires async exports there). */

export const INSTRUCTOR_ROLES = {
  ADMIN: "ADMIN",
  READ_ONLY: "READ_ONLY",
} as const;

export function canInstructorMutateUserData(instructor: { role?: string } | null) {
  if (!instructor) return false;
  return instructor.role !== INSTRUCTOR_ROLES.READ_ONLY;
}
