import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@16";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

// CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  try {
    // -----------------------------------------
    // 1. Handle CORS preflight request
    // -----------------------------------------
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        status: 200,
        headers: corsHeaders,
      });
    }

    // -----------------------------------------
    // 2. Allow only POST
    // -----------------------------------------
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Method not allowed",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------------------
    // 3. Get JWT
    // -----------------------------------------
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "Missing Authorization header",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------------------
    // 4. Create Supabase Client
    // -----------------------------------------
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // -----------------------------------------
    // 5. Verify logged-in user
    // -----------------------------------------
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------------------
    // 6. Read request body
    // -----------------------------------------
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({
          error: "orderId is required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------------------
    // 7. Fetch order
    // -----------------------------------------
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({
          error: "Order not found",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------------------
    // 8. Verify buyer owns the order
    // -----------------------------------------
    if (order.buyer_id !== user.id) {
      return new Response(
        JSON.stringify({
          error: "You are not allowed to pay this order",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------------------
    // 9. Make sure this is a Stripe order
    // -----------------------------------------
    if (order.payment_method !== "stripe") {
      return new Response(
        JSON.stringify({
          error: "This order is not configured for Stripe payment",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------------------
    // 10. Don't allow payment for cancelled order
    // -----------------------------------------
    if (order.status === "cancelled") {
      return new Response(
        JSON.stringify({
          error: "Cannot pay for a cancelled order",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------------------
    // 11. Already paid
    // -----------------------------------------
    if (order.payment_status === "paid") {
      return new Response(
        JSON.stringify({
          error: "Order already paid",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------------------
    // 12. Reuse existing PaymentIntent
    // -----------------------------------------
    if (order.stripe_payment_intent_id) {
      const existingIntent = await stripe.paymentIntents.retrieve(
        order.stripe_payment_intent_id
      );

      // If already succeeded, don't create another payment
      if (existingIntent.status === "succeeded") {
        return new Response(
          JSON.stringify({
            error: "Payment has already succeeded",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Reuse existing PaymentIntent
      if (existingIntent.client_secret) {
        return new Response(
          JSON.stringify({
            clientSecret: existingIntent.client_secret,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    // -----------------------------------------
    // 13. Calculate Stripe amount
    // -----------------------------------------
    const amount = Math.round(Number(order.total_amount) * 100);

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid order amount",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------------------
    // 14. Create Stripe PaymentIntent
    // -----------------------------------------
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: order.currency ?? "inr",

      automatic_payment_methods: {
        enabled: true,
      },

      metadata: {
        order_id: order.id.toString(),
        buyer_id: user.id,
      },
    });

    // -----------------------------------------
    // 15. Save PaymentIntent ID in orders
    // -----------------------------------------
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Failed to update order:", updateError);

      return new Response(
        JSON.stringify({
          error: updateError.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------------------
    // 16. Return client secret to React
    // -----------------------------------------
    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("create-payment-intent error:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Internal Server Error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});