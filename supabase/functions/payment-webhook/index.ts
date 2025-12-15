import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Verify Basic Authentication from PhonePe
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = atob(base64Credentials);
      const [username, password] = credentials.split(':');
      
      const validUsername = Deno.env.get('WEBHOOK_USERNAME');
      const validPassword = Deno.env.get('WEBHOOK_PASSWORD');
      
      if (username !== validUsername || password !== validPassword) {
        console.log('❌ Invalid webhook credentials');
        return new Response('Unauthorized', { status: 401 });
      }
    }
    
    const webhookData = await req.json()
    console.log('✅ Webhook received:', JSON.stringify(webhookData, null, 2))
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Extract data from PhonePe webhook payload
    const event = webhookData.event
    const payload = webhookData.payload
    
    const merchantOrderId = payload.merchantOrderId
    const phonepeOrderId = payload.orderId
    const paymentStatus = payload.state === 'COMPLETED' ? 'success' : 'failed'

    console.log('Processing webhook:', {
      event,
      merchantOrderId,
      phonepeOrderId,
      paymentStatus
    })

    // Update order status
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        phonepe_transaction_id: phonepeOrderId,
        updated_at: new Date().toISOString()
      })
      .eq('phonepe_merchant_transaction_id', merchantOrderId)
      .select(`
        *,
        order_items (*)
      `)
      .single()

    if (updateError) {
      console.error('Error updating order:', updateError)
      throw updateError
    }

    console.log('Order updated successfully:', order.order_number)

    // Send email notification only for successful payments
    if (paymentStatus === 'success') {
      console.log('Sending order confirmation emails...')
      await sendOrderEmail(order)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function sendOrderEmail(order: any) {
  try {
    const emailjsKey = Deno.env.get('EMAILJS_PUBLIC_KEY')!
    const serviceId = Deno.env.get('EMAILJS_SERVICE_ID')!
    const templateId = Deno.env.get('EMAILJS_TEMPLATE_ID')!

    const subtotal = order.order_items.reduce((sum: number, item: any) => 
      sum + parseFloat(item.line_total), 0)
    const delivery = order.customer_state === 'Tamil Nadu' ? 50 : 100

    const emailParams = {
      order_id: order.order_number,
      email: order.customer_email,
      to_name: order.customer_name,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      customer_address: order.customer_address,
      orders: order.order_items.map((item: any) => ({
        name: item.product_name,
        units: item.quantity,
        price: `₹${parseFloat(item.line_total).toFixed(2)}`
      })),
      delivery_cost: `₹${delivery.toFixed(2)}`,
      subtotal: `₹${subtotal.toFixed(2)}`,
      total: `₹${parseFloat(order.total_amount).toFixed(2)}`
    }

    // Send to customer
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: emailjsKey,
        template_params: emailParams
      })
    })

    console.log('✅ Customer email sent')

    // Send to admin
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: emailjsKey,
        template_params: {
          ...emailParams,
          email: 'aazhiproducts24@gmail.com',
          to_name: 'Aazhi Products Admin'
        }
      })
    })

    console.log('✅ Admin email sent')
  } catch (error) {
    console.error('❌ Email sending failed:', error)
  }
}