// reports.js
// Check if Supabase client is initialized
if (typeof supabaseClient === 'undefined') {
  console.error('Supabase client not initialized. Please check supabase-config.js');
}

// Pagination state
let currentPage = 1;
let pageSize = 25;
let totalOrders = 0;
let totalPages = 0;
let allOrders = [];
let filteredOrders = [];

// Filter state
let filters = {
  search: '',
  status: 'all',
  dateFrom: '',
  dateTo: ''
};

// DOM Elements
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const dateFrom = document.getElementById('dateFrom');
const dateTo = document.getElementById('dateTo');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const pageSizeSelect = document.getElementById('pageSizeSelect');

const ordersTableBody = document.getElementById('ordersTableBody');
const ordersTable = document.getElementById('ordersTable');
const tableLoading = document.getElementById('tableLoading');
const tableEmpty = document.getElementById('tableEmpty');
const showingInfo = document.getElementById('showingInfo');
const paginationSection = document.getElementById('paginationSection');

const exportExcelBtn = document.getElementById('exportExcelBtn');

const orderModal = document.getElementById('orderModal');
const orderModalBackdrop = document.getElementById('orderModalBackdrop');
const orderModalClose = document.getElementById('orderModalClose');
const orderModalBody = document.getElementById('orderModalBody');

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadOrders();
  attachEventListeners();
});

// Attach event listeners
function attachEventListeners() {
  // Filter events
  applyFiltersBtn.addEventListener('click', applyFilters);
  clearFiltersBtn.addEventListener('click', clearFilters);
  
  // Search on Enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  });
  
  // Page size change
  pageSizeSelect.addEventListener('change', (e) => {
    pageSize = parseInt(e.target.value);
    currentPage = 1;
    renderTable();
  });
  
  // Pagination buttons
  document.getElementById('firstPageBtn').addEventListener('click', () => goToPage(1));
  document.getElementById('prevPageBtn').addEventListener('click', () => goToPage(currentPage - 1));
  document.getElementById('nextPageBtn').addEventListener('click', () => goToPage(currentPage + 1));
  document.getElementById('lastPageBtn').addEventListener('click', () => goToPage(totalPages));
  
  // Export buttons
  exportExcelBtn.addEventListener('click', exportToExcel);
  
  // Modal close
  orderModalClose.addEventListener('click', closeOrderModal);
  orderModalBackdrop.addEventListener('click', closeOrderModal);
}

// Load orders from Supabase
async function loadOrders() {
  try {
    tableLoading.style.display = 'flex';
    ordersTable.style.display = 'none';
    tableEmpty.style.display = 'none';
    
    const { data, error } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    allOrders = data || [];
    filteredOrders = [...allOrders];
    
    updateStats();
    renderTable();
    
  } catch (error) {
    console.error('Error loading orders:', error);
    tableLoading.innerHTML = `
      <i class="fa-solid fa-exclamation-triangle"></i>
      <p>Error loading orders. Please try again.</p>
    `;
  }
}

// ✅ FIXED: Update statistics - Only count successful payments for revenue
function updateStats() {
  const totalOrdersCount = allOrders.length;
  
  // ✅ Filter by payment status correctly
  const successCount = allOrders.filter(o => o.payment_status === 'success').length;
  const pendingCount = allOrders.filter(o => 
    o.payment_status === 'pending' || o.payment_status === 'initiated'
  ).length;
  const failedCount = allOrders.filter(o => o.payment_status === 'failed').length;
  
  // ✅ FIXED: Calculate revenue from SUCCESSFUL payments ONLY
  const totalRevenue = allOrders
    .filter(o => o.payment_status === 'success')
    .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  
  document.getElementById('totalOrders').textContent = totalOrdersCount;
  document.getElementById('successOrders').textContent = successCount;
  document.getElementById('pendingOrders').textContent = pendingCount;
  
  // ✅ ADDED: Update failed orders count if element exists
  const failedOrdersElement = document.getElementById('failedOrders');
  if (failedOrdersElement) {
    failedOrdersElement.textContent = failedCount;
  }
  
  // ✅ FIXED: Show revenue only from successful payments
  document.getElementById('totalRevenue').textContent = `₹${totalRevenue.toFixed(2)}`;
  
  console.log('📊 Stats Updated:', {
    total: totalOrdersCount,
    success: successCount,
    pending: pendingCount,
    failed: failedCount,
    revenue: totalRevenue.toFixed(2)
  });
}

