import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📧 Sending order email...');
    
    const { to, type, orderDetails } = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    if (!to || !type || !orderDetails) {
      throw new Error('Missing required fields: to, type, or orderDetails');
    }

    let subject = '';
    let htmlContent = '';

    if (type === 'customer') {
      subject = `Order Confirmed #${orderDetails.orderNumber} | Aazhi Products`;
      htmlContent = generateCustomerEmail(orderDetails);
    } else if (type === 'admin') {
      subject = `🔔 New Order #${orderDetails.orderNumber} - Action Required`;
      htmlContent = generateAdminEmail(orderDetails);
    } else {
      throw new Error('Invalid email type. Must be "customer" or "admin"');
    }

    console.log(`Sending ${type} email to:`, to);

    // ✅ Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        // ✅ IMPORTANT: Change this based on your Resend setup
        // Option 1: If domain verified → use: 'Aazhi Products <orders@aazhiproducts.com>'
        // Option 2: For testing → use: 'Aazhi Products <onboarding@resend.dev>'
        from: 'Aazhi Products <onboarding@resend.dev>', // ✅ Change after domain verification
        to: [to],
        subject: subject,
        html: htmlContent
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Email sent successfully:', result.id);
      return new Response(
        JSON.stringify({ success: true, emailId: result.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error('❌ Resend API error:', result);
      throw new Error(result.message || 'Failed to send email');
    }

  } catch (error) {
    console.error('❌ Email function error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// ✅ PROFESSIONAL CUSTOMER EMAIL TEMPLATE
function generateCustomerEmail(order: any): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: #f8f9fa;
      color: #2d3748;
      line-height: 1.6;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #1e3a2e 0%, #2d5a46 100%);
      padding: 40px 30px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .header p {
      font-size: 14px;
      font-weight: 300;
      opacity: 0.9;
    }
    .success-badge {
      background: #10b981;
      color: white;
      display: inline-block;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      margin-top: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #1e3a2e;
      margin-bottom: 15px;
    }
    .intro-text {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 30px;
    }
    .info-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 25px;
      border-left: 4px solid #2d5a46;
    }
    .info-card h3 {
      font-size: 16px;
      font-weight: 600;
      color: #1e3a2e;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
    }
    .info-card h3::before {
      content: '';
      width: 6px;
      height: 6px;
      background: #2d5a46;
      border-radius: 50%;
      margin-right: 10px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-row .label {
      color: #64748b;
      font-weight: 400;
    }
    .info-row .value {
      color: #2d3748;
      font-weight: 500;
      text-align: right;
    }
    .item {
      padding: 18px 0;
      border-bottom: 1px dashed #e2e8f0;
    }
    .item:last-child {
      border-bottom: none;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .item-name {
      font-weight: 600;
      color: #2d3748;
      font-size: 15px;
    }
    .item-price {
      font-weight: 600;
      color: #2d5a46;
      font-size: 15px;
    }
    .item-details {
      color: #64748b;
      font-size: 13px;
    }
    .pricing-summary {
      background: #ffffff;
      border-radius: 12px;
      padding: 20px;
      margin-top: 20px;
      border: 2px solid #e2e8f0;
    }
    .pricing-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
    }
    .pricing-row.total {
      border-top: 2px solid #2d5a46;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 18px;
      font-weight: 700;
      color: #1e3a2e;
    }
    .total-badge {
      background: linear-gradient(135deg, #1e3a2e 0%, #2d5a46 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      margin: 25px 0;
    }
    .total-badge .label {
      font-size: 13px;
      opacity: 0.9;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .total-badge .amount {
      font-size: 32px;
      font-weight: 700;
    }
    .address-block {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .address-block h4 {
      font-size: 14px;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .address-block p {
      color: #78350f;
      font-size: 14px;
      line-height: 1.8;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #2d5a46 0%, #1e3a2e 100%);
      color: white;
      padding: 16px 35px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
      margin: 10px 5px;
      box-shadow: 0 4px 12px rgba(30, 58, 46, 0.2);
    }
    .cta-section {
      text-align: center;
      margin: 35px 0;
    }
    .next-steps {
      background: #f0fdf4;
      border-radius: 12px;
      padding: 25px;
      margin: 25px 0;
    }
    .next-steps h4 {
      font-size: 16px;
      font-weight: 600;
      color: #166534;
      margin-bottom: 15px;
    }
    .step {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
      color: #15803d;
      font-size: 14px;
    }
    .step-icon {
      background: #22c55e;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      margin-right: 12px;
      flex-shrink: 0;
    }
    .footer {
      background: #1e293b;
      color: #cbd5e1;
      padding: 35px 30px;
      text-align: center;
    }
    .footer-logo {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .footer-tagline {
      font-size: 13px;
      opacity: 0.8;
      margin-bottom: 20px;
    }
    .footer-contact {
      margin: 20px 0;
      font-size: 13px;
    }
    .footer-contact a {
      color: #10b981;
      text-decoration: none;
    }
    .footer-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 20px 0;
    }
    .footer-copyright {
      font-size: 12px;
      opacity: 0.7;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .header {
        padding: 30px 20px;
      }
      .header h1 {
        font-size: 24px;
      }
      .total-badge .amount {
        font-size: 28px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <h1>🌿 Order Confirmed!</h1>
      <p>Your natural wellness journey begins</p>
      <div class="success-badge">✓ Payment Received</div>
    </div>

    <div class="content">
      <div class="greeting">Hello ${order.customerName}! 👋</div>
      <p class="intro-text">
        Thank you for choosing Aazhi Products! We're thrilled to be part of your wellness journey. 
        Your order has been confirmed and we're preparing your products with care.
      </p>

      <div class="info-card">
        <h3>Order Information</h3>
        <div class="info-row">
          <span class="label">Order Number</span>
          <span class="value">${order.orderNumber}</span>
        </div>
        <div class="info-row">
          <span class="label">Order Date</span>
          <span class="value">${order.orderDate}</span>
        </div>
        <div class="info-row">
          <span class="label">Payment Status</span>
          <span class="value" style="color: #10b981;">✓ Paid</span>
        </div>
      </div>

      <div class="info-card">
        <h3>Your Products</h3>
        ${order.items.map((item: any) => `
          <div class="item">
            <div class="item-header">
              <span class="item-name">${item.name}</span>
              <span class="item-price">₹${item.price}</span>
            </div>
            <div class="item-details">
              ${item.size} • Quantity: ${item.quantity}
            </div>
          </div>
        `).join('')}
        
        <div class="pricing-summary">
          <div class="pricing-row">
            <span>Subtotal</span>
            <span>₹${order.subtotal}</span>
          </div>
          <div class="pricing-row">
            <span>Delivery (${order.state})</span>
            <span>₹${order.delivery}</span>
          </div>
          <div class="pricing-row total">
            <span>Total Paid</span>
            <span>₹${order.totalAmount}</span>
          </div>
        </div>
      </div>

      <div class="address-block">
        <h4>📍 Delivery Address</h4>
        <p>
          ${order.customerName}<br>
          ${order.address}<br>
          ${order.state}<br>
          Phone: ${order.phone}
        </p>
      </div>

      <div class="total-badge">
        <div class="label">Amount Paid</div>
        <div class="amount">₹${order.totalAmount}</div>
      </div>

      <div class="next-steps">
        <h4>What Happens Next?</h4>
        <div class="step">
          <div class="step-icon">1</div>
          <div>Your order will be carefully packed and dispatched within 24-48 hours</div>
        </div>
        <div class="step">
          <div class="step-icon">2</div>
          <div>You'll receive tracking details via WhatsApp once shipped</div>
        </div>
        <div class="step">
          <div class="step-icon">3</div>
          <div>Expected delivery in 3-5 business days across India</div>
        </div>
      </div>

      <div class="cta-section">
        <a href="https://wa.me/918883311488?text=Hi!%20I%20need%20help%20with%20order%20${order.orderNumber}" 
           class="cta-button">
          💬 Track via WhatsApp
        </a>
        <a href="https://aazhiproducts.com" class="cta-button" style="background: linear-gradient(135deg, #059669 0%, #047857 100%);">
          🌿 Shop More
        </a>
      </div>
    </div>

    <div class="footer">
      <div class="footer-logo">AAZHI PRODUCTS</div>
      <div class="footer-tagline">Pure Herbal Care • Natural Wellness</div>
      <div class="footer-contact">
        📞 +91 88833 11488<br>
        📧 <a href="mailto:aazhiproducts24@gmail.com">aazhiproducts24@gmail.com</a><br>
        🌐 <a href="https://aazhiproducts.com">aazhiproducts.com</a>
      </div>
      <div class="footer-divider"></div>
      <div class="footer-copyright">
        © 2025 Aazhi Products. All rights reserved.<br>
        Made with 💚 for your wellness
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// ✅ PROFESSIONAL ADMIN EMAIL TEMPLATE
function generateAdminEmail(order: any): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Poppins', sans-serif;
      background: #f8f9fa;
      color: #2d3748;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      padding: 30px;
      text-align: center;
      color: white;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    .urgent-badge {
      background: #fbbf24;
      color: #78350f;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      display: inline-block;
      margin-top: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .alert-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin: 20px;
    }
    .alert-box strong {
      color: #92400e;
      font-size: 16px;
      display: block;
      margin-bottom: 8px;
    }
    .alert-box p {
      color: #78350f;
      font-size: 14px;
    }
    .content {
      padding: 30px;
    }
    .order-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 20px;
      border: 2px solid #e2e8f0;
    }
    .order-card h3 {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e2e8f0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 15px;
    }
    .info-label {
      font-weight: 600;
      color: #64748b;
      font-size: 14px;
    }
    .info-value {
      color: #1e293b;
      font-weight: 500;
      font-size: 14px;
    }
    .success-indicator {
      color: #16a34a;
      font-weight: 700;
      background: #dcfce7;
      padding: 4px 12px;
      border-radius: 12px;
      display: inline-block;
    }
    .items-list {
      margin: 15px 0;
    }
    .item-row {
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    .item-row:last-child {
      border-bottom: none;
    }
    .amount-highlight {
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      margin: 20px 0;
    }
    .amount-highlight .label {
      font-size: 12px;
      opacity: 0.9;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .amount-highlight .amount {
      font-size: 32px;
      font-weight: 700;
    }
    .action-buttons {
      text-align: center;
      margin: 30px 0;
    }
    .btn {
      display: inline-block;
      padding: 14px 30px;
      margin: 8px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .btn-whatsapp {
      background: #25d366;
      color: white;
    }
    .btn-dashboard {
      background: #3b82f6;
      color: white;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <h1>🚨 NEW ORDER ALERT</h1>
      <div class="urgent-badge">⚡ Immediate Action Required</div>
    </div>

    <div class="alert-box">
      <strong>Payment Confirmed!</strong>
      <p>A new order has been placed and payment has been successfully received. Please process immediately.</p>
    </div>

    <div class="content">
      <div class="order-card">
        <h3>📦 Order #${order.orderNumber}</h3>
        <div class="info-grid">
          <div class="info-label">Customer:</div>
          <div class="info-value">${order.customerName}</div>
          
          <div class="info-label">Phone:</div>
          <div class="info-value">${order.phone}</div>
          
          <div class="info-label">Email:</div>
          <div class="info-value">${order.email}</div>
          
          <div class="info-label">Order Date:</div>
          <div class="info-value">${order.orderDate}</div>
          
          <div class="info-label">Payment:</div>
          <div class="info-value"><span class="success-indicator">✓ PAID</span></div>
          
          <div class="info-label">Amount:</div>
          <div class="info-value" style="font-size: 18px; font-weight: 700; color: #dc2626;">₹${order.totalAmount}</div>
        </div>
      </div>

      <div class="order-card">
        <h3>🛍️ Items to Pack</h3>
        <div class="items-list">
          ${order.items.map((item: any) => {
            const unitPrice = item.quantity > 0 ? (parseFloat(item.price) / item.quantity).toFixed(2) : '0.00';
            return `
            <div class="item-row">
              <strong>${item.name}</strong> (${item.size})<br>
              <span style="color: #64748b;">Quantity: ${item.quantity} × ₹${unitPrice} = ₹${item.price}</span>
            </div>
          `}).join('')}
        </div>
      </div>

      <div class="order-card">
        <h3>📍 Ship To</h3>
        <p style="line-height: 1.8; color: #475569;">
          <strong>${order.customerName}</strong><br>
          ${order.address}<br>
          ${order.state}<br>
          <strong>Phone:</strong> ${order.phone}
        </p>
      </div>

      <div class="amount-highlight">
        <div class="label">Total Order Value</div>
        <div class="amount">₹${order.totalAmount}</div>
        <div style="font-size: 13px; margin-top: 8px; opacity: 0.9;">
          Subtotal: ₹${order.subtotal} + Delivery: ₹${order.delivery}
        </div>
      </div>

      <div class="action-buttons">
        <a href="https://wa.me/${order.phone}?text=Hello%20${encodeURIComponent(order.customerName)},%20your%20Aazhi%20order%20${order.orderNumber}%20is%20confirmed%20and%20being%20prepared!" 
           class="btn btn-whatsapp">
          💬 Message Customer
        </a>
        <a href="https://aazhiproducts.com/reports.html" class="btn btn-dashboard">
          📊 Open Dashboard
        </a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}