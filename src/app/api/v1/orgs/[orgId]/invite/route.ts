import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgMembership, apiError, apiSuccess } from "@/lib/auth-utils";
import { inviteMemberSchema } from "@/lib/validations";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requireOrgMembership(orgId, "admin");
    const body = await req.json();
    const data = inviteMemberSchema.parse(body);

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      const existingMembership = await prisma.orgMembership.findUnique({
        where: { userId_orgId: { userId: existingUser.id, orgId } },
      });
      if (existingMembership) {
        return apiError("User is already a member of this organization", 409);
      }
    }

    // Check org user limits
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    const memberCount = await prisma.orgMembership.count({ where: { orgId } });
    if (org && memberCount >= org.maxUsers) {
      return apiError(`Organization has reached the maximum of ${org.maxUsers} members. Upgrade your plan to add more.`, 403);
    }

    const token = randomBytes(32).toString("hex");
    const invitation = await prisma.orgInvitation.upsert({
      where: { orgId_email: { orgId, email: data.email } },
      update: { role: data.role as any, token, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      create: {
        orgId,
        email: data.email,
        role: data.role as any,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // TODO: Send invitation email via a transactional email service
    return apiSuccess({ invitation, inviteUrl: `${process.env.NEXTAUTH_URL}/invite/${token}` }, 201);
  } catch (e: any) {
    if (e.name === "ZodError") return apiError("Invalid input", 422);
    return apiError(e.message, 401);
  }
}
