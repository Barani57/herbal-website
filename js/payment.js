/* ============================================
   HERBAL WELLNESS STORE - PAYMENT (frontend)
   Uses FastAPI backend: /payments/order and /payments/verify
   ============================================ */

class Payment {
  constructor() {
    // Backend API base URL - change if your backend runs on a different host/port
    this.backendUrl = "http://127.0.0.1:8000";

    // EmailJS placeholders (fill if you want to enable emails)
    this.emailJSServiceId = "YOUR_SERVICE_ID";
    this.emailJSTemplateId = "YOUR_TEMPLATE_ID";
    this.emailJSPublicKey = "YOUR_PUBLIC_KEY";

    // Initialize EmailJS (optional) - uncomment after adding emailjs sdk and keys
    // if (window.emailjs && this.emailJSPublicKey) {
    //   emailjs.init(this.emailJSPublicKey);
    // }
  }

  // Initiate payment flow: called by checkout logic
  async initiatePayment(formData, totalAmount) {
    try {
      // Ensure total Amount is a clean number in rupees
      let total = totalAmount;
      if (typeof total === "string") {
        total = parseFloat(total.replace(/[^\d.]/g, ""));
      } else {
        total = Number(total);
      }

      if (!total || isNaN(total) || total <= 0) {
        alert("Invalid cart total. Please check your cart.");
        return;
      }

      console.log("Creating order on backend for amount (INR):", total);

      // Disable pay button (if exists)
      const payBtn = document.getElementById("payBtn");
      if (payBtn) { payBtn.disabled = true; payBtn.classList.add("loading"); }

      // 1) Create order on backend (backend converts rupees -> paise)
      const orderResp = await fetch(`${this.backendUrl}/payments/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          currency: "INR",
          receipt: `herbal_${Date.now()}`
        })
      });

      if (!orderResp.ok) {
        // Read backend error (friendly)
        let errText = "Unknown error";
        try { const j = await orderResp.json(); errText = j.detail || JSON.stringify(j); }
        catch (e) { errText = await orderResp.text(); }
        console.error("Order creation failed:", orderResp.status, errText);
        alert("Unable to create payment order: " + errText);
        if (payBtn) { payBtn.disabled = false; payBtn.classList.remove("loading"); }
        return;
      }

      const orderData = await orderResp.json();
      console.log("Order created:", orderData);
      const { key, orderId, amount: amountInPaise, currency } = orderData;

      // 2) Open Razorpay checkout
      const options = {
        key: key,                      // razorpay key id returned by backend (public key)
        amount: amountInPaise,         // already in paise
        currency: currency || "INR",
        name: "Herbal Wellness Store",
        description: "Order payment",
        image: "./assets/logo.png",
        order_id: orderId,
        prefill: {
          name: formData.fullName || "",
          email: formData.email || "",
          contact: formData.phone || ""
        },
        notes: {
          address: `${formData.address1 || ""}, ${formData.address2 || ""}, ${formData.city || ""}, ${formData.state || ""} - ${formData.pincode || ""}`
        },
        theme: { color: "#2D5F3F" },

        // Handler called on successful payment (client receives ids)
        handler: async (response) => {
          console.log("Razorpay response (client):", response);

          try {
            // 3) Verify payment with backend (server will check signature)
            const verifyResp = await fetch(`${this.backendUrl}/payments/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (!verifyResp.ok) {
              let errText = "Verification failed";
              try { errText = (await verifyResp.json()).detail || errText; } catch(e) { errText = await verifyResp.text(); }
              console.error("Verification error:", verifyResp.status, errText);
              alert("Payment verification failed: " + errText);
              return;
            }

            const verifyData = await verifyResp.json();
            if (verifyData.status === "success") {
              // optional: fetch order details if you want more info (order amount etc.)
              this.handlePaymentSuccess(response, formData, total, orderId);
            } else {
              this.handlePaymentFailure({ description: "Verification returned non-success" });
            }
          } catch (err) {
            console.error("Error verifying payment:", err);
            this.handlePaymentFailure({ description: "Verification error" });
          } finally {
            if (payBtn) { payBtn.disabled = false; payBtn.classList.remove("loading"); }
          }
        },

        // handle failures in the checkout
        modal: {
          ondismiss: () => {
            if (payBtn) { payBtn.disabled = false; payBtn.classList.remove("loading"); }
          }
        }
      };

      const rzp = new Razorpay(options);

