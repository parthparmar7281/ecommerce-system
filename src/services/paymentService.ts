// src/services/paymentService.ts

import { supabase } from "../lib/supabase-client";

export const createPaymentIntent = async (orderId: number) => {
  // Get currently logged-in user session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (!session) {
    throw new Error("User is not logged in");
  }

  // Call Supabase Edge Function
  const { data, error } = await supabase.functions.invoke(
    "create-payment-intent",
    {
      body: {
        orderId,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.clientSecret) {
    throw new Error("Payment client secret was not returned");
  }

  return data.clientSecret;
};