// Apply filters
function applyFilters() {
  filters.search = searchInput.value.trim().toLowerCase();
  filters.status = statusFilter.value;
  filters.dateFrom = dateFrom.value;
  filters.dateTo = dateTo.value;
  
  filteredOrders = allOrders.filter(order => {
    // Search filter
    if (filters.search) {
      const searchMatch = 
        order.order_number.toLowerCase().includes(filters.search) ||
        order.customer_name.toLowerCase().includes(filters.search) ||
        order.customer_email.toLowerCase().includes(filters.search) ||
        order.customer_phone.toLowerCase().includes(filters.search);
      
      if (!searchMatch) return false;
    }
    
    // Status filter
    if (filters.status !== 'all' && order.payment_status !== filters.status) {
      return false;
    }
    
    // Date range filter
    const orderDate = new Date(order.created_at);
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      if (orderDate < fromDate) return false;
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      if (orderDate > toDate) return false;
    }
    
    return true;
  });
  
  currentPage = 1;
  renderTable();
}

// Clear filters
function clearFilters() {
  searchInput.value = '';
  statusFilter.value = 'all';
  dateFrom.value = '';
  dateTo.value = '';
  
  filters = {
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  };
  
  filteredOrders = [...allOrders];
  currentPage = 1;
  renderTable();
}

// Render table
function renderTable() {
  totalOrders = filteredOrders.length;
  totalPages = Math.ceil(totalOrders / pageSize);
  
  if (totalPages === 0) totalPages = 1;
  if (currentPage > totalPages) currentPage = totalPages;
  
  tableLoading.style.display = 'none';
  
  if (totalOrders === 0) {
    ordersTable.style.display = 'none';
    tableEmpty.style.display = 'flex';
    paginationSection.style.display = 'none';
    showingInfo.textContent = 'Showing 0 of 0 orders';
    return;
  }
  
  tableEmpty.style.display = 'none';
  ordersTable.style.display = 'table';
  paginationSection.style.display = 'flex';
  
  // Get current page orders
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalOrders);
  const pageOrders = filteredOrders.slice(startIndex, endIndex);
  
  // Update showing info
  showingInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${totalOrders} orders`;
  
  // Render table rows
  ordersTableBody.innerHTML = pageOrders.map(order => {
    const date = new Date(order.created_at);
    const formattedDate = date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
    <tr>
        <td data-label="Order #">
            <span class="order-number">${order.order_number}</span>
        </td>
        <td data-label="Customer">
            <div class="customer-info">
                <span class="customer-name">${order.customer_name}</span>
                <span class="customer-email">${order.customer_email}</span>
            </div>
        </td>
        <td data-label="Contact">
            <div class="contact-info">
                <span class="contact-phone">
                    <i class="fa-solid fa-phone"></i> ${order.customer_phone}
                </span>
            </div>
        </td>
        <td data-label="Amount">
            <span class="amount">₹${parseFloat(order.total_amount).toFixed(2)}</span>
        </td>
        <td data-label="Status">
            <span class="status-badge status-${order.payment_status}">
                ${getStatusIcon(order.payment_status)}
                ${order.payment_status}
            </span>
        </td>
        <td data-label="Date">
            <div class="order-date">
                <div>${formattedDate}</div>
                <div style="font-size: 0.8rem; color: #999;">${formattedTime}</div>
            </div>
        </td>
        <td data-label="Actions">
            <button class="action-btn" onclick="viewOrderDetails('${order.id}')">
                <i class="fa-solid fa-eye"></i> View
            </button>
            <button class="action-btn btn-delete" onclick="deleteOrder('${order.id}', '${order.order_number}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </td>
    </tr>
`;
  }).join('');
  
  renderPagination();
}

