// emailjs-config.js
// EmailJS Configuration

// Replace these with your actual EmailJS credentials
const EMAILJS_CONFIG = {
  publicKey: 'iacZMn7wBcM1A9j3M',        // From EmailJS Account page
  serviceId: 'service_4o28bvx',        // From EmailJS Services page
  templateId: 'template_a3n406f'       // Your template ID
};

// Initialize EmailJS
(function() {
  if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_CONFIG.publicKey);
  }
})();

// Function to format order items for EmailJS template
function formatOrderItemsForEmailJS(orderItems) {
  if (!orderItems || orderItems.length === 0) {
    return [];
  }
  
  return orderItems.map(item => ({
    name: item.product_name,
    units: item.quantity,
    price: parseFloat(item.line_total).toFixed(2)
  }));
}

// Calculate costs
function calculateOrderCosts(order) {
  const orderItems = order.order_items || [];
  
  // Calculate subtotal
  const subtotal = orderItems.reduce((sum, item) => {
    return sum + parseFloat(item.line_total || 0);
  }, 0);
  
  // Delivery cost (fixed at ₹50)
  const deliveryCost = 50;
  
  // Total
  const total = subtotal + deliveryCost;
  
  return {
    delivery_cost: deliveryCost.toFixed(2),
    total: total.toFixed(2)
  };
}

// Main function to send order email
async function sendOrderEmails(orderId, status) {
  try {
    // Fetch order details from Supabase
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single();
    
    if (orderError) throw orderError;
    
    console.log('Preparing to send email for order:', order.order_number);
    
    // Calculate costs
    const orderItems = order.order_items || [];
    
    // Calculate subtotal from all items
    const subtotal = orderItems.reduce((sum, item) => {
      return sum + parseFloat(item.line_total || 0);
    }, 0);
    
    // Delivery cost (fixed at ₹50)
    const deliveryCost = 50;
    
    // Total amount
    const total = subtotal + deliveryCost;
    
    // Format order items as array for {{#orders}} loop
    const formattedOrders = orderItems.map(item => ({
      name: item.product_name,
      units: item.quantity,
      price: `₹${parseFloat(item.line_total).toFixed(2)}`
    }));
    
    // Template parameters matching your EmailJS template
    const templateParams = {
      order_id: order.order_number,
      email: order.customer_email,           // This is the key - using 'email' not 'to_email'
      to_name: order.customer_name,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      customer_address: order.customer_address,
      
      // Orders array for {{#orders}} loop
      orders: formattedOrders,
      
      // Cost details
      delivery_cost: `₹${deliveryCost.toFixed(2)}`,
      subtotal: `₹${subtotal.toFixed(2)}`,
      total: `₹${total.toFixed(2)}`
    };
    
    console.log('Sending email with params:', templateParams);
    
    // Send email to customer
    const customerResponse = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );
    
    console.log('✅ Customer email sent successfully:', customerResponse.status);
    
    // Send email to admin (same template, different recipient)
    const adminParams = {
      ...templateParams,
      email: 'aazhiproducts24@gmail.com',  // Admin email
      to_name: 'Aazhi Products Admin'
    };
    
    const adminResponse = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      adminParams
    );
    
    console.log('✅ Admin email sent successfully:', adminResponse.status);
    
    return { 
      success: true, 
      message: 'Emails sent successfully to customer and admin',
      customerResponse,
      adminResponse
    };
    
  } catch (error) {
    console.error('❌ Error sending emails:', error);
    
    // Log detailed error info
    if (error.text) {
      console.error('Error details:', error.text);
    }
    
    return { 
      success: false, 
      error: error.text || error.message || 'Failed to send email' 
    };
  }
}

// Alternative: Send only to customer
async function sendCustomerEmail(orderId) {
  try {
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single();
    
    if (orderError) throw orderError;
    
    const formattedOrders = formatOrderItemsForEmailJS(order.order_items);
    const costs = calculateOrderCosts(order);
    
    const templateParams = {
      order_id: order.order_number,
      to_email: order.customer_email,
      to_name: order.customer_name,
      customer_name: order.customer_name,
      orders: formattedOrders,
      cost: costs
    };
    
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );
    
    console.log('Customer email sent:', response);
    return { success: true, response };
    
  } catch (error) {
    console.error('Error sending customer email:', error);
    return { success: false, error };
  }
}

// Alternative: Send only to admin
async function sendAdminEmail(orderId) {
  try {
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single();
    
    if (orderError) throw orderError;
    
    const formattedOrders = formatOrderItemsForEmailJS(order.order_items);
    const costs = calculateOrderCosts(order);
    
    const templateParams = {
      order_id: order.order_number,
      to_email: 'aazhiproducts24@gmail.com',
      to_name: 'Aazhi Products Admin',
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      customer_address: order.customer_address,
      orders: formattedOrders,
      cost: costs
    };
    
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );
    
    console.log('Admin email sent:', response);
    return { success: true, response };
    
  } catch (error) {
    console.error('Error sending admin email:', error);
    return { success: false, error };
  }
}
