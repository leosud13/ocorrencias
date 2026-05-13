import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { UserRole } from "@prisma/client";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session.user;
}

export async function requireRole(role: UserRole) {
  const user = await requireUser();
  if (user.role !== role) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
