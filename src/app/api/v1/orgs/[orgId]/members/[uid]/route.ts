import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgMembership, apiError, apiSuccess } from "@/lib/auth-utils";
import { updateMemberRoleSchema } from "@/lib/validations";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ orgId: string; uid: string }> }) {
  try {
    const { orgId, uid } = await params;
    const { membership: callerMembership } = await requireOrgMembership(orgId, "admin");
    const body = await req.json();
    const data = updateMemberRoleSchema.parse(body);

    const targetMembership = await prisma.orgMembership.findUnique({
      where: { userId_orgId: { userId: uid, orgId } },
    });
    if (!targetMembership) return apiError("Member not found", 404);
    if (targetMembership.role === "owner") return apiError("Cannot change the owner's role", 403);
    if (callerMembership.role !== "owner" && targetMembership.role === "admin") {
      return apiError("Only owners can change admin roles", 403);
    }

    const updated = await prisma.orgMembership.update({
      where: { userId_orgId: { userId: uid, orgId } },
      data: { role: data.role as any },
    });
    return apiSuccess(updated);
  } catch (e: any) {
    return apiError(e.message, 401);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ orgId: string; uid: string }> }) {
  try {
    const { orgId, uid } = await params;
    const { user, membership: callerMembership } = await requireOrgMembership(orgId, "admin");

    const targetMembership = await prisma.orgMembership.findUnique({
      where: { userId_orgId: { userId: uid, orgId } },
    });
    if (!targetMembership) return apiError("Member not found", 404);
    if (targetMembership.role === "owner") return apiError("Cannot remove the owner", 403);
    // Allow self-removal
    if (uid !== user.id && callerMembership.role !== "owner" && targetMembership.role === "admin") {
      return apiError("Only owners can remove admins", 403);
    }

    await prisma.orgMembership.delete({ where: { userId_orgId: { userId: uid, orgId } } });
    return apiSuccess({ success: true });
  } catch (e: any) {
    return apiError(e.message, 401);
  }
}
