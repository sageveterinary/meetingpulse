import { NextRequest } from "next/server";
import { getStripe, PLANS } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { requireOrgMembership, apiError, apiSuccess } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgId, plan } = body;
    if (!orgId || !plan || !["pro", "enterprise"].includes(plan)) {
      return apiError("Invalid plan selection", 400);
    }

    const { user } = await requireOrgMembership(orgId, "owner");
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return apiError("Organization not found", 404);

    const planConfig = PLANS[plan as keyof typeof PLANS];
    if (!("priceId" in planConfig) || !planConfig.priceId) {
      return apiError("This plan is not available for self-service checkout", 400);
    }

    // Create or retrieve Stripe customer
    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email!,
        metadata: { orgId: org.id, orgName: org.name },
      });
      customerId = customer.id;
      await prisma.organization.update({
        where: { id: orgId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/org/${org.slug}/settings/billing?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/org/${org.slug}/settings/billing?canceled=true`,
      metadata: { orgId: org.id, plan },
    });

    return apiSuccess({ url: session.url });
  } catch (e: any) {
    return apiError(e.message, 500);
  }
}
