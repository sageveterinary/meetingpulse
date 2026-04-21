import { NextRequest } from "next/server";
import { stripe, PLANS } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.orgId;
      const plan = session.metadata?.plan as keyof typeof PLANS;
      if (orgId && plan && plan in PLANS) {
        const planConfig = PLANS[plan];
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            subscriptionTier: plan as any,
            subscriptionStatus: "active",
            stripeSubscriptionId: session.subscription as string,
            maxUsers: planConfig.maxUsers,
            maxMeetingTypes: planConfig.maxMeetingTypes,
            historyRetentionDays: planConfig.historyRetentionDays,
          },
        });
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as any;
      if (invoice.subscription) {
        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: invoice.subscription as string },
        });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { subscriptionStatus: "active" },
          });
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      if (invoice.subscription) {
        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: invoice.subscription as string },
        });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { subscriptionStatus: "past_due" },
          });
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const org = await prisma.organization.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (org) {
        const freeConfig = PLANS.free;
        await prisma.organization.update({
          where: { id: org.id },
          data: {
            subscriptionTier: "free",
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null,
            maxUsers: freeConfig.maxUsers,
            maxMeetingTypes: freeConfig.maxMeetingTypes,
            historyRetentionDays: freeConfig.historyRetentionDays,
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const org = await prisma.organization.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (org) {
        const status = subscription.status === "active" ? "active"
          : subscription.status === "trialing" ? "trialing"
          : subscription.status === "past_due" ? "past_due"
          : "canceled";
        await prisma.organization.update({
          where: { id: org.id },
          data: { subscriptionStatus: status as any },
        });
      }
      break;
    }
  }

  return new Response("OK", { status: 200 });
}
