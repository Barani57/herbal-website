import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log('📦 Payment Request:', JSON.stringify(requestData, null, 2));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // PhonePe PRODUCTION credentials
    const clientId = Deno.env.get('PHONEPE_CLIENT_ID')!;
    const clientSecret = Deno.env.get('PHONEPE_CLIENT_SECRET')!;
    const merchantId = Deno.env.get('PHONEPE_MERCHANT_ID')!;

    console.log('🔐 Using Merchant ID:', merchantId);

    const { orderData, items } = requestData;
    const merchantTransactionId = `TXN_${orderData.order_number.replace('ORD-', '')}_${Date.now().toString().slice(-6)}`;

    console.log('💳 Creating order:', orderData.order_number);

    // Save order to database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderData.order_number,
        customer_name: orderData.customerName,
        customer_email: orderData.customerEmail,
        customer_phone: orderData.customerPhone,
        customer_address: orderData.customerAddress,
        customer_state: orderData.customerState,
        total_amount: orderData.totalAmount,
        payment_status: 'initiated',
        phonepe_merchant_transaction_id: merchantTransactionId
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Order creation error:', orderError);
      throw orderError;
    }

    console.log('✅ Order created with ID:', order.id);

    // ✅ FIXED: Save order items (product_id is now optional)
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_name: item.name,
      product_size: item.size,
      product_image: item.image,
      quantity: item.quantity,
      price: item.price,
      line_total: item.lineTotal
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('❌ Items creation error:', itemsError);
      throw itemsError;
    }

    console.log('✅ Order items saved');

    // PRODUCTION PhonePe Payload
    const phonepePayload = {
      merchantId: merchantId,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: `USER_${Date.now()}`,
      amount: Math.round(parseFloat(orderData.totalAmount) * 100),
      redirectUrl: `https://aazhiproducts.com/payment-status.html?txnId=${merchantTransactionId}`,
      redirectMode: "REDIRECT",
      callbackUrl: "https://ffcovgtuxtiineeeeecf.supabase.co/functions/v1/payment-webhook",
      mobileNumber: orderData.customerPhone,
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };

    console.log('📱 PhonePe Payload:', JSON.stringify(phonepePayload, null, 2));

    const base64Payload = btoa(JSON.stringify(phonepePayload));
    const phonepeUrl = 'https://api.phonepe.com/apis/hermes/pg/v1/pay';

    // Generate X-VERIFY hash
    const stringToHash = base64Payload + '/pg/v1/pay' + clientSecret;
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const xVerify = `${hashHex}###1`;

    console.log('🔐 X-VERIFY generated');

    const phonepeResponse = await fetch(phonepeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'X-MERCHANT-ID': merchantId,
        'X-CLIENT-ID': clientId
      },
      body: JSON.stringify({
        request: base64Payload
      })
    });

    const responseData = await phonepeResponse.json();
    console.log('📱 PhonePe Response:', JSON.stringify(responseData, null, 2));

    if (responseData.success && responseData.data?.instrumentResponse?.redirectInfo?.url) {
      console.log('✅ Payment URL generated successfully');
      return new Response(
        JSON.stringify({
          success: true,
          redirectUrl: responseData.data.instrumentResponse.redirectInfo.url,
          merchantTransactionId: merchantTransactionId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      console.error('❌ PhonePe API Error:', responseData);
      throw new Error(responseData.message || 'Payment initiation failed');
    }

  } catch (error) {
    console.error('❌ Function Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});