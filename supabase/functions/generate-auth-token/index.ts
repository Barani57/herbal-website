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
    console.log('🔐 Generating PhonePe Auth Token...');

    const clientId = Deno.env.get('PHONEPE_CLIENT_ID');
    const clientSecret = Deno.env.get('PHONEPE_CLIENT_SECRET');
    const clientVersion = Deno.env.get('PHONEPE_CLIENT_VERSION');

    if (!clientId || !clientSecret || !clientVersion) {
      throw new Error('Missing PhonePe credentials');
    }

    // ✅ CRITICAL: Build form data EXACTLY like PowerShell
    const params = new URLSearchParams();
    params.append('client_version', clientVersion);
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    const tokenUrl = 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token';
    
    console.log('📤 Calling PhonePe API...');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PhonePe error:', errorText);
      throw new Error(`PhonePe returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.access_token) {
      throw new Error('No access_token in response');
    }

    console.log('✅ Token generated');
    
    return new Response(
      JSON.stringify({
        success: true,
        accessToken: data.access_token,
        expiresAt: data.expires_at
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});