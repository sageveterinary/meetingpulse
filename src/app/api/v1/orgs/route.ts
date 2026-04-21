import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, apiError, apiSuccess } from "@/lib/auth-utils";
import { createOrgSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await requireAuth();
    const memberships = await prisma.orgMembership.findMany({
      where: { userId: user.id },
      include: { org: true },
    });
    return apiSuccess(memberships.map((m) => ({ ...m.org, role: m.role })));
  } catch (e: any) {
    return apiError(e.message, 401);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = createOrgSchema.parse(body);
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing) {
      return apiError("An organization with this name already exists", 409);
    }

    const org = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: data.name, slug },
      });
      await tx.orgMembership.create({
        data: { userId: user.id, orgId: org.id, role: "owner" },
      });
      return org;
    });

    return apiSuccess(org, 201);
  } catch (e: any) {
    if (e.name === "ZodError") return apiError("Invalid input", 422);
    return apiError(e.message, e.message === "Unauthorized" ? 401 : 500);
  }
}
