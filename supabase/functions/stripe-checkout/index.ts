import "npm:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@^14.0.0";
import { createClient } from "npm:@supabase/supabase-js@2";

// Configuração do CORS para permitir que o aplicativo converse com esta função
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export default {
  async fetch(req: Request) {
    // 1. Responde rapidamente ao "Preflight" (Checagem de segurança do navegador/app)
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    try {
      // 2. Inicializa a Stripe usando a chave secreta que vamos colocar no painel do Supabase
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2023-10-16",
        httpClient: Stripe.createFetchHttpClient(),
      });

      // 3. Pega os dados que o seu aplicativo vai mandar lá da tela checkout.tsx
      const { email, userId, priceId, paymentMethod, selected_protocol, metadata } = await req.json();

      if (!priceId) {
        throw new Error("O ID do plano (priceId) é obrigatório.");
      }

      const RESET_PRICE_ID = "price_1UDGQQF7VqDt14kNHfhR3RlZ";
      const TEST_PRICE_ID = "price_1UCUo4F7VqDt14kNAJolBpkp";

      const isTestPrice = priceId === TEST_PRICE_ID;
      const isResetPrice = priceId === RESET_PRICE_ID;

      const protocolName =
        selected_protocol ||
        metadata?.selected_protocol ||
        (isResetPrice ? "Vyra Reset" : isTestPrice ? "Plano de Teste (R$ 1,00)" : "Vyra Training");

      const sessionMetadata = {
        supabase_user_id: userId || "",
        selected_protocol: protocolName,
        price_id: priceId,
        is_test_plan: isTestPrice ? "true" : "false",
        ...(metadata || {}),
      };

      // 4. Cria ou recupera o Cliente na Stripe
      const customer = await stripe.customers.create({
        email: email || "aluno@vyra.com.br",
        metadata: sessionMetadata,
      });

      // 5. Cria uma chave temporária (Ephemeral Key) para o aplicativo abrir o cartão com segurança
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { stripeVersion: "2023-10-16" }
      );

      // Verificação dinâmica do tipo de preço na Stripe (recorrente vs pagamento único)
      let priceType = "recurring";
      let priceUnitAmount = isTestPrice ? 100 : 47990;

      try {
        const retrievedPrice = await stripe.prices.retrieve(priceId);
        if (retrievedPrice) {
          priceType = retrievedPrice.type; // 'recurring' ou 'one_time'
          if (retrievedPrice.unit_amount) {
            priceUnitAmount = retrievedPrice.unit_amount;
          }
        }
      } catch (priceErr: any) {
        console.warn("[Stripe Checkout] Não foi possível inspecionar preço na Stripe:", priceErr.message);
        // Fallback baseado em IDs conhecidos
        if (isResetPrice) priceType = "one_time";
      }

      // Se for pagamento único (one_time ou Reset): mode 'payment'
      if (priceType === "one_time" || isResetPrice) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: priceUnitAmount,
          currency: "brl",
          customer: customer.id,
          payment_method_types: paymentMethod === "pix" ? ["pix"] : ["card"],
          metadata: sessionMetadata,
          description: isTestPrice
            ? "Vyra - Plano de Teste (R$ 1,00)"
            : `Vyra Reset - Programa de 12 Semanas (${protocolName})`,
        });

        return new Response(
          JSON.stringify({
            mode: "payment",
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customer.id,
            selected_protocol: protocolName,
            priceId,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      // 6. Demais planos ou preços recorrentes: Cria a Assinatura (Subscription com mode: 'subscription')
      try {
        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: priceId }],
          payment_behavior: "default_incomplete",
          metadata: sessionMetadata,
          payment_settings: {
            payment_method_types: paymentMethod === "pix" ? ["pix"] : ["card"],
            save_default_payment_method: "on_subscription",
          },
          expand: ["latest_invoice.payment_intent"],
        });

        const invoice = subscription.latest_invoice as any;
        const paymentIntent = invoice?.payment_intent;

        return new Response(
          JSON.stringify({
            mode: "subscription",
            subscriptionId: subscription.id,
            paymentIntent: paymentIntent?.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customer.id,
            selected_protocol: protocolName,
            priceId,
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }, 
            status: 200 
          }
        );
      } catch (subErr: any) {
        // Se a Stripe rejeitar como assinatura por ser um preço one_time, realiza o fallback automático para paymentIntent
        if (subErr?.message?.includes("recurring") || subErr?.message?.includes("one-time") || subErr?.message?.includes("subscription")) {
          console.log("[Stripe Checkout] Fallback automático para modo payment...");
          const paymentIntent = await stripe.paymentIntents.create({
            amount: priceUnitAmount,
            currency: "brl",
            customer: customer.id,
            payment_method_types: paymentMethod === "pix" ? ["pix"] : ["card"],
            metadata: sessionMetadata,
            description: `Vyra - ${protocolName}`,
          });

          return new Response(
            JSON.stringify({
              mode: "payment",
              paymentIntent: paymentIntent.client_secret,
              ephemeralKey: ephemeralKey.secret,
              customer: customer.id,
              selected_protocol: protocolName,
              priceId,
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        }
        throw subErr;
      }

    } catch (error: any) {
      console.error("Erro na integração com Stripe:", error.message);
      return new Response(
        JSON.stringify({ error: error.message }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }
  }
};