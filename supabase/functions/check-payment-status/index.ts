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
    const { merchantOrderId } = await req.json();
    console.log('🔍 Checking Status for:', merchantOrderId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', merchantOrderId)
      .single();

    if (orderError || !order) throw new Error('Order not found');

    // Generate auth token
    const tokenResponse = await supabase.functions.invoke('generate-auth-token');
    if (!tokenResponse.data?.success) {
      throw new Error('Failed to generate auth token');
    }

    const authToken = tokenResponse.data.accessToken;

    // Check status with PhonePe
    const statusUrl = `https://api.phonepe.com/apis/pg/checkout/v2/order/${merchantOrderId}/status?details=false`;
    
    const phonepeResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${authToken}`
      }
    });

    const phonepeData = await phonepeResponse.json();
    console.log('📱 PhonePe Status:', phonepeData);

    const isSuccess = phonepeData.state === 'COMPLETED';
    const newStatus = isSuccess ? 'success' : phonepeData.state === 'FAILED' ? 'failed' : 'pending';

    // Update database
    if (order.payment_status !== newStatus) {
      await supabase
        .from('orders')
        .update({
          payment_status: newStatus,
          phonepe_transaction_id: phonepeData.orderId,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      console.log('✅ Order Updated:', newStatus);

      // Send emails on success
      if (newStatus === 'success') {
        await sendOrderEmails(supabase, order);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentStatus: newStatus,
        phonepeState: phonepeData.state,
        order: {
          id: order.id,
          order_number: order.order_number
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Status Check Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function sendOrderEmails(supabase: any, order: any) {
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
      items: order.order_items.map((item: any) => ({
        name: item.product_name,
        size: item.product_size,
        quantity: item.quantity,
        price: parseFloat(item.line_total).toFixed(2)
      }))
    };

    await supabase.functions.invoke('send-order-email', {
      body: { to: order.customer_email, type: 'customer', orderDetails }
    });

    await supabase.functions.invoke('send-order-email', {
      body: { 
        to: 'aazhiproducts24@gmail.com', 
        type: 'admin', 
        orderDetails: { ...orderDetails, email: order.customer_email }
      }
    });

    console.log('✅ Emails Sent');
  } catch (error) {
    console.error('❌ Email Error:', error);
  }
}