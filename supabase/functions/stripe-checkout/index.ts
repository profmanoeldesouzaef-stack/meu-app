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
      const { email, userId, priceId, paymentMethod } = await req.json();

      if (!priceId) {
        throw new Error("O ID do plano (priceId) é obrigatório.");
      }

      // 4. Cria ou recupera o Cliente na Stripe
      const customer = await stripe.customers.create({
        email: email || "aluno@vyra.com.br",
        metadata: { supabase_user_id: userId },
      });

      // 5. Cria uma chave temporária (Ephemeral Key) para o aplicativo abrir o cartão com segurança
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { stripeVersion: "2023-10-16" }
      );

      // 6. Cria a Assinatura (Subscription) em estado "incompleto" aguardando o pagamento
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: {
          // Define se vai gerar código PIX ou pedir Cartão
          payment_method_types: paymentMethod === "pix" ? ["pix"] : ["card"],
          save_default_payment_method: "on_subscription",
        },
        expand: ["latest_invoice.payment_intent"], // Traz o segredo de pagamento junto
      });

      // 7. Extrai o segredo do pagamento (Client Secret)
      const invoice = subscription.latest_invoice as any;
      const paymentIntent = invoice.payment_intent;

      // 8. Devolve os dados seguros para o aplicativo finalizar a cobrança
      return new Response(
        JSON.stringify({
          paymentIntent: paymentIntent.client_secret,
          ephemeralKey: ephemeralKey.secret,
          customer: customer.id,
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );

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