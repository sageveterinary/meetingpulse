import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgMembership, apiError, apiSuccess } from "@/lib/auth-utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requireOrgMembership(orgId);
    const members = await prisma.orgMembership.findMany({
      where: { orgId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });
    return apiSuccess(members);
  } catch (e: any) {
    return apiError(e.message, 401);
  }
}