// Get status icon
function getStatusIcon(status) {
  const icons = {
    initiated: '<i class="fa-solid fa-circle-notch"></i>',
    pending: '<i class="fa-solid fa-clock"></i>',
    success: '<i class="fa-solid fa-check-circle"></i>',
    failed: '<i class="fa-solid fa-times-circle"></i>'
  };
  return icons[status] || '';
}

// Render pagination
function renderPagination() {
  const paginationNumbers = document.getElementById('paginationNumbers');
  const paginationInfo = document.getElementById('paginationInfo');
  
  paginationInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  
  // Generate page numbers
  let pages = [];
  
  if (totalPages <= 7) {
    // Show all pages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show first, last, current and surrounding pages
    if (currentPage <= 4) {
      pages = [1, 2, 3, 4, 5, '...', totalPages];
    } else if (currentPage >= totalPages - 3) {
      pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    }
  }
  
  paginationNumbers.innerHTML = pages.map(page => {
    if (page === '...') {
      return `<span style="padding: 0 8px; color: var(--sage);">...</span>`;
    }
    return `
      <button 
        class="page-number ${page === currentPage ? 'active' : ''}"
        onclick="goToPage(${page})"
      >
        ${page}
      </button>
    `;
  }).join('');
  
  // Update navigation buttons
  document.getElementById('firstPageBtn').disabled = currentPage === 1;
  document.getElementById('prevPageBtn').disabled = currentPage === 1;
  document.getElementById('nextPageBtn').disabled = currentPage === totalPages;
  document.getElementById('lastPageBtn').disabled = currentPage === totalPages;
}

// Go to page
function goToPage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderTable();
  
  // Scroll to top of table
  document.querySelector('.table-section').scrollIntoView({ behavior: 'smooth' });
}

// View order details
async function viewOrderDetails(orderId) {
  try {
    const { data: order, error } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single();
    
    if (error) throw error;
    
    renderOrderModal(order);
    openOrderModal();
    
  } catch (error) {
    console.error('Error loading order details:', error);
    alert('Error loading order details. Please try again.');
  }
}

// Delete order with confirmation
async function deleteOrder(orderId, orderNumber) {
    const confirmed = confirm(
        `⚠️ DELETE ORDER CONFIRMATION\n\n` +
        `Order Number: #${orderNumber}\n\n` +
        `This action will permanently delete:\n` +
        `• The order record\n` +
        `• All associated product items\n\n` +
        `⚠️ THIS PROCESS IS IRREVERSIBLE\n\n` +
        `Are you sure you want to continue?`
    );

    if (!confirmed) {
        return;
    }

    try {
        console.log(`Deleting order ${orderId}...`);

        // First, delete all order_items
        const { error: itemsError } = await supabaseClient
            .from('order_items')
            .delete()
            .eq('order_id', orderId);

        if (itemsError) {
            throw new Error(`Failed to delete order items: ${itemsError.message}`);
        }

        // Then, delete the order
        const { error: orderError } = await supabaseClient
            .from('orders')
            .delete()
            .eq('id', orderId);

        if (orderError) {
            throw new Error(`Failed to delete order: ${orderError.message}`);
        }

        alert(`✓ Order #${orderNumber} has been successfully deleted.`);
        await loadOrders();

    } catch (error) {
        console.error('Error deleting order:', error);
        alert(`❌ Error deleting order: ${error.message}\n\nPlease try again or contact support.`);
    }
}

