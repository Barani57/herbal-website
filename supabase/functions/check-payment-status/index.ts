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
    console.log('🔍 CHECK PAYMENT STATUS - START');

    const { merchantOrderId } = await req.json();
    
    if (!merchantOrderId) {
      throw new Error('merchantOrderId is required');
    }

    console.log('Order Number:', merchantOrderId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ✅ STEP 1: Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', merchantOrderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    console.log('✅ Order found:', order.id);

    // ✅ STEP 2: Generate PhonePe token DIRECTLY
    console.log('🔐 Generating PhonePe auth token...');
    
    const clientId = Deno.env.get('PHONEPE_CLIENT_ID');
    const clientSecret = Deno.env.get('PHONEPE_CLIENT_SECRET');
    const clientVersion = Deno.env.get('PHONEPE_CLIENT_VERSION');

    const params = new URLSearchParams();
    params.append('client_version', clientVersion!);
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId!);
    params.append('client_secret', clientSecret!);

    const tokenResponse = await fetch('https://api.phonepe.com/apis/identity-manager/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!tokenResponse.ok) {
      throw new Error('Token generation failed');
    }

    const tokenData = await tokenResponse.json();
    const authToken = tokenData.access_token;
    console.log('✅ Auth token obtained');

    // ✅ STEP 3: Check PhonePe status
    console.log('📱 Checking PhonePe status...');
    
    const statusUrl = `https://api.phonepe.com/apis/pg/checkout/v2/order/${merchantOrderId}/status?details=true`;
    
    const phonepeResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${authToken}`
      }
    });

    if (!phonepeResponse.ok) {
      throw new Error('PhonePe status check failed');
    }

    const phonepeData = await phonepeResponse.json();
    console.log('PhonePe state:', phonepeData.state);

    // ✅ STEP 4: Update database
    const newStatus = phonepeData.state === 'COMPLETED' ? 'success' : 
                      phonepeData.state === 'FAILED' ? 'failed' : 'pending';

    if (order.payment_status !== newStatus) {
      const updateData: any = {
        payment_status: newStatus,
        phonepe_order_id: phonepeData.orderId,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'success') {
        updateData.payment_completed_at = new Date().toISOString();
      }

      await supabase.from('orders').update(updateData).eq('id', order.id);
      console.log('✅ Status updated:', newStatus);

      // ✅ STEP 5: Send emails
      if (newStatus === 'success') {
        console.log('📧 Sending emails...');
        await sendOrderEmails(supabaseUrl, supabaseKey, order);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentStatus: newStatus,
        phonepeState: phonepeData.state,
        order: {
          id: order.id,
          order_number: order.order_number,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          total_amount: order.total_amount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function sendOrderEmails(supabaseUrl: string, supabaseKey: string, order: any) {
  try {
    const subtotal = order.order_items.reduce((sum: number, item: any) => 
      sum + parseFloat(item.line_total), 0);
    const delivery = order.customer_state === 'Tamil Nadu' ? 50 : 100;

    const orderDetails = {
      orderNumber: order.order_number,
      customerName: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email,
      address: order.customer_address,
      state: order.customer_state,
      totalAmount: parseFloat(order.total_amount).toFixed(2),
      subtotal: subtotal.toFixed(2),
      delivery: delivery.toFixed(2),
      orderDate: new Date(order.created_at).toLocaleDateString('en-IN'),
      items: order.order_items.map((item: any) => ({
        name: item.product_name,
        size: item.product_size,
        quantity: item.quantity,
        price: parseFloat(item.line_total).toFixed(2)
      }))
    };

    // Send customer email
    await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to: order.customer_email, type: 'customer', orderDetails })
    });

    // Send admin email
    await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to: 'aazhiproducts24@gmail.com', type: 'admin', orderDetails })
    });

    console.log('✅ Emails sent');
  } catch (error) {
    console.error('Email error:', error.message);
  }
}