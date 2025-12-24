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
    const { orderData, items } = await req.json();
    console.log('📦 Create Payment Request:', { orderData, items });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Generate Auth Token
    const tokenResponse = await supabase.functions.invoke('generate-auth-token');
    
    if (!tokenResponse.data?.success) {
      throw new Error('Failed to generate auth token');
    }

    const authToken = tokenResponse.data.accessToken;
    console.log('✅ Auth Token Generated');

    // Step 2: Save order to database
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
        payment_status: 'initiated'
      })
      .select()
      .single();

    if (orderError) throw orderError;
    console.log('✅ Order Created:', order.id);

    // Step 3: Save order items
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

    if (itemsError) throw itemsError;
    console.log('✅ Order Items Saved');

    // Step 4: Create PhonePe Payment
    const merchantId = Deno.env.get('PHONEPE_MERCHANT_ID')!;
    const paymentPayload = {
      merchantOrderId: orderData.order_number,
      amount: Math.round(parseFloat(orderData.totalAmount) * 100), // Convert to paise
      paymentFlow: {
        type: "PG_CHECKOUT",
        merchantUrls: {
          redirectUrl: `https://aazhiproducts.com/payment-status.html?orderId=${orderData.order_number}`
        }
      }
    };

    console.log('💳 PhonePe Payload:', paymentPayload);

    const phonepeUrl = 'https://api.phonepe.com/apis/pg/checkout/v2/pay';
    
    const phonepeResponse = await fetch(phonepeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${authToken}`
      },
      body: JSON.stringify(paymentPayload)
    });

    const phonepeData = await phonepeResponse.json();
    console.log('📱 PhonePe Response:', phonepeData);

    if (phonepeData.redirectUrl) {
      // Update order with PhonePe orderId
      await supabase
        .from('orders')
        .update({ phonepe_merchant_transaction_id: phonepeData.orderId })
        .eq('id', order.id);

      return new Response(
        JSON.stringify({
          success: true,
          redirectUrl: phonepeData.redirectUrl,
          phonepeOrderId: phonepeData.orderId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(phonepeData.message || 'Payment creation failed');
    }

  } catch (error) {
    console.error('❌ Create Payment Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});