// ✅ FIXED: Render order modal with correct delivery charge
function renderOrderModal(order) {
  const date = new Date(order.created_at);
  const formattedDate = date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // ✅ FIXED: Calculate delivery based on customer state
  const subtotal = order.order_items.reduce((sum, item) => sum + parseFloat(item.line_total), 0);
  const delivery = order.customer_state === 'Tamil Nadu' ? 50 : 100;
  const total = order.total_amount;
  
  orderModalBody.innerHTML = `
    <div style="text-align: center; margin: 1rem 0;">
      <button class="btn-secondary" onclick="printOrder('${order.id}')" style="border: none;">
          <i class="fa-solid fa-print"></i> Print Receipt
      </button>
    </div>
    <div class="order-details-grid">
      <div class="detail-card">
        <div class="detail-label">
          <i class="fa-solid fa-hashtag"></i> Order Number
        </div>
        <div class="detail-value">${order.order_number}</div>
      </div>
      
      <div class="detail-card">
        <div class="detail-label">
          <i class="fa-solid fa-user"></i> Customer Name
        </div>
        <div class="detail-value">${order.customer_name}</div>
      </div>
      
      <div class="detail-card">
        <div class="detail-label">
          <i class="fa-solid fa-envelope"></i> Email
        </div>
        <div class="detail-value" style="word-break: break-all;">${order.customer_email}</div>
      </div>
      
      <div class="detail-card">
        <div class="detail-label">
          <i class="fa-solid fa-phone"></i> Phone
        </div>
        <div class="detail-value">${order.customer_phone}</div>
      </div>
      
      <div class="detail-card">
        <div class="detail-label">
          <i class="fa-solid fa-map-location-dot"></i> State
        </div>
        <div class="detail-value">${order.customer_state}</div>
      </div>
      
      <div class="detail-card" style="grid-column: 1 / -1;">
        <div class="detail-label">
          <i class="fa-solid fa-location-dot"></i> Delivery Address
        </div>
        <div class="detail-value">${order.customer_address}</div>
      </div>
      
      <div class="detail-card">
        <div class="detail-label">
          <i class="fa-solid fa-calendar"></i> Order Date
        </div>
        <div class="detail-value">${formattedDate}</div>
      </div>
      
      <div class="detail-card">
        <div class="detail-label">
          <i class="fa-solid fa-circle-info"></i> Payment Status
        </div>
        <div class="detail-value">
          <span class="status-badge status-${order.payment_status}">
            ${getStatusIcon(order.payment_status)}
            ${order.payment_status}
          </span>
        </div>
      </div>
    </div>
    
    <div class="products-section">
      <h3>
        <i class="fa-solid fa-box"></i> Order Items
      </h3>
      <div class="products-list">
        ${order.order_items.map(item => `
          <div class="product-item">
            <img src="${item.product_image}" alt="${item.product_name}" class="product-image">
            <div class="product-info">
              <div class="product-name">${item.product_name}</div>
              <div class="product-meta">
                <span><i class="fa-solid fa-box"></i> Size: ${item.product_size}</span>
                <span><i class="fa-solid fa-indian-rupee-sign"></i> Price: ₹${parseFloat(item.price).toFixed(2)}</span>
                <span><i class="fa-solid fa-hashtag"></i> Quantity: ${item.quantity}</span>
              </div>
            </div>
            <div class="product-pricing">
              <div class="product-price">₹${parseFloat(item.line_total).toFixed(2)}</div>
              <div class="product-total">${item.quantity} × ₹${parseFloat(item.price).toFixed(2)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    <div style="text-align: center; margin: 2rem 0;">
      <a 
          href="https://wa.me/${order.customer_phone}?text=Hello%20${encodeURIComponent(order.customer_name)},%20regarding%20your%20Aazhi%20order%20${order.order_number}" 
          target="_blank"
          class="btn-primary" 
          style="display: inline-flex; text-decoration: none;">
          <i class="fa-brands fa-whatsapp"></i> Contact Customer on WhatsApp
      </a>
    </div>
    <div class="order-summary">
      <div class="summary-row">
        <span>Subtotal:</span>
        <span>₹${subtotal.toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>Delivery Charge (${order.customer_state}):</span>
        <span>₹${delivery.toFixed(2)}</span>
      </div>
      <div class="summary-row total">
        <span>Total Amount:</span>
        <span>₹${parseFloat(total).toFixed(2)}</span>
      </div>
    </div>
  `;
}

// Open order modal
function openOrderModal() {
  orderModal.classList.add('open');
  orderModalBackdrop.classList.add('show');
  document.body.style.overflow = 'hidden';
}

// Close order modal
function closeOrderModal() {
  orderModal.classList.remove('open');
  orderModalBackdrop.classList.remove('show');
  document.body.style.overflow = '';
}

// Export to Excel
function exportToExcel() {
  if (filteredOrders.length === 0) {
    alert('No data to export');
    return;
  }
  
  const exportData = filteredOrders.map(order => {
    const itemsCount = order.order_items ? order.order_items.length : 0;
    const itemsNames = order.order_items ? order.order_items.map(i => i.product_name).join(', ') : '';
    
    return {
      'Order Number': order.order_number,
      'Customer Name': order.customer_name,
      'Email': order.customer_email,
      'Phone': order.customer_phone,
      'State': order.customer_state,
      'Address': order.customer_address,
      'Total Amount': parseFloat(order.total_amount).toFixed(2),
      'Payment Status': order.payment_status,
      'Items Count': itemsCount,
      'Items': itemsNames,
      'Order Date': new Date(order.created_at).toLocaleString('en-IN')
    };
  });
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  
  ws['!cols'] = [
    { wch: 20 }, // Order Number
    { wch: 20 }, // Customer Name
    { wch: 30 }, // Email
    { wch: 15 }, // Phone
    { wch: 15 }, // State
    { wch: 40 }, // Address
    { wch: 12 }, // Total Amount
    { wch: 15 }, // Payment Status
    { wch: 12 }, // Items Count
    { wch: 50 }, // Items
    { wch: 20 }  // Order Date
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');
  
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `aazhi-orders-${timestamp}.xlsx`;
  
  XLSX.writeFile(wb, filename);
}

// Print order receipt
function printOrder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const delivery = order.customer_state === 'Tamil Nadu' ? 50 : 100;
    const subtotal = order.order_items.reduce((sum, item) => sum + parseFloat(item.line_total), 0);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Order Receipt - ${order.order_number}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: bold; color: #1a2e1f; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background: #1a2e1f; color: white; }
                .total { font-weight: bold; font-size: 18px; }
                .summary { margin-top: 20px; text-align: right; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🌿 Aazhi Products</div>
                <p>Order Receipt</p>
            </div>
            
            <h2>Order #${order.order_number}</h2>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
            <p><strong>Customer:</strong> ${order.customer_name}</p>
            <p><strong>Phone:</strong> ${order.customer_phone}</p>
            <p><strong>State:</strong> ${order.customer_state}</p>
            <p><strong>Address:</strong> ${order.customer_address}</p>
            
            <h3>Items:</h3>
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Size</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.order_items.map(item => `
                        <tr>
                            <td>${item.product_name}</td>
                            <td>${item.product_size}</td>
                            <td>${item.quantity}</td>
                            <td>₹${item.price}</td>
                            <td>₹${item.line_total}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="summary">
                <p>Subtotal: ₹${subtotal.toFixed(2)}</p>
                <p>Delivery (${order.customer_state}): ₹${delivery.toFixed(2)}</p>
                <p class="total">Total: ₹${order.total_amount}</p>
            </div>
            
            <script>
                window.print();
                window.onafterprint = () => window.close();
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Make functions available globally
window.viewOrderDetails = viewOrderDetails;
window.goToPage = goToPage;
window.deleteOrder = deleteOrder;
window.printOrder = printOrder;