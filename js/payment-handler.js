// payment-handler.js - PhonePe NEW API Integration

let currentOrderId = null;
let currentOrderNumber = null;
let currentMerchantTxnId = null;

// Modal elements
const paymentModal = document.getElementById('paymentModal');
const paymentModalBackdrop = document.getElementById('paymentModalBackdrop');
const paymentModalClose = document.getElementById('paymentModalClose');
const customerForm = document.getElementById('customerDetailsForm');
const formError = document.getElementById('formError');

const resultModal = document.getElementById('resultModal');
const resultModalBackdrop = document.getElementById('resultModalBackdrop');
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const resultModalClose = document.getElementById('resultModalClose');

// Payment Handler for UPI Pay Button
const upiPayBtn = document.getElementById('upiPayBtn');

if (upiPayBtn) {
    upiPayBtn.addEventListener('click', async () => {
        const cart = getCart();
        if (!cart || cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        // Get customer details from cart form
        const name = document.getElementById('cartCustomerName')?.value.trim();
        const email = document.getElementById('cartCustomerEmail')?.value.trim();
        const phone = document.getElementById('cartCustomerPhone')?.value.trim();
        const state = document.getElementById('cartCustomerState')?.value;
        const address = document.getElementById('cartCustomerAddress')?.value.trim();
        const cartFormError = document.getElementById('cartFormError');

        // Validate
        if (!name || !email || !phone || !state || !address) {
            if (cartFormError) {
                cartFormError.textContent = 'Please fill all required fields!';
                cartFormError.classList.add('show');
            } else {
                alert('Please fill all required fields!');
            }
            return;
        }

        if (!email.includes('@')) {
            if (cartFormError) {
                cartFormError.textContent = 'Please enter a valid email address!';
                cartFormError.classList.add('show');
            } else {
                alert('Please enter a valid email address!');
            }
            return;
        }

        if (cartFormError) {
            cartFormError.classList.remove('show');
        }

        // Calculate totals
        const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
        const delivery = state === 'Tamil Nadu' ? 50 : 100;
        const totalAmount = subtotal + delivery;

        // Generate order number
        const timestamp = Date.now();
        const orderNumber = `ORD-${timestamp}`;

        // ✅ NEW API: Prepare data in correct format
        const orderData = {
            order_number: orderNumber,
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            customerState: state,
            customerAddress: address,
            totalAmount: totalAmount.toFixed(2)
        };

        // ✅ NEW API: Prepare items array
        const items = cart.map(item => ({
            name: item.name,
            size: item.size,
            image: item.image || item.img || '',
            quantity: item.quantity,
            price: parseFloat(item.price),
            lineTotal: (parseFloat(item.price) * item.quantity).toFixed(2)
        }));

        console.log('🛒 Order Data:', orderData);
        console.log('📦 Items:', items);

        try {
            // Show loading
            upiPayBtn.disabled = true;
            upiPayBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

            // ✅ NEW API: Call create-payment function
            const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ 
                    orderData: orderData,
                    items: items 
                })
            });

            const result = await response.json();
            console.log('💳 Payment Response:', result);

            if (result.success && result.redirectUrl) {
                // Store order number for status check
                localStorage.setItem('pending_order_id', orderNumber);
                
                // Redirect to PhonePe Checkout Page
                console.log('✅ Redirecting to PhonePe...');
                window.location.href = result.redirectUrl;
            } else {
                throw new Error(result.error || 'Payment initiation failed');
            }

        } catch (error) {
            console.error('❌ Payment Error:', error);
            alert('Payment failed: ' + error.message);
            
            // Reset button
            upiPayBtn.disabled = false;
            upiPayBtn.innerHTML = '<span>Proceed to Checkout</span><i class="fa-solid fa-indian-rupee-sign"></i>';
        }
    });
}

// Open payment modal
function openPaymentModal() {
    if (paymentModal) {
        paymentModal.classList.add('open');
    }
    if (paymentModalBackdrop) {
        paymentModalBackdrop.classList.add('show');
        paymentModal.setAttribute('aria-hidden', 'false');
    }
    document.body.style.overflow = 'hidden';
}

