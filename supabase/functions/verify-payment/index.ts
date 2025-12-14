import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { merchantTransactionId } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get order from database
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('phonepe_merchant_transaction_id', merchantTransactionId)
      .single()

    if (!order) {
      throw new Error('Order not found')
    }

    // Check with PhonePe
    const merchantId = Deno.env.get('PHONEPE_MERCHANT_ID')!
    const clientSecret = Deno.env.get('PHONEPE_CLIENT_SECRET')!
    const env = Deno.env.get('PHONEPE_ENV') || 'UAT'
    const baseUrl = env === 'PROD' 
      ? 'https://api.phonepe.com' 
      : 'https://api-preprod.phonepe.com'

    // Get OAuth token
    const tokenResponse = await fetch(`${baseUrl}/apis/pg-sandbox/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: merchantId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      })
    })

    const tokenData = await tokenResponse.json()

    // Check payment status
    const statusResponse = await fetch(
      `${baseUrl}/apis/pg-sandbox/v1/pg/${merchantId}/${merchantTransactionId}/status`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      }
    )

    const statusData = await statusResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        paymentStatus: order.payment_status,
        phonepeStatus: statusData.code,
        order: order
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Verify error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})