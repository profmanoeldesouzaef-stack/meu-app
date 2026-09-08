import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const RESET_12_PRICE_ID = "price_1UDGQQF7VqDt14kNHfhR3RlZ";
const TEST_PRICE_ID = "price_1UCUo4F7VqDt14kNAJolBpkp";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let event: any;
    const bodyText = await req.text();

    if (stripeWebhookSecret) {
      const signature = req.headers.get("stripe-signature") || "";
      event = stripe.webhooks.constructEvent(bodyText, signature, stripeWebhookSecret);
    } else {
      event = JSON.parse(bodyText);
    }

    console.log(`[Edge Webhook] Recebido evento: ${event.type}`);

    let metadata: any = {};
    let userId: string | null = null;
    let selectedProtocol: string | null = null;
    let priceId: string | null = null;
    let isReset = false;

    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      metadata = session?.metadata || {};
      userId = metadata?.supabase_user_id || session?.client_reference_id;
      selectedProtocol = metadata?.selected_protocol;
      priceId = metadata?.price_id;
    } else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data?.object;
      metadata = invoice?.subscription_details?.metadata || invoice?.metadata || {};
      userId = metadata?.supabase_user_id;
      selectedProtocol = metadata?.selected_protocol;
      priceId = metadata?.price_id || invoice?.lines?.data?.[0]?.price?.id;
    } else if (event.type === "payment_intent.succeeded") {
      const pi = event.data?.object;
      metadata = pi?.metadata || {};
      userId = metadata?.supabase_user_id;
      selectedProtocol = metadata?.selected_protocol;
      priceId = metadata?.price_id;
    }

    const isTestPlan = priceId === TEST_PRICE_ID || metadata?.is_test_plan === "true";

    if (priceId === RESET_12_PRICE_ID || (selectedProtocol && selectedProtocol.toLowerCase().includes("reset"))) {
      isReset = true;
      selectedProtocol = "Vyra Reset";
    } else if (isTestPlan) {
      selectedProtocol = "Plano de Teste (R$ 1,00)";
    }

    const finalProtocol = selectedProtocol || (isReset ? "Vyra Reset" : isTestPlan ? "Plano de Teste (R$ 1,00)" : "Vyra Training");
    // Regra oficial de vigência: 84 dias para Reset, 30 dias para os demais
    const daysToAdd = isReset ? 84 : 30;
    const periodEnd = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

    if (userId) {
      // 1. Atualizar status na tabela subscriptions
      await supabase
        .from("subscriptions")
        .upsert({
          user_id: userId,
          status: "active",
          plan_type: isReset ? "reset12" : isTestPlan ? "test" : "monthly",
          active_protocol: finalProtocol,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      // 2. Atualizar active_protocol e plan na tabela profiles
      await supabase
        .from("profiles")
        .update({
          active_protocol: finalProtocol,
          plan: finalProtocol,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      console.log(`[Edge Webhook] Aluno ${userId} atualizado com protocolo: ${finalProtocol}, vigência: ${periodEnd}`);
    }

    return new Response(
      JSON.stringify({ received: true, active_protocol: finalProtocol, current_period_end: periodEnd }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("[Edge Webhook Error]:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
