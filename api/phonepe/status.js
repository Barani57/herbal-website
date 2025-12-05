// api/phonepe/status.js
const crypto = require("crypto");
const axios = require("axios");

if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch (e) {}
}

const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY;
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";
const PHONEPE_BASE_URL =
  process.env.PHONEPE_BASE_URL ||
  "https://api-preprod.phonepe.com/apis/pg-sandbox";

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  try {
    const { merchantTransactionId } = req.query || {};
    if (!merchantTransactionId) {
      return res
        .status(400)
        .json({ detail: "merchantTransactionId is required" });
    }

    const path = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`;
    const dataToSign = path + PHONEPE_SALT_KEY;

    const sha256 = crypto
      .createHash("sha256")
      .update(dataToSign)
      .digest("hex");
    const checksum = `${sha256}###${PHONEPE_SALT_INDEX}`;

    const url = `${PHONEPE_BASE_URL}${path}`;

    const phonepeResp = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": PHONEPE_MERCHANT_ID,
        accept: "application/json",
      },
    });

    return res.status(200).json(phonepeResp.data);
  } catch (err) {
    console.error("PhonePe status error:", err.response?.data || err.message);
    return res
      .status(500)
      .json({ detail: "Status check error", error: err.message });
  }
};