      rzp.on("payment.failed", (resp) => {
        console.error("Payment failed event:", resp);
        this.handlePaymentFailure(resp.error || resp);
        if (payBtn) { payBtn.disabled = false; payBtn.classList.remove("loading"); }
      });

      rzp.open();
    } catch (err) {
      console.error("Payment init error:", err);
      alert("Unable to initiate payment. Please try again.");
      const payBtn = document.getElementById("payBtn");
      if (payBtn) { payBtn.disabled = false; payBtn.classList.remove("loading"); }
    }
  }

  // Called when payment is verified server-side
  handlePaymentSuccess(response, formData, totalAmount, orderId) {
    console.log("Payment success (final):", response);

    // Save order to localStorage
    this.storeOrder(orderId, formData, totalAmount, response.razorpay_payment_id);

    // Optionally send email (requires emailjs setup)
    this.sendConfirmationEmail(formData, orderId, totalAmount);

    // Clear cart (your cart implementation may differ)
    if (window.cart && typeof window.cart.clearCart === "function") {
      window.cart.clearCart();
    }

    // Close checkout overlay
    const checkoutOverlay = document.getElementById("checkoutOverlay");
    if (checkoutOverlay) {
      checkoutOverlay.classList.remove("active");
      document.body.style.overflow = "";
    }

    // Show success UI
    this.showSuccessModal(orderId, totalAmount, formData.email);
  }

  handlePaymentFailure(error) {
    console.error("Payment failed:", error);
    const reason = error && (error.description || error.reason || error.code) || "Payment processing failed";
    this.showFailureModal(reason);
  }

  // Persist a simple order record in localStorage
  storeOrder(orderId, formData, totalAmount, paymentId) {
    const order = {
      orderId,
      paymentId,
      date: new Date().toISOString(),
      customer: {
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: {
          line1: formData.address1 || "",
          line2: formData.address2 || "",
          city: formData.city || "",
          state: formData.state || "",
          pincode: formData.pincode || ""
        }
      },
      items: (window.cart && window.cart.items) || [],
      subtotal: (window.cart && typeof window.cart.getTotal === "function") ? window.cart.getTotal() : null,
      shipping: (window.checkout && typeof window.checkout.calculateShipping === "function") ? window.checkout.calculateShipping() : 0,
      total: totalAmount,
      status: "confirmed"
    };

    const orders = JSON.parse(localStorage.getItem("herbalOrders") || "[]");
    orders.push(order);
    localStorage.setItem("herbalOrders", JSON.stringify(orders));
  }

  // EmailJS - placeholder
  sendConfirmationEmail(formData, orderId, totalAmount) {
    // If you want to enable EmailJS:
    // 1. include the emailjs SDK in your HTML
    // 2. uncomment and set this.emailJSServiceId / this.emailJSTemplateId / this.emailJSPublicKey
    // 3. configure template variables in EmailJS dashboard
    /*
    const params = {
      customer_name: formData.fullName,
      customer_email: formData.email,
      order_id: orderId,
      total_amount: totalAmount,
      products: JSON.stringify(window.cart.items || []),
      address: `${formData.address1}, ${formData.city}, ${formData.state} - ${formData.pincode}`
    };
    emailjs.send(this.emailJSServiceId, this.emailJSTemplateId, params)
      .then(res => console.log("Email sent", res))
      .catch(err => console.error("Email failed", err));
    */
    console.log("Email placeholder - configure EmailJS to enable email sending.");
  }

  // UI modals
  showSuccessModal(orderId, amount, email) {
    const modal = document.getElementById("successModal");
    const orderIdEl = document.getElementById("successOrderId");
    const amountEl = document.getElementById("successAmount");
    const emailEl = document.getElementById("successEmail");
    if (modal) {
      if (orderIdEl) orderIdEl.textContent = orderId;
      if (amountEl) amountEl.textContent = `₹${amount}`;
      if (emailEl) emailEl.textContent = email || "";
      modal.classList.add("active");
    } else {
      alert(`Payment successful! Order: ${orderId}, Amount: ₹${amount}`);
    }
  }

  showFailureModal(reason) {
    const modal = document.getElementById("failureModal");
    const reasonEl = document.getElementById("failureReason");
    if (modal) {
      if (reasonEl) reasonEl.textContent = reason;
      modal.classList.add("active");
    } else {
      alert("Payment failed: " + reason);
    }
  }
}

// Create global instance
window.payment = new Payment();
