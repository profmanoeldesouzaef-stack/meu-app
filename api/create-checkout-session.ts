import Stripe from "stripe";

const RESET_12_PRICE_ID = "price_1UDGQQF7VqDt14kNHfhR3RlZ";
const TEST_PRICE_ID = "price_1UCUo4F7VqDt14kNAJolBpkp";

const STRIPE_PRICE_MAP: Record<string, { id: string; mode: "payment" | "subscription" }> = {
  reset12: { id: RESET_12_PRICE_ID, mode: "payment" },
  monthly: { id: "price_1U9FMDF7VqDt14kN3LneAWDA", mode: "subscription" },
  quarterly: { id: "price_1U9FMDF7VqDt14kNZhtT1hIO", mode: "subscription" },
  semiannual: { id: "price_1U9FMDF7VqDt14kNRVRuJWd0", mode: "subscription" },
  annual: { id: "price_1U9FMDF7VqDt14kNu6fxBRkh", mode: "subscription" },
  test: { id: TEST_PRICE_ID, mode: "payment" },
};

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { priceId, planSlug, recurrence, userId, userEmail, successUrl, cancelUrl } = body;

    const resolvedPlanSlug = planSlug || "quarterly";
    const resolvedRecurrence = recurrence || (resolvedPlanSlug === "reset12" ? "single" : "quarterly");

    const mappedPrice = STRIPE_PRICE_MAP[resolvedPlanSlug] || STRIPE_PRICE_MAP[resolvedRecurrence];
    const effectivePriceId = priceId || mappedPrice?.id || "price_1U9FMDF7VqDt14kN3LneAWDA";

    const isOneTime = effectivePriceId === RESET_12_PRICE_ID || resolvedPlanSlug === "reset12" || resolvedRecurrence === "single";
    const sessionMode = isOneTime ? "payment" : "subscription";

    const host = req.headers["x-forwarded-host"] || req.headers.host || "vyratraining.com";
    const proto = req.headers["x-forwarded-proto"] || "https";
    const defaultOrigin = `${proto}://${host}`;

    const officialSuccessUrl = successUrl || `${defaultOrigin}/sucesso?session_id={CHECKOUT_SESSION_ID}`;
    const officialCancelUrl = cancelUrl || `${defaultOrigin}/protocolos`;

    // Direct Stripe Payment Link configured via environment variable
    const envPaymentLink =
      process.env[`STRIPE_PAYMENT_LINK_${resolvedRecurrence.toUpperCase()}`] ||
      process.env[`STRIPE_PAYMENT_LINK_${resolvedPlanSlug.toUpperCase()}`] ||
      process.env.STRIPE_PAYMENT_LINK;

    if (envPaymentLink) {
      return res.status(200).json({
        url: envPaymentLink,
        success: true,
      });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (stripeSecretKey) {
      const stripeClient = new Stripe(stripeSecretKey, {
        apiVersion: "2023-10-16" as any,
      });

      const sessionPayload: any = {
        payment_method_types: ["card"],
        mode: sessionMode,
        success_url: officialSuccessUrl,
        cancel_url: officialCancelUrl,
        client_reference_id: userId || undefined,
        customer_email: userEmail || undefined,
        metadata: {
          supabase_user_id: userId || "",
          plan_slug: resolvedPlanSlug,
          recurrence: resolvedRecurrence,
          price_id: effectivePriceId,
        },
        line_items: [{ price: effectivePriceId, quantity: 1 }],
      };

      const session = await stripeClient.checkout.sessions.create(sessionPayload);
      if (session && session.url) {
        return res.status(200).json({
          url: session.url,
          sessionId: session.id,
          success: true,
        });
      }
    }

    // Fallback safe direct URL
    const fallbackUrl = `https://vyratraining.com/protocolos?plan=${encodeURIComponent(resolvedPlanSlug)}&priceId=${encodeURIComponent(effectivePriceId)}&cycle=${encodeURIComponent(resolvedRecurrence)}${userEmail ? `&email=${encodeURIComponent(userEmail)}` : ""}${userId ? `&uid=${encodeURIComponent(userId)}` : ""}`;

    return res.status(200).json({
      url: fallbackUrl,
      fallback: true,
      success: true,
    });
  } catch (error: any) {
    console.error("[Vercel Function /api/create-checkout-session] Error:", error);
    return res.status(500).json({ error: error.message || "Erro ao iniciar checkout na Stripe" });
  }
}
