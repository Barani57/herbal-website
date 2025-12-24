import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  console.log('═══════════════════════════════════');
  console.log('🔔 WEBHOOK RECEIVED AT:', new Date().toISOString());
  console.log('═══════════════════════════════════');

  try {
    const rawBody = await req.text();
    console.log('📦 Raw Body:', rawBody);
    
    const webhookData = JSON.parse(rawBody);
    console.log('✅ Parsed Webhook Data:', JSON.stringify(webhookData, null, 2));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Extract data from PhonePe webhook
    const payload = webhookData.payload || webhookData;
    const merchantOrderId = payload.merchantTransactionId || payload.merchantOrderId;
    const phonepeOrderId = payload.transactionId || payload.orderId;
    const phonepeStatus = payload.state || payload.status;
    
    console.log('📝 Extracted Data:', {
      merchantOrderId,
      phonepeOrderId,
      phonepeStatus
    });

    // Determine payment status
    const paymentStatus = (
      phonepeStatus === 'COMPLETED' || 
      phonepeStatus === 'SUCCESS' || 
      phonepeStatus === 'PAYMENT_SUCCESS'
    ) ? 'success' : 'failed';

    console.log('💳 Payment Status:', paymentStatus);

    // Update order in database
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        phonepe_transaction_id: phonepeOrderId,
        updated_at: new Date().toISOString()
      })
      .eq('phonepe_merchant_transaction_id', merchantOrderId)
      .select(`*, order_items (*)`)
      .single();

    if (updateError) {
      console.error('❌ Database Update Error:', updateError);
      throw updateError;
    }

    console.log('✅ Order Updated:', order.order_number, '→', paymentStatus);

    // Send emails on success
    if (paymentStatus === 'success') {
      console.log('📧 Sending confirmation emails...');
      await sendOrderEmailViaWebhook(supabase, order);
    }

    return new Response(
      JSON.stringify({ success: true, orderNumber: order.order_number }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('═══════════════════════════════════');
    console.error('❌ WEBHOOK ERROR:', error);
    console.error('═══════════════════════════════════');
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function sendOrderEmailViaWebhook(supabase: any, order: any) {
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
        size: item.product_size || '100g',
        quantity: item.quantity,
        price: parseFloat(item.line_total).toFixed(2)
      }))
    };

    // Customer email
    await supabase.functions.invoke('send-order-email', {
      body: { to: order.customer_email, type: 'customer', orderDetails }
    });

    // Admin email
    await supabase.functions.invoke('send-order-email', {
      body: { 
        to: 'aazhiproducts24@gmail.com', 
        type: 'admin', 
        orderDetails: { ...orderDetails, email: order.customer_email }
      }
    });

    console.log('✅ Emails sent successfully');
  } catch (error) {
    console.error('❌ Email error (non-critical):', error);
  }
}