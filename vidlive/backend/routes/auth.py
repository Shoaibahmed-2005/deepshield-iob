import random
import string
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import verify_password, create_access_token, get_current_customer

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory OTP store: { customer_id: { otp, expires_at } }
_otp_store: dict = {}


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def _mask_phone(phone: str) -> str:
    """Return XXXXXX3210 style masked phone."""
    if len(phone) >= 4:
        return "X" * (len(phone) - 4) + phone[-4:]
    return phone


@router.post("/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(
        models.Customer.customer_id == payload.customer_id
    ).first()

    if not customer or not verify_password(payload.password, customer.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Customer ID or Password",
        )

    otp = _generate_otp()
    _otp_store[payload.customer_id] = {
        "otp": otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=5),
    }

    # Simulate SMS by printing to terminal
    print(f"\n{'='*40}")
    print(f"OTP for {payload.customer_id}: {otp}")
    print(f"{'='*40}\n")

    return schemas.LoginResponse(
        otp_sent=True,
        phone_hint=_mask_phone(customer.phone_number),
    )


@router.post("/verify-otp", response_model=schemas.TokenResponse)
def verify_otp(payload: schemas.OTPVerifyRequest, db: Session = Depends(get_db)):
    entry = _otp_store.get(payload.customer_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP found for this Customer ID. Please login again.",
        )

    if datetime.utcnow() > entry["expires_at"]:
        del _otp_store[payload.customer_id]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please login again.",
        )

    if entry["otp"] != payload.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect OTP. Please try again.",
        )

    # OTP valid — clean up and issue JWT
    del _otp_store[payload.customer_id]

    customer = db.query(models.Customer).filter(
        models.Customer.customer_id == payload.customer_id
    ).first()

    token_data = {
        "customer_id": customer.customer_id,
        "account_number": customer.account_number,
        "full_name": customer.full_name,
    }
    access_token = create_access_token(token_data)

    return schemas.TokenResponse(access_token=access_token)


@router.get("/me", response_model=schemas.CustomerProfile)
def get_me(current_customer: models.Customer = Depends(get_current_customer)):
    return current_customer
