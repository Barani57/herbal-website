import os
import hmac
import hashlib

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import razorpay
from razorpay.errors import BadRequestError, ServerError

# Load .env
load_dotenv()

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
    raise RuntimeError("Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env")

# Razorpay client
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

app = FastAPI()

# CORS - allow all during local dev for simplicity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # you can restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------- Models ---------

class CreateOrderRequest(BaseModel):
    amount: float
    currency: str | None = "INR"
    receipt: str | None = None
    customerName: str | None = None
    customerEmail: str | None = None
    customerPhone: str | None = None


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# --------- Simple root (so / doesn't 404) ---------

@app.get("/")
def root():
    return {"status": "ok", "message": "Herbal API running"}


# --------- Create order ---------
@app.post("/payments/order")
def create_order(req: CreateOrderRequest):
    # Basic validation before calling Razorpay
    if req.amount is None:
        raise HTTPException(status_code=400, detail="Amount is required")

    try:
        amount_paise = int(round(float(req.amount) * 100))
    except ValueError:
        raise HTTPException(status_code=400, detail="Amount must be a number")

    if amount_paise < 100:  # Razorpay usually requires >= 1 INR
        raise HTTPException(status_code=400, detail="Amount must be at least ₹1")

    order_data = {
        "amount": amount_paise,
        "currency": req.currency or "INR",
        "receipt": req.receipt or f"herbal_rcpt_{os.urandom(4).hex()}",
        "notes": {
            "customer_name": req.customerName or "",
            "customer_email": req.customerEmail or "",
            "customer_phone": req.customerPhone or "",
        },
    }

    try:
        order = razorpay_client.order.create(data=order_data)
        return {
            "key": RAZORPAY_KEY_ID,
            "orderId": order["id"],
            "amount": order["amount"],   # in paise
            "currency": order["currency"],
        }
    except BadRequestError as e:
        # Typically invalid keys / params / account config
        print("Razorpay BadRequestError:", e)
        raise HTTPException(status_code=400, detail=str(e))
    except ServerError as e:
        print("Razorpay ServerError:", e)
        raise HTTPException(status_code=502, detail="Razorpay server error")
    except Exception as e:
        print("Unexpected error creating Razorpay order:", e)
        raise HTTPException(status_code=500, detail="Failed to create order")
    
    
# --------- Verify payment ---------

@app.post("/payments/verify")
def verify_payment(req: VerifyPaymentRequest):
    try:
        body = f"{req.razorpay_order_id}|{req.razorpay_payment_id}"

        expected_signature = hmac.new(
            bytes(RAZORPAY_KEY_SECRET, "utf-8"),
            bytes(body, "utf-8"),
            hashlib.sha256,
        ).hexdigest()

        if expected_signature != req.razorpay_signature:
            raise HTTPException(status_code=400, detail="Invalid payment signature")

        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        print("Error verifying Razorpay payment:", e)
        raise HTTPException(status_code=500, detail="Verification error")
