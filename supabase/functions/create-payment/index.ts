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
    console.log('💳 CREATE PAYMENT - START');

    const { orderData, items } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ✅ STEP 1: Generate PhonePe Auth Token DIRECTLY (no separate function)
    console.log('🔐 Generating PhonePe auth token directly...');
    
    const clientId = Deno.env.get('PHONEPE_CLIENT_ID');
    const clientSecret = Deno.env.get('PHONEPE_CLIENT_SECRET');
    const clientVersion = Deno.env.get('PHONEPE_CLIENT_VERSION');

    if (!clientId || !clientSecret || !clientVersion) {
      throw new Error('Missing PhonePe credentials');
    }

    // Build form data
    const params = new URLSearchParams();
    params.append('client_version', clientVersion);
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    // Call PhonePe directly
    const tokenResponse = await fetch('https://api.phonepe.com/apis/identity-manager/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('PhonePe token error:', errorText);
      throw new Error(`PhonePe auth failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('No access_token from PhonePe');
    }

    const authToken = tokenData.access_token;
    console.log('✅ PhonePe auth token obtained');

    // ✅ STEP 2: Save order
    console.log('💾 Saving order...');

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderData.order_number,
        customer_name: orderData.customerName,
        customer_email: orderData.customerEmail,
        customer_phone: orderData.customerPhone,
        customer_address: orderData.customerAddress,
        customer_state: orderData.customerState,
        total_amount: parseFloat(orderData.totalAmount).toFixed(2),
        payment_status: 'initiated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order error:', orderError);
      throw new Error(`Database error: ${orderError.message}`);
    }

    console.log('✅ Order created:', order.id);

    // ✅ STEP 3: Save items
    if (items && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        product_name: item.name,
        product_size: item.size || null,
        product_image: item.image || null,
        quantity: item.quantity,
        price: parseFloat(item.price).toFixed(2),
        line_total: parseFloat(item.lineTotal || (item.price * item.quantity)).toFixed(2),
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Items error:', itemsError);
      } else {
        console.log('✅ Items saved');
      }
    }

    // ✅ STEP 4: Create PhonePe payment
    console.log('📱 Creating PhonePe payment...');

    const amountInPaise = Math.round(parseFloat(orderData.totalAmount) * 100);

    const paymentPayload = {
      merchantOrderId: orderData.order_number,
      amount: amountInPaise,
      paymentFlow: {
        type: "PG_CHECKOUT",
        merchantUrls: {
          redirectUrl: `https://aazhiproducts.com/payment-status.html?orderId=${orderData.order_number}`
        }
      }
    };

    console.log('PhonePe payload:', JSON.stringify(paymentPayload));

    const phonepeResponse = await fetch('https://api.phonepe.com/apis/pg/checkout/v2/pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${authToken}`
      },
      body: JSON.stringify(paymentPayload)
    });

    console.log('PhonePe response status:', phonepeResponse.status);

    const phonepeData = await phonepeResponse.json();
    console.log('PhonePe response:', JSON.stringify(phonepeData));

    if (!phonepeResponse.ok) {
      console.error('PhonePe error:', phonepeData);
      throw new Error(`PhonePe error: ${JSON.stringify(phonepeData)}`);
    }

    if (!phonepeData.redirectUrl) {
      throw new Error('No redirectUrl from PhonePe');
    }

    console.log('✅ Payment created successfully');

    // Update order
    if (phonepeData.orderId) {
      await supabase
        .from('orders')
        .update({ phonepe_order_id: phonepeData.orderId })
        .eq('id', order.id);
    }

    console.log('✅ CREATE PAYMENT - SUCCESS');

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: phonepeData.redirectUrl,
        phonepeOrderId: phonepeData.orderId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ CREATE PAYMENT ERROR:', error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});