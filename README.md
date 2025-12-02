# Herbal Website

Herbal Wellness Store — frontend + FastAPI backend with Razorpay payment integration

---

## Repository contents

```
Herbal Website/
├── css/
├── js/
├── venv/
├── main.py            # FastAPI backend
├── .env               # (local, **DO NOT** commit)
├── .env.example       # example env file (this repo)
├── index.html (or your static files)
└── README.md
```

> **Important:** Do **not** commit your `.env` file. Use `.env.example` as a template and add `.env` to `.gitignore`.

---

# Quick start (Windows)

> These instructions assume you already have Python 3.10+ installed and used a virtual environment.

1. Open PowerShell / Git Bash and go to the project folder:

```powershell
cd "C:\Users\koush\Downloads\Herbal Website"
```

2. Create & activate virtual environment (if not present):

```powershell
python -m venv venv
.\venv\Scripts\activate
```

3. Install dependencies:

```powershell
python -m pip install --upgrade pip setuptools wheel
python -m pip install fastapi "uvicorn[standard]" python-dotenv razorpay
```

4. Create a `.env` file by copying `.env.example` and filling in your keys:

```powershell
copy .env.example .env
# then open .env and paste your keys
```

5. Run the backend (FastAPI):

```powershell
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

6. Serve the frontend (in another terminal):

```powershell
python -m http.server 5500
```

Open your site: `http://127.0.0.1:5500/` and the API docs: `http://127.0.0.1:8000/docs`.

---

# .env variables (.env.example)

Create a `.env` file in the project root with the following keys. **Keep these secret.**

```env
# Razorpay (Test keys)
RAZORPAY_KEY_ID=rzp_test_RmlztfTWLzKM84
RAZORPAY_KEY_SECRET=nmrRc5fRmPPeYXdWNrUSIvx0
FRONTEND_ORIGIN=http://127.0.0.1:5500


# Optional: other settings
# PAYMENTS_FILE=payments.json
```

> **Note:** Use the **Test Mode** keys from Razorpay Dashboard (switch to "Test Mode") while developing.

---

# How the payment flow works

1. Frontend calls `POST /payments/order` on the FastAPI backend with the order amount (in rupees) and customer info.
2. Backend (server) creates a Razorpay **order** using test API keys and returns `{ key, orderId, amount, currency }` to the frontend.
3. Frontend opens Razorpay Checkout (client) using the returned `key` and `orderId`.
4. User completes payment in Razorpay Checkout.
5. Razorpay returns `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` to the frontend handler.
6. Frontend posts these values to `POST /payments/verify` on the backend.
7. Backend computes HMAC SHA256 over `order_id|payment_id` using `RAZORPAY_KEY_SECRET` and verifies the signature. If valid, the payment is confirmed.

---

# Security notes

* **Never** store `RAZORPAY_KEY_SECRET` on the frontend or in public repos.
* Keep `.env` out of source control (add to `.gitignore`).
* Use Webhooks for production-level reliability and asynchronous verification.

---

# Example `main.py` (already included in repo)

Your `main.py` should expose these endpoints:

* `POST /payments/order` → create razorpay order
* `POST /payments/verify` → verify signature

(See the project file `main.py` for the currently implemented logic.)

---

# Git / GitHub

1. Create repo on GitHub (do not initialize with README).
2. Add `.gitignore` with the following lines (recommended):

```
venv/
.env
__pycache__/
*.pyc
.DS_Store
```

3. Commit & push:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/herbal-website.git
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

# Testing payments (Razorpay test card)

Use these test credentials in the Razorpay Checkout popup:

* Card: `4111 1111 1111 1111`
* Expiry: any future date (e.g. `12/30`)
* CVV: `123`
* OTP (if asked): `123456`

---

# Optional additions I can generate for you

* `README.md` (this file) — already created here.
* `.gitignore` file (I can add it for you).
* `payments.json` persistence in `main.py`.
* Webhook handler for Razorpay (ngrok usage for local testing).

Tell me which extras you want and I will add them as ready-to-drop-in files.
