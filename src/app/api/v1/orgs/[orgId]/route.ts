import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgMembership, apiError, apiSuccess } from "@/lib/auth-utils";
import { updateOrgSchema } from "@/lib/validations";

export async function GET(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requireOrgMembership(orgId);
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return apiError("Organization not found", 404);
    return apiSuccess(org);
  } catch (e: any) {
    return apiError(e.message, 401);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requireOrgMembership(orgId, "admin");
    const body = await req.json();
    const data = updateOrgSchema.parse(body);
    const org = await prisma.organization.update({ where: { id: orgId }, data });
    return apiSuccess(org);
  } catch (e: any) {
    if (e.name === "ZodError") return apiError("Invalid input", 422);
    return apiError(e.message, 401);
  }
}
