// api/phonepe/pay.js
const crypto = require("crypto");
const axios = require("axios");

// For local dev only – Vercel injects env vars in prod
if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch (e) {}
}

const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY;
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";

// Sandbox base URL (use prod URL when you go live)
const PHONEPE_BASE_URL =
  process.env.PHONEPE_BASE_URL ||
  "https://api-preprod.phonepe.com/apis/pg-sandbox";

if (!PHONEPE_MERCHANT_ID || !PHONEPE_SALT_KEY) {
  console.error("PhonePe env vars missing");
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  try {
    const { amount, fullName, phone, email } = req.body || {};

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ detail: "Invalid amount" });
    }
    if (!phone) {
      return res.status(400).json({ detail: "Phone is required" });
    }

    const amountPaise = Math.round(Number(amount) * 100);

    // Unique merchant transaction id
    const merchantTransactionId =
      "HW" + Date.now() + Math.floor(Math.random() * 1000);

    // Merchant user id (can be phone or any user id)
    const merchantUserId = phone;

    // Build redirect URLs based on current host
    const protocol =
      req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const redirectUrl = `${baseUrl}/payment-result.html?merchantTransactionId=${merchantTransactionId}`;
    const callbackUrl = `${baseUrl}/api/phonepe/callback`;

    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId,
      merchantUserId,
      amount: amountPaise,
      redirectUrl,
      redirectMode: "REDIRECT",
      callbackUrl,
      mobileNumber: phone,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const payloadString = JSON.stringify(payload);
    const payloadBase64 = Buffer.from(payloadString).toString("base64");

    // Checksum: sha256(payloadBase64 + "/pg/v1/pay" + saltKey) + "###" + saltIndex
    const dataToSign = payloadBase64 + "/pg/v1/pay" + PHONEPE_SALT_KEY;
    const sha256 = crypto
      .createHash("sha256")
      .update(dataToSign)
      .digest("hex");
    const checksum = `${sha256}###${PHONEPE_SALT_INDEX}`;

    const url = `${PHONEPE_BASE_URL}/pg/v1/pay`;

    const phonepeResp = await axios.post(
      url,
      { request: payloadBase64 },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
          "X-MERCHANT-ID": PHONEPE_MERCHANT_ID,
          accept: "application/json",
        },
      }
    );

    const respData = phonepeResp.data;

    if (!respData.success) {
      return res.status(400).json({
        detail: respData.message || "PhonePe payment init failed",
        raw: respData,
      });
    }

    const redirectInfo =
      respData.data &&
      respData.data.instrumentResponse &&
      respData.data.instrumentResponse.redirectInfo;

    if (!redirectInfo || !redirectInfo.url) {
      return res
        .status(500)
        .json({ detail: "No redirect URL from PhonePe", raw: respData });
    }

    return res.status(200).json({
      redirectUrl: redirectInfo.url,
      merchantTransactionId,
    });
  } catch (err) {
    console.error("PhonePe pay error:", err.response?.data || err.message);
    return res
      .status(500)
      .json({ detail: "PhonePe pay error", error: err.message });
  }
};
