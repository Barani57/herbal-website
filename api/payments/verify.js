// api/payments/verify.js
const crypto = require("crypto");

// For local dev ONLY
if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch (e) {
    // ignore
  }
}

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ detail: "Missing payment verification fields" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ detail: "Invalid payment signature" });
    }

    return res.status(200).json({ status: "success" });
  } catch (err) {
    console.error("Error verifying Razorpay payment:", err);
    return res.status(500).json({ detail: "Verification error" });
  }
};
