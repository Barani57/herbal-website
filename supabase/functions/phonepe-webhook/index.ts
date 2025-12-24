import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  console.log('🔔 Webhook Received');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const webhookUsername = Deno.env.get('PHONEPE_WEBHOOK_USERNAME')!;
    const webhookPassword = Deno.env.get('PHONEPE_WEBHOOK_PASSWORD')!;

    // Verify Authorization Header
    const authHeader = req.headers.get('Authorization');
    const expectedAuth = await generateSHA256(`${webhookUsername}:${webhookPassword}`);

    if (authHeader !== expectedAuth) {
      console.error('❌ Invalid Authorization');
      return new Response('Unauthorized', { status: 401 });
    }

    const webhookData = await req.json();
    console.log('✅ Webhook Data:', JSON.stringify(webhookData, null, 2));

    const event = webhookData.event;
    const payload = webhookData.payload;

    if (event === 'checkout.order.completed' || event === 'checkout.order.failed') {
      const merchantOrderId = payload.merchantOrderId;
      const state = payload.state;
      const paymentStatus = state === 'COMPLETED' ? 'success' : 'failed';

      // Update order
      const { data: order, error } = await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          phonepe_transaction_id: payload.orderId,
          updated_at: new Date().toISOString()
        })
        .eq('order_number', merchantOrderId)
        .select('*, order_items(*)')
        .single();

      if (!error && paymentStatus === 'success') {
        // Send emails
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
      }

      console.log('✅ Webhook Processed');
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('❌ Webhook Error:', error);
    return new Response('Error', { status: 500 });
  }
});

async function generateSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}