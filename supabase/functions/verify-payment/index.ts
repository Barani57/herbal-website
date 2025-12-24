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
    const { merchantTransactionId } = await req.json();
    console.log('🔍 Verifying payment for:', merchantTransactionId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get order from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('phonepe_merchant_transaction_id', merchantTransactionId)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found:', merchantTransactionId);
      throw new Error('Order not found');
    }

    console.log('📦 Order found:', order.order_number, 'Current status:', order.payment_status);

    // ✅ PRODUCTION PhonePe Credentials
    const clientId = Deno.env.get('PHONEPE_CLIENT_ID')!;
    const clientSecret = Deno.env.get('PHONEPE_CLIENT_SECRET')!;
    const merchantId = Deno.env.get('PHONEPE_MERCHANT_ID')!;

    // ✅ PRODUCTION Status Check URL
    const statusUrl = `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`;
    
    // Generate X-VERIFY hash
    const stringToHash = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + clientSecret;
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const xVerify = `${hashHex}###1`;

    console.log('🔍 Checking status at:', statusUrl);

    const phonepeResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'X-MERCHANT-ID': merchantId,
        'X-CLIENT-ID': clientId
      }
    });

    const phonepeData = await phonepeResponse.json();
    console.log('📱 PhonePe Status Response:', JSON.stringify(phonepeData, null, 2));

    // Check if payment successful
    const isSuccess = phonepeData.success && phonepeData.code === 'PAYMENT_SUCCESS';
    const newStatus = isSuccess ? 'success' : 'failed';

    console.log('💳 Payment result:', newStatus);

    // Update database status
    if (order.payment_status !== newStatus) {
      console.log('🔄 Updating order status from', order.payment_status, 'to', newStatus);
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: newStatus,
          phonepe_transaction_id: phonepeData.data?.transactionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('❌ Failed to update order:', updateError);
        throw updateError;
      }

      console.log('✅ Order status updated to:', newStatus);

      // ✅ SEND EMAILS ON SUCCESS
      if (newStatus === 'success') {
        console.log('📧 Triggering email send...');
        await sendOrderEmails(supabase, order);
      }
    } else {
      console.log('ℹ️ Status already correct:', newStatus);
    }

    return new Response(
      JSON.stringify({
        success: true,
        phonepeStatus: phonepeData.data?.state,
        paymentStatus: newStatus,
        code: phonepeData.code,
        order: {
          id: order.id,
          order_number: order.order_number,
          customer_email: order.customer_email
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ Verification error:', error);
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
        size: item.product_size || '100g',
        quantity: item.quantity,
        price: parseFloat(item.line_total).toFixed(2)
      }))
    };

    // Send customer email
    console.log('📧 Sending customer email to:', order.customer_email);
    const customerResult = await supabase.functions.invoke('send-order-email', {
      body: {
        to: order.customer_email,
        type: 'customer',
        orderDetails: orderDetails
      }
    });

    if (customerResult.error) {
      console.error('❌ Customer email error:', customerResult.error);
    } else {
      console.log('✅ Customer email sent');
    }

    // Send admin email
    console.log('📧 Sending admin email');
    const adminResult = await supabase.functions.invoke('send-order-email', {
      body: {
        to: 'aazhiproducts24@gmail.com',
        type: 'admin',
        orderDetails: { ...orderDetails, email: order.customer_email }
      }
    });

    if (adminResult.error) {
      console.error('❌ Admin email error:', adminResult.error);
    } else {
      console.log('✅ Admin email sent');
    }

  } catch (error) {
    console.error('❌ Email sending failed:', error);
  }
}