import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    maxUsers: 10,
    maxMeetingTypes: 5,
    historyRetentionDays: 90,
    features: ["Up to 10 team members", "5 meeting templates", "90 days history", "Browser audio cues", "Basic CSV export"],
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    price: 29,
    maxUsers: 50,
    maxMeetingTypes: 999,
    historyRetentionDays: -1, // unlimited
    features: ["Up to 50 team members", "Unlimited templates", "Unlimited history", "ElevenLabs AI voice", "Advanced reporting"],
  },
  enterprise: {
    name: "Enterprise",
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    price: null, // custom
    maxUsers: 999,
    maxMeetingTypes: 999,
    historyRetentionDays: -1,
    features: ["Unlimited everything", "SSO/SAML", "API access", "White-label option", "Dedicated support"],
  },
} as const;
