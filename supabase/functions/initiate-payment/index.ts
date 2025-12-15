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

    const clientId = Deno.env.get('PHONEPE_MERCHANT_ID')!
    const clientSecret = Deno.env.get('PHONEPE_CLIENT_SECRET')!
    const env = Deno.env.get('PHONEPE_ENV') || 'UAT'

    const tokenUrl = env === 'PROD'
      ? 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token'

    const paymentUrl = env === 'PROD'
      ? 'https://api.phonepe.com/apis/pg/checkout/v2/pay'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay'

    console.log('Getting OAuth token...')
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

    const tokenText = await tokenResponse.text()
    console.log('Token response status:', tokenResponse.status)
    console.log('Token response body:', tokenText)

    let tokenData
    try {
      tokenData = JSON.parse(tokenText)
    } catch (e) {
      throw new Error(`Failed to parse token response: ${tokenText}`)
    }

    if (!tokenData.access_token) {
      console.error('Token response:', tokenData)
      throw new Error('Failed to get PhonePe access token')
    }

    const websiteUrl = Deno.env.get('WEBSITE_URL')!
    const paymentPayload = {
      merchantOrderId: orderData.merchantTransactionId,
      amount: Math.round(orderData.totalAmount * 100),
      expireAfter: 1800,
      paymentFlow: {
        type: "PG_CHECKOUT",
        merchantUrls: {
          redirectUrl: `${websiteUrl}/payment-status.html?txnId=${orderData.merchantTransactionId}`
        }
      }
    }

    console.log('Payment payload:', JSON.stringify(paymentPayload, null, 2))

    const paymentResponse = await fetch(paymentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${tokenData.access_token}`
      },
      body: JSON.stringify(paymentPayload)
    })

    console.log('Payment response status:', paymentResponse.status)
    const responseText = await paymentResponse.text()
    console.log('Payment response body:', responseText)

    let paymentData
    try {
      paymentData = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse payment response as JSON')
      throw new Error(`PhonePe API error: ${paymentResponse.status} - ${responseText}`)
    }

    if (paymentResponse.status !== 200 || !paymentData.redirectUrl) {
      console.error('Payment initiation failed:', paymentData)
      throw new Error(paymentData.message || paymentData.code || 'Failed to initiate payment with PhonePe')
    }

    await supabase
      .from('orders')
      .update({ phonepe_transaction_id: paymentData.orderId })
      .eq('id', order.id)

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        paymentUrl: paymentData.redirectUrl,
        merchantTransactionId: orderData.merchantTransactionId,
        phonepeOrderId: paymentData.orderId
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