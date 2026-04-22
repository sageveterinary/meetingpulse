import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { requireOrgMembership, apiError, apiSuccess } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgId } = body;
    const { } = await requireOrgMembership(orgId, "owner");
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org?.stripeCustomerId) return apiError("No billing account found", 404);

    const session = await getStripe().billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/org/${org.slug}/settings/billing`,
    });

    return apiSuccess({ url: session.url });
  } catch (e: any) {
    return apiError(e.message, 500);
  }
}
