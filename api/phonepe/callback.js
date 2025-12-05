// api/phonepe/callback.js
// Simple callback endpoint – logs and shows a basic HTML page.
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    console.log("PhonePe callback body:", req.body);
    // In real app, verify checksum here and update DB.

    // Just acknowledge
    return res
      .status(200)
      .send("Callback received");
  } catch (err) {
    console.error("Callback error:", err.message);
    return res.status(500).send("Callback error");
  }
};
