import { getSession, type SessionData } from "@/lib/auth";
import { db } from "@/lib/db";
import { familyMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type Permission = "locations" | "events" | "members";

export async function checkPermission(
  permission: Permission
): Promise<SessionData | null> {
  const session = await getSession();
  if (!session.isLoggedIn) return null;
  if (session.isAdmin) return session;

  const member = await db.query.familyMembers.findFirst({
    where: eq(familyMembers.id, session.memberId),
  });
  if (!member) return null;

  const permMap: Record<Permission, boolean> = {
    locations: member.canManageLocations,
    events: member.canManageEvents,
    members: member.canManageMembers,
  };

  return permMap[permission] ? session : null;
}
