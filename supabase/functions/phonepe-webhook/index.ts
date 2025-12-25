import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  console.log('🔔 PHONEPE WEBHOOK - START');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const webhookUsername = Deno.env.get('PHONEPE_WEBHOOK_USERNAME');
    const webhookPassword = Deno.env.get('PHONEPE_WEBHOOK_PASSWORD');

    if (!webhookUsername || !webhookPassword) {
      console.error('❌ Webhook credentials not configured');
      return new Response('Configuration Error', { status: 500 });
    }

    // ✅ STEP 1: Verify webhook signature
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('❌ No Authorization header');
      return new Response('Unauthorized', { status: 401 });
    }

    const expectedAuth = await generateSHA256(`${webhookUsername}:${webhookPassword}`);
    
    if (authHeader !== expectedAuth) {
      console.error('❌ Invalid signature');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('✅ Webhook signature verified');

    // ✅ STEP 2: Parse webhook payload
    const webhookData = await req.json();
    console.log('Webhook event:', webhookData.event);

    const event = webhookData.event;
    const payload = webhookData.payload;

    if (!event || !payload) {
      return new Response('Invalid Payload', { status: 400 });
    }

    // ✅ STEP 3: Process events
    if (event === 'checkout.order.completed') {
      await processOrderCompleted(supabase, supabaseUrl, supabaseKey, payload);
    } else if (event === 'checkout.order.failed') {
      await processOrderFailed(supabase, payload);
    } else {
      console.log('⚠️ Unknown event:', event);
    }

    console.log('✅ WEBHOOK PROCESSED');
    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('❌ WEBHOOK ERROR:', error.message);
    return new Response('Error', { status: 500 });
  }
});

// ✅ Process successful payment
async function processOrderCompleted(
  supabase: any, 
  supabaseUrl: string, 
  supabaseKey: string, 
  payload: any
) {
  const merchantOrderId = payload.merchantOrderId;
  const phonepeOrderId = payload.orderId;
  
  console.log('✅ Processing completed order:', merchantOrderId);

  // Update order
  const { data: order, error } = await supabase
    .from('orders')
    .update({
      payment_status: 'success',
      phonepe_order_id: phonepeOrderId,
      payment_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('order_number', merchantOrderId)
    .select('*, order_items(*)')
    .single();

  if (error) {
    console.error('❌ Failed to update order:', error.message);
    return;
  }

  console.log('✅ Order updated');

  // Send emails
  await sendOrderEmails(supabaseUrl, supabaseKey, order);
}

// ✅ Process failed payment
async function processOrderFailed(supabase: any, payload: any) {
  const merchantOrderId = payload.merchantOrderId;
  const phonepeOrderId = payload.orderId;
  const errorCode = payload.errorCode || 'UNKNOWN_ERROR';
  
  console.log('❌ Processing failed order:', merchantOrderId);

  await supabase
    .from('orders')
    .update({
      payment_status: 'failed',
      phonepe_order_id: phonepeOrderId,
      error_message: errorCode,
      updated_at: new Date().toISOString()
    })
    .eq('order_number', merchantOrderId);

  console.log('✅ Order marked as failed');
}

// ✅ Send emails
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

    // Customer email
    await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to: order.customer_email, type: 'customer', orderDetails })
    });

    // Admin email
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
    console.error('❌ Email error:', error.message);
  }
}

// ✅ Generate SHA256 hash
async function generateSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}