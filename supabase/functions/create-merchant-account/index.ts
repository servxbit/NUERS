import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, password, merchantId, businessName } = await req.json();

    if (!email || !password || !merchantId) {
      return new Response(
        JSON.stringify({ error: "email, password, and merchantId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: businessName, role: "merchant" },
    });

    if (authError) {
      // If user already exists, just return success
      if (authError.message?.includes("already been registered")) {
        return new Response(
          JSON.stringify({ success: true, message: "Account already exists for this email." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw authError;
    }

    // Create profile record
    await supabaseAdmin.from("profiles").upsert({
      id: authUser.user.id,
      email,
      role: "merchant",
      full_name: businessName,
    });

    // Link merchant record to auth user
    await supabaseAdmin
      .from("merchants")
      .update({ merchant_account_email: email })
      .eq("id", merchantId);

    return new Response(
      JSON.stringify({ success: true, userId: authUser.user.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
