import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Generate a 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Invalidate previous unused codes for this email
    await supabaseAdmin
      .from('otp_codes')
      .update({ used: true })
      .eq('email', email.toLowerCase())
      .eq('used', false);

    // Store the new OTP
    const { error: insertError } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        email: email.toLowerCase(),
        code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      throw new Error(`Failed to store OTP: ${insertError.message}`);
    }

    // Send email via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GeoSnap <onboarding@resend.dev>',
        to: [email],
        subject: `${code} is your GeoSnap verification code`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 24px; color: #111; margin: 0;">GeoSnap</h1>
              <p style="color: #666; margin-top: 4px;">Location-verified photos</p>
            </div>
            <div style="background: #f8f8f8; border-radius: 12px; padding: 32px; text-align: center;">
              <p style="color: #666; margin: 0 0 16px;">Your verification code is:</p>
              <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111; margin: 16px 0;">${code}</div>
              <p style="color: #999; font-size: 13px; margin: 16px 0 0;">This code expires in 10 minutes.</p>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">If you didn't request this code, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    const emailData = await emailRes.json();
    if (!emailRes.ok) {
      throw new Error(`Resend error: ${JSON.stringify(emailData)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
