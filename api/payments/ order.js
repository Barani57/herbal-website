// api/payments/order.js
const Razorpay = require("razorpay");
const crypto = require("crypto");

// For local dev ONLY (dotenv). On Vercel, env vars are injected automatically.
if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch (e) {
    // ignore if dotenv not installed
  }
}

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing");
}

const razorpayClient = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Vercel Node function signature
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  try {
    const {
      amount,
      currency = "INR",
      receipt,
      customerName,
      customerEmail,
      customerPhone,
    } = req.body || {};

    if (amount === undefined || amount === null) {
      return res.status(400).json({ detail: "Amount is required" });
    }

    const amountNumber = Number(amount);
    if (Number.isNaN(amountNumber)) {
      return res.status(400).json({ detail: "Amount must be a number" });
    }

    const amountPaise = Math.round(amountNumber * 100);
    if (amountPaise < 100) {
      return res.status(400).json({ detail: "Amount must be at least ₹1" });
    }

    const orderData = {
      amount: amountPaise,
      currency: currency || "INR",
      receipt:
        receipt ||
        `herbal_rcpt_${crypto.randomBytes(4).toString("hex")}`,
      notes: {
        customer_name: customerName || "",
        customer_email: customerEmail || "",
        customer_phone: customerPhone || "",
      },
    };

    const order = await razorpayClient.orders.create(orderData);

    return res.status(200).json({
      key: RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("Error creating Razorpay order:", err);

    const statusCode = err.statusCode || 500;
    const detail =
      (err.error && err.error.description) ||
      err.message ||
      "Failed to create order";

    if (statusCode >= 500) {
      return res.status(502).json({ detail: "Razorpay server error" });
    }

    return res.status(400).json({ detail });
  }
};
