import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgMembership, apiError, apiSuccess } from "@/lib/auth-utils";
import { updateRosterMemberSchema } from "@/lib/validations";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ orgId: string; rid: string }> }) {
  try {
    const { orgId, rid } = await params;
    await requireOrgMembership(orgId, "member");
    const body = await req.json();
    const data = updateRosterMemberSchema.parse(body);
    const member = await prisma.rosterMember.update({
      where: { id: rid, orgId },
      data,
    });
    return apiSuccess(member);
  } catch (e: any) {
    if (e.name === "ZodError") return apiError("Invalid input", 422);
    return apiError(e.message, 401);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ orgId: string; rid: string }> }) {
  try {
    const { orgId, rid } = await params;
    await requireOrgMembership(orgId, "admin");
    // Soft delete to preserve attendance history
    await prisma.rosterMember.update({
      where: { id: rid, orgId },
      data: { isActive: false },
    });
    return apiSuccess({ success: true });
  } catch (e: any) {
    return apiError(e.message, 401);
  }
}
