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
    const { orderData } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number: orderData.orderNumber,
        customer_name: orderData.customerName,
        customer_email: orderData.customerEmail,
        customer_phone: orderData.customerPhone,
        customer_address: orderData.customerAddress,
        customer_state: orderData.customerState || 'Tamil Nadu',
        total_amount: orderData.totalAmount,
        payment_status: 'initiated',
        phonepe_merchant_transaction_id: orderData.merchantTransactionId
      }])
      .select()
      .single()

    if (orderError) throw orderError

    // Insert order items
    const orderItems = orderData.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      product_size: item.size,
      product_image: item.image,
      price: item.price,
      quantity: item.quantity,
      line_total: item.price * item.quantity
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // Get PhonePe credentials
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
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get PhonePe access token')
    }

    // Create payment request
    const websiteUrl = Deno.env.get('WEBSITE_URL')!
    const paymentPayload = {
      merchantId: merchantId,
      merchantTransactionId: orderData.merchantTransactionId,
      amount: Math.round(orderData.totalAmount * 100), // Convert to paise
      merchantUserId: `USER_${Date.now()}`,
      redirectUrl: `${websiteUrl}/payment-status.html?txnId=${orderData.merchantTransactionId}`,
      redirectMode: 'REDIRECT',
      callbackUrl: `${supabaseUrl}/functions/v1/payment-webhook`,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    }

    const paymentResponse = await fetch(`${baseUrl}/apis/pg-sandbox/v1/pg/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`
      },
      body: JSON.stringify(paymentPayload)
    })

    const paymentData = await paymentResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        paymentUrl: paymentData.data?.instrumentResponse?.redirectInfo?.url,
        merchantTransactionId: orderData.merchantTransactionId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})