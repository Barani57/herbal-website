import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('PHONEPE_CLIENT_ID')!;
    const clientSecret = Deno.env.get('PHONEPE_CLIENT_SECRET')!;
    const clientVersion = Deno.env.get('PHONEPE_CLIENT_VERSION')!;

    console.log('🔐 Generating PhonePe Auth Token...');

    // Generate auth token
    const tokenUrl = 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token';
    
    const params = new URLSearchParams({
      'client_id': clientId,
      'client_version': clientVersion,
      'client_secret': clientSecret,
      'grant_type': 'client_credentials'
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json();
    console.log('✅ Auth Token Response:', data);

    if (data.access_token) {
      return new Response(
        JSON.stringify({
          success: true,
          accessToken: data.access_token,
          expiresAt: data.expires_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error('Failed to generate token');
    }

  } catch (error) {
    console.error('❌ Auth Token Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});