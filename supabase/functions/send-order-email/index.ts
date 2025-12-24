import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, type, orderDetails } = await req.json();

    let subject = '';
    let htmlContent = '';

    if (type === 'customer') {
      subject = `✅ Order Confirmed - ${orderDetails.orderNumber}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: #1a2e1f; color: white; padding: 30px 20px; text-align: center; }
            .header h1 { font-size: 24px; margin-bottom: 5px; }
            .content { padding: 30px 20px; }
            .order-box { background: #f8f6f1; padding: 20px; border-radius: 10px; margin: 20px 0; }
            .order-box h3 { color: #1a2e1f; margin-bottom: 15px; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
            .detail-row:last-child { border-bottom: none; }
            .items { margin: 15px 0; }
            .item { padding: 10px 0; border-bottom: 1px dashed #ccc; }
            .total { background: #1a2e1f; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; font-size: 20px; font-weight: bold; }
            .btn { display: inline-block; background: #5a7c52; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; background: #f5f5f5; color: #666; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌿 Order Confirmed!</h1>
              <p>Thank you for choosing Aazhi Products</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1a2e1f;">Hi ${orderDetails.customerName},</h2>
              <p style="color: #666; line-height: 1.6; margin: 15px 0;">
                Your payment has been received successfully! We're preparing your herbal products with care.
              </p>
              
              <div class="order-box">
                <h3>📦 Order Details</h3>
                <div class="detail-row">
                  <strong>Order Number:</strong>
                  <span>${orderDetails.orderNumber}</span>
                </div>
                <div class="detail-row">
                  <strong>Order Date:</strong>
                  <span>${new Date().toLocaleDateString('en-IN')}</span>
                </div>
                <div class="detail-row">
                  <strong>Payment Status:</strong>
                  <span style="color: #28a745; font-weight: bold;">✅ PAID</span>
                </div>
              </div>

              <div class="order-box">
                <h3>🛍️ Items Ordered</h3>
                <div class="items">
                  ${orderDetails.items.map(item => `
                    <div class="item">
                      <div style="display: flex; justify-content: space-between;">
                        <span><strong>${item.name}</strong> (${item.size})</span>
                        <span>₹${parseFloat(item.price).toFixed(2)}</span>
                      </div>
                      <div style="color: #666; font-size: 13px; margin-top: 3px;">
                        Quantity: ${item.quantity}
                      </div>
                    </div>
                  `).join('')}
                </div>
                
                <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #1a2e1f;">
                  <div class="detail-row">
                    <span>Subtotal:</span>
                    <span>₹${orderDetails.subtotal}</span>
                  </div>
                  <div class="detail-row">
                    <span>Delivery (${orderDetails.state}):</span>
                    <span>₹${orderDetails.delivery}</span>
                  </div>
                </div>
              </div>

              <div class="total">
                Total Paid: ₹${orderDetails.totalAmount}
              </div>

              <div class="order-box">
                <h3>📍 Delivery Address</h3>
                <p style="color: #666; line-height: 1.6;">
                  ${orderDetails.customerName}<br>
                  ${orderDetails.address}<br>
                  ${orderDetails.state}<br>
                  Phone: ${orderDetails.phone}
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://wa.me/918883311488?text=Hi!%20I%20need%20help%20with%20order%20${orderDetails.orderNumber}" class="btn">
                  📱 Track via WhatsApp
                </a>
              </div>

              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                <strong>What's Next?</strong><br>
                • Your order will be dispatched within 24-48 hours<br>
                • You'll receive tracking details via WhatsApp<br>
                • Expected delivery in 3-5 business days
              </p>
            </div>

            <div class="footer">
              <p><strong>Aazhi Products</strong></p>
              <p>Pure Herbal Care for Healthy You</p>
              <p>📞 +91 88833 11488 | 📧 aazhiproducts24@gmail.com</p>
              <p style="margin-top: 10px; font-size: 11px; color: #999;">
                © 2025 Aazhi Products. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (type === 'admin') {
      subject = `🔔 NEW ORDER ${orderDetails.orderNumber}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: #dc3545; color: white; padding: 30px 20px; text-align: center; }
            .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px; color: #856404; }
            .content { padding: 20px; }
            .order-box { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 15px 0; }
            .btn { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 NEW ORDER RECEIVED</h1>
              <p>Action Required!</p>
            </div>
            
            <div class="alert">
              <strong>⚡ Immediate Action Required</strong><br>
              A new order has been placed and payment confirmed.
            </div>

            <div class="content">
              <div class="order-box">
                <h3>📦 Order: ${orderDetails.orderNumber}</h3>
                <p><strong>Customer:</strong> ${orderDetails.customerName}</p>
                <p><strong>Phone:</strong> ${orderDetails.phone}</p>
                <p><strong>Email:</strong> ${orderDetails.email}</p>
                <p><strong>Amount:</strong> ₹${orderDetails.totalAmount}</p>
                <p><strong>Payment:</strong> ✅ SUCCESSFUL</p>
              </div>

              <div class="order-box">
                <h4>Items:</h4>
                ${orderDetails.items.map(item => `
                  <p>• ${item.name} (${item.size}) x${item.quantity} = ₹${item.price}</p>
                `).join('')}
              </div>

              <div class="order-box">
                <h4>Delivery To:</h4>
                <p>${orderDetails.address}<br>${orderDetails.state}</p>
              </div>

              <div style="text-align: center; margin: 20px 0;">
                <a href="https://wa.me/${orderDetails.phone}?text=Hello%20${orderDetails.customerName},%20your%20Aazhi%20order%20${orderDetails.orderNumber}%20is%20confirmed!" class="btn">
                  📱 Contact Customer
                </a>
                <a href="https://aazhiproducts.com/reports.html" class="btn" style="background: #007bff;">
                  📊 View Dashboard
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Aazhi Products <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: htmlContent
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('Email sent successfully:', result);
      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      console.error('Resend API error:', result);
      throw new Error(result.message || 'Failed to send email');
    }

  } catch (error) {
    console.error('Email function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});