// Close payment modal
function closePaymentModal() {
    if (paymentModal) {
        paymentModal.classList.remove('open');
    }
    if (paymentModalBackdrop) {
        paymentModalBackdrop.classList.remove('show');
        paymentModal.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    if (customerForm) {
        customerForm.reset();
    }
    hideError();
}

// Close modal handlers
if (paymentModalClose) {
    paymentModalClose.addEventListener('click', closePaymentModal);
}
if (paymentModalBackdrop) {
    paymentModalBackdrop.addEventListener('click', closePaymentModal);
}

// Form submission (for modal-based checkout if used)
if (customerForm) {
    customerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        // Get form data
        const formData = new FormData(customerForm);
        const customerData = {
            name: formData.get('name')?.trim() || '',
            email: formData.get('email')?.trim() || '',
            phone: formData.get('phone')?.trim() || '',
            state: formData.get('state')?.trim() || '',
            address: formData.get('address')?.trim() || ''
        };

        // Validate
        if (!customerData.name || !customerData.email || !customerData.phone || !customerData.state || !customerData.address) {
            showError('Please fill in all required fields');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerData.email)) {
            showError('Please enter a valid email address');
            return;
        }

        // Show loading
        const submitBtn = document.getElementById('submitOrderBtn');
        const submitBtnText = document.getElementById('submitBtnText');
        const submitBtnLoader = document.getElementById('submitBtnLoader');

        if (submitBtnText) submitBtnText.style.display = 'none';
        if (submitBtnLoader) submitBtnLoader.style.display = 'inline-block';
        if (submitBtn) submitBtn.disabled = true;

        try {
            // Get cart
            const cart = getCart();
            
            if (!cart || cart.length === 0) {
                throw new Error('Cart is empty');
            }

            // Calculate total
            const deliveryCharge = customerData.state === 'Tamil Nadu' ? 50 : 100;
            const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
            const totalAmount = subtotal + deliveryCharge;

            // Generate order number
            const timestamp = Date.now();
            currentOrderNumber = `ORD-${timestamp}`;

            // ✅ NEW API: Prepare order data
            const orderData = {
                order_number: currentOrderNumber,
                customerName: customerData.name,
                customerEmail: customerData.email,
                customerPhone: customerData.phone,
                customerState: customerData.state,
                customerAddress: customerData.address,
                totalAmount: totalAmount.toFixed(2)
            };

            // ✅ NEW API: Prepare items
            const items = cart.map(item => ({
                name: item.name,
                size: item.size,
                image: item.image || item.img || '',
                quantity: item.quantity,
                price: parseFloat(item.price),
                lineTotal: (parseFloat(item.price) * item.quantity).toFixed(2)
            }));

            // ✅ NEW API: Call create-payment function
            const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ 
                    orderData: orderData,
                    items: items 
                })
            });

            const result = await response.json();

            if (result.success && result.redirectUrl) {
                currentOrderId = result.phonepeOrderId;

                // Store order number for status check
                localStorage.setItem('pending_order_id', currentOrderNumber);

                // Close modal
                closePaymentModal();

                // Redirect to PhonePe
                window.location.href = result.redirectUrl;

            } else {
                throw new Error(result.error || 'Failed to initiate payment');
            }

        } catch (error) {
            console.error('Error initiating payment:', error);
            showError('Failed to initiate payment. Please try again.');
        } finally {
            if (submitBtnText) submitBtnText.style.display = 'inline-block';
            if (submitBtnLoader) submitBtnLoader.style.display = 'none';
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

// Show result modal
function showResultModal(type, title, message) {
    if (resultIcon) {
        resultIcon.innerHTML = type === 'success'
            ? '<i class="fa-solid fa-check-circle"></i>'
            : '<i class="fa-solid fa-times-circle"></i>';
        resultIcon.className = `result-icon ${type}`;
    }
    if (resultTitle) resultTitle.textContent = title;
    if (resultMessage) resultMessage.innerHTML = message;

    if (resultModal) resultModal.classList.add('open');
    if (resultModalBackdrop) resultModalBackdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close result modal
function closeResultModal() {
    if (resultModal) resultModal.classList.remove('open');
    if (resultModalBackdrop) resultModalBackdrop.classList.remove('show');
    document.body.style.overflow = '';

    // Clear cart if success
    if (resultIcon && resultIcon.classList.contains('success')) {
        const CART_KEY = 'aazhi_cart';
        localStorage.removeItem(CART_KEY);
        localStorage.removeItem('pending_order_id');
        if (typeof updateFloatingCart === 'function') updateFloatingCart(0);
        if (typeof renderCartDrawerItems === 'function') renderCartDrawerItems();
        if (typeof renderProducts === 'function') renderProducts();
    }
}

if (resultModalClose) {
    resultModalClose.addEventListener('click', closeResultModal);
}
if (resultModalBackdrop) {
    resultModalBackdrop.addEventListener('click', closeResultModal);
}

// Show error message
function showError(message) {
    if (formError) {
        formError.textContent = message;
        formError.classList.add('show');
    }
}

// Hide error message
function hideError() {
    if (formError) {
        formError.classList.remove('show');
        formError.textContent = '';
    }
}

console.log('✅ Payment handler loaded (NEW API)');