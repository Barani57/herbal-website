/* ============================================
   HERBAL WELLNESS STORE - CHECKOUT + PAYMENT
   Validation, Order Summary & Razorpay Payment
   ============================================ */

class Checkout {
    constructor() {
        this.formData = {};
        this.isValid = false;
        this.backendUrl = "http://127.0.0.1:8000"; // FastAPI backend
        this.initEventListeners();
    }

    // Initialize event listeners
    initEventListeners() {
        const form = document.getElementById('checkoutForm');
        const checkoutCloseBtn = document.getElementById('checkoutCloseBtn');
        const checkoutOverlay = document.getElementById('checkoutOverlay');
        const payBtn = document.getElementById('payBtn');

        // Form validation on input
        if (form) {
            const inputs = form.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.validateField(input));
            });
        }

        // Close checkout
        const closeCheckout = () => {
            if (checkoutOverlay) {
                checkoutOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        };

        if (checkoutCloseBtn) {
            checkoutCloseBtn.addEventListener('click', closeCheckout);
        }

        // Pay button
        if (payBtn) {
            payBtn.addEventListener('click', () => this.processPayment());
        }
    }

    // Validate individual field
    validateField(field) {
        const fieldName = field.name;
        const value = field.value.trim();
        const errorElement = document.getElementById(`${fieldName}Error`);

        let isValid = true;
        let errorMessage = '';

        // Validation rules
        switch (fieldName) {
            case 'fullName':
                if (value.length < 3) {
                    isValid = false;
                    errorMessage = 'Please enter your full name';
                }
                break;

            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
                break;

            case 'phone':
                const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
                const cleanPhone = value.replace(/[\s-]/g, '');
                if (!phoneRegex.test(cleanPhone)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid 10-digit mobile number';
                }
                break;

            case 'address1':
                if (value.length < 5) {
                    isValid = false;
                    errorMessage = 'Please enter your complete address';
                }
                break;

            case 'city':
                if (value.length < 2) {
                    isValid = false;
                    errorMessage = 'Please enter your city';
                }
                break;

            case 'state':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Please select your state';
                }
                break;

            case 'pincode':
                const pincodeRegex = /^\d{6}$/;
                if (!pincodeRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid 6-digit PIN code';
                }
                break;
        }

        // Update field state
        if (field.hasAttribute('required')) {
            if (isValid) {
                field.classList.remove('invalid');
                field.classList.add('valid');
                if (errorElement) errorElement.textContent = '';
            } else {
                field.classList.remove('valid');
                field.classList.add('invalid');
                if (errorElement) errorElement.textContent = errorMessage;
            }
        }

        // Check overall form validity
        this.checkFormValidity();

        return isValid;
    }

    // Check if entire form is valid
    checkFormValidity() {
        const form = document.getElementById('checkoutForm');
        const payBtn = document.getElementById('payBtn');
        
        if (!form) return;

        const requiredFields = form.querySelectorAll('[required]');
        let allValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim() || field.classList.contains('invalid')) {
                allValid = false;
            }
        });

        this.isValid = allValid;

        // Enable/disable pay button
        if (payBtn) {
            payBtn.disabled = !allValid;
        }

        return allValid;
    }

    // Get form data
    getFormData() {
        const form = document.getElementById('checkoutForm');
        if (!form) return null;

        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        return data;
    }

    // Update order summary
    updateOrderSummary() {
        const summaryItems = document.getElementById('summaryItems');
        const summarySubtotal = document.getElementById('summarySubtotal');
        const summaryShipping = document.getElementById('summaryShipping');
        const summaryTotal = document.getElementById('summaryTotal');
        const payAmount = document.getElementById('payAmount');

        if (!summaryItems || !window.cart) return;

        const items = window.cart.items;
        const subtotal = window.cart.getTotal();
        const shipping = subtotal >= 500 ? 0 : 50;
        const total = subtotal + shipping;

        // Render summary items
        summaryItems.innerHTML = items.map(item => `
            <div class="summary-item">
                <img src="${item.image}" alt="${item.name}" class="summary-item-image">
                <div class="summary-item-details">
                    <div class="summary-item-name">${item.name}</div>
                    <div class="summary-item-meta">${item.size} × ${item.quantity}</div>
                </div>
                <div class="summary-item-price">₹${item.price * item.quantity}</div>
            </div>
        `).join('');

        // Update totals
        if (summarySubtotal) summarySubtotal.textContent = `₹${subtotal}`;
        if (summaryShipping) {
            summaryShipping.textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;
        }
        if (summaryTotal) summaryTotal.textContent = `₹${total}`;
        if (payAmount) payAmount.textContent = total;
    }

    // Calculate shipping
    calculateShipping() {
        const subtotal = window.cart.getTotal();
        return subtotal >= 500 ? 0 : 50;
    }

    // Calculate total
    calculateTotal() {
        const subtotal = window.cart.getTotal();
        const shipping = this.calculateShipping();
        return subtotal + shipping;
    }

    // ---- PAYMENT LOGIC (FastAPI + Razorpay) ----
    async processPayment() {
        if (!this.checkFormValidity()) {
            alert('Please fill in all required fields correctly');
            return;
        }

        const formData = this.getFormData();
        const total = this.calculateTotal();

        this.formData = formData;

        try {
            // 1) Create order on backend
            const orderRes = await fetch(`${this.backendUrl}/payments/order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: total,
                    currency: 'INR',
                    receipt: `herbal_${Date.now()}`,
                    customerName: formData.fullName,
                    customerEmail: formData.email,
                    customerPhone: formData.phone
                })
            });

            if (!orderRes.ok) {
                console.error('Order create failed:', await orderRes.text());
                alert('Unable to create payment order. Please try again.');
                return;
            }

            const orderData = await orderRes.json();
            const { key, orderId, amount, currency } = orderData;

            // 2) Open Razorpay checkout
            const options = {
                key: key,
                amount: amount,      // in paise
                currency: currency,
                name: 'Herbal Wellness Store',
                description: 'Order payment',
                image: './assets/logo.png', // adjust if needed
                order_id: orderId,
                handler: async (response) => {
                    // 3) Verify payment on backend
                    try {
                        const verifyRes = await fetch(`${this.backendUrl}/payments/verify`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        if (!verifyRes.ok) {
                            console.error('Verification failed:', await verifyRes.text());
                            alert('Payment verification failed. Please contact support.');
                            return;
                        }

                        const verifyData = await verifyRes.json();
                        if (verifyData.status === 'success') {
                            this.handlePaymentSuccess(response, formData, total, orderId);
                        } else {
                            this.handlePaymentFailure({
                                description: 'Verification failed. Please try again.'
                            });
                        }
                    } catch (err) {
                        console.error('Verification error:', err);
                        this.handlePaymentFailure({
                            description: 'Verification error. Please try again.'
                        });
                    }
                },
                prefill: {
                    name: formData.fullName,
                    email: formData.email,
                    contact: formData.phone
                },
                notes: {
                    address: `${formData.address1}, ${formData.address2 || ''}, ${formData.city}, ${formData.state} - ${formData.pincode}`
                },
                theme: {
                    color: '#2D5F3F'
                },
                method: {
                    card: true,
                    upi: false,
                    wallet: false,
                    netbanking: false
                }
            };

            const rzp = new Razorpay(options);

            rzp.on('payment.failed', (response) => {
                this.handlePaymentFailure(response.error || response);
            });

            rzp.open();
        } catch (err) {
            console.error('Error during payment init:', err);
            alert('Unable to initiate payment. Please try again.');
        }
    }

    handlePaymentSuccess(response, formData, totalAmount, orderId) {
        console.log('Payment success:', response);

        alert(
            `Payment successful!\n\n` +
            `Name: ${formData.fullName}\n` +
            `Amount: ₹${totalAmount}\n` +
            `Payment ID: ${response.razorpay_payment_id}`
        );

        if (window.cart && typeof window.cart.clearCart === 'function') {
            window.cart.clearCart();
        }

        const checkoutOverlay = document.getElementById('checkoutOverlay');
        if (checkoutOverlay) {
            checkoutOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    handlePaymentFailure(error) {
        console.error('Payment failed:', error);
        alert(
            `Payment failed.\n\nReason: ${
                error.description || error.reason || 'Unknown error'
            }\nPlease try again.`
        );
    }
}

// Initialize checkout
const checkout = new Checkout();
window.checkout = checkout;
