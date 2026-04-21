import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgMembership, apiError, apiSuccess } from "@/lib/auth-utils";
import { rosterMemberSchema } from "@/lib/validations";

export async function GET(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requireOrgMembership(orgId);
    const roster = await prisma.rosterMember.findMany({
      where: { orgId, isActive: true },
      orderBy: { name: "asc" },
    });
    return apiSuccess(roster);
  } catch (e: any) {
    return apiError(e.message, 401);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requireOrgMembership(orgId, "member");
    const body = await req.json();
    const data = rosterMemberSchema.parse(body);
    const member = await prisma.rosterMember.create({
      data: { orgId, ...data },
    });
    return apiSuccess(member, 201);
  } catch (e: any) {
    if (e.name === "ZodError") return apiError("Invalid input", 422);
    if (e.code === "P2002") return apiError("A roster member with this name already exists", 409);
    return apiError(e.message, 401);
  }
}
