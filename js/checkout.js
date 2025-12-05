/* ============================================
   HERBAL WELLNESS STORE - CHECKOUT + PAYMENT
   Validation, Order Summary & Razorpay Payment
   ============================================ */

class Checkout {
    constructor() {
        this.formData = {};
        this.isValid = false;
        this.backendUrl = "";
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
// ---- PAYMENT LOGIC (PhonePe) ----
    async processPayment() {
        if (!this.checkFormValidity()) {
            alert('Please fill in all required fields correctly');
            return;
        }

        const formData = this.getFormData();
        const total = this.calculateTotal();

        this.formData = formData;

        const payBtn = document.getElementById('payBtn');

        try {
            if (payBtn) {
                payBtn.disabled = true;
                payBtn.classList.add('loading');
            }

            // Call our PhonePe backend
            const resp = await fetch('/api/phonepe/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: total,
                    fullName: formData.fullName,
                    phone: formData.phone,
                    email: formData.email
                })
            });

            if (!resp.ok) {
                const errText = await resp.text();
                console.error('PhonePe pay error:', errText);
                alert('Unable to initiate payment. Please try again.');
                if (payBtn) {
                    payBtn.disabled = false;
                    payBtn.classList.remove('loading');
                }
                return;
            }

            const data = await resp.json();
            console.log('PhonePe pay data:', data);

            if (!data.redirectUrl) {
                alert('No redirect URL returned from payment gateway.');
                if (payBtn) {
                    payBtn.disabled = false;
                    payBtn.classList.remove('loading');
                }
                return;
            }

            // Redirect user to PhonePe hosted checkout page
            window.location.href = data.redirectUrl;

        } catch (err) {
            console.error('Error during PhonePe payment init:', err);
            alert('Unable to initiate payment. Please try again.');
            if (payBtn) {
                payBtn.disabled = false;
                payBtn.classList.remove('loading');
            }
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
