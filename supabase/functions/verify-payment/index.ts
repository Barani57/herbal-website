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
    
    console.log('Verifying payment for:', merchantTransactionId)
    
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

    console.log('Order found:', order.order_number, 'Status:', order.payment_status)

    // Get PhonePe credentials
    const clientId = Deno.env.get('PHONEPE_MERCHANT_ID')!
    const clientSecret = Deno.env.get('PHONEPE_CLIENT_SECRET')!
    const env = Deno.env.get('PHONEPE_ENV') || 'UAT'

    // CORRECTED API URLs (using new Standard Checkout endpoints)
    const tokenUrl = env === 'PROD'
      ? 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token'

    const statusUrl = env === 'PROD'
      ? `https://api.phonepe.com/apis/pg/checkout/v2/order/${merchantTransactionId}/status?details=false`
      : `https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order/${merchantTransactionId}/status?details=false`

    console.log('Checking status at:', statusUrl)

    // Get OAuth token
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_version: '1',
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      })
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      throw new Error('Failed to get access token')
    }

    // Check payment status from PhonePe
    const statusResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${tokenData.access_token}`
      }
    })

    const statusData = await statusResponse.json()

    console.log('PhonePe status:', statusData.state)

    // Return combined status
    return new Response(
      JSON.stringify({
        success: true,
        paymentStatus: order.payment_status,
        phonepeStatus: statusData.state,  // Changed from statusData.code
        order: order,
        phonepeData: statusData
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