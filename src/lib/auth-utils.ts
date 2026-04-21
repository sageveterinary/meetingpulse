import { auth } from "./auth";
import { prisma } from "./db";
import { OrgRole } from "@prisma/client";
import { NextResponse } from "next/server";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireOrgMembership(orgId: string, minRole?: OrgRole) {
  const user = await requireAuth();
  const membership = await prisma.orgMembership.findUnique({
    where: { userId_orgId: { userId: user.id, orgId } },
  });
  if (!membership) {
    throw new Error("Not a member of this organization");
  }
  const roleHierarchy: OrgRole[] = ["viewer", "member", "admin", "owner"];
  if (minRole) {
    const userLevel = roleHierarchy.indexOf(membership.role);
    const requiredLevel = roleHierarchy.indexOf(minRole);
    if (userLevel < requiredLevel) {
      throw new Error("Insufficient permissions");
    }
  }
  return { user, membership };
}

export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess(data: unknown, status: number = 200) {
  return NextResponse.json(data, { status });
}
