"""
Idempotent database seeder.
Safe to run multiple times — skips data that already exists.
Usage:  python seed.py
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from database import engine, SessionLocal
import models
from auth import hash_password

models.Base.metadata.create_all(bind=engine)

ARJUN_ACC  = "0057100000010001"
RAJESH_ACC = "0057100000020002"
PRIYA_ACC  = "0057100000030003"

CUSTOMERS = [
    {
        "customer_id":   "IOB2024001",
        "full_name":     "Arjun Mehta",
        "phone_number":  "9876543210",
        "password":      "Arjun@123",
        "account_number": ARJUN_ACC,
        "balance":       250000.00,
    },
    {
        "customer_id":   "IOB2024002",
        "full_name":     "Rajesh Venkataraman",
        "phone_number":  "9876500001",
        "password":      "Rajesh@123",
        "account_number": RAJESH_ACC,
        "balance":       2500000.00,
    },
    {
        "customer_id":   "IOB2024003",
        "full_name":     "Priya Sundaram",
        "phone_number":  "9876500002",
        "password":      "Priya@123",
        "account_number": PRIYA_ACC,
        "balance":       85000.00,
    },
]


def _now_utc():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def seed_customers(db: Session):
    inserted = 0
    for data in CUSTOMERS:
        exists = db.query(models.Customer).filter_by(
            customer_id=data["customer_id"]
        ).first()
        if exists:
            continue
        db.add(models.Customer(
            customer_id=data["customer_id"],
            full_name=data["full_name"],
            phone_number=data["phone_number"],
            password_hash=hash_password(data["password"]),
            account_number=data["account_number"],
            balance=data["balance"],
            is_face_enrolled=False,
        ))
        inserted += 1
    if inserted:
        db.commit()
        print(f"[OK] {inserted} customer(s) inserted.")
    else:
        print("[--] Customers already present - skipping.")


def seed_transactions(db: Session):
    existing = db.query(models.Transaction).count()
    if existing >= 6:
        print(f"[--] Transactions already present ({existing}) - skipping.")
        return

    now = _now_utc()
    txns = [
        models.Transaction(
            transaction_id="TXN20240001",
            sender_account="EMPLOYER001",
            receiver_account=ARJUN_ACC,
            receiver_name="Arjun Mehta",
            amount=45000.00,
            remarks="Salary credit",
            status="approved",
            vidlive_required=False,
            vidlive_passed=None,
            created_at=now - timedelta(days=3),
        ),
        models.Transaction(
            transaction_id="TXN20240002",
            sender_account=ARJUN_ACC,
            receiver_account="TNEB000000000001",
            receiver_name="TNEB",
            amount=1850.00,
            remarks="Electricity bill payment",
            status="approved",
            vidlive_required=False,
            vidlive_passed=None,
            created_at=now - timedelta(days=5),
        ),
        models.Transaction(
            transaction_id="TXN20240003",
            sender_account=ARJUN_ACC,
            receiver_account=PRIYA_ACC,
            receiver_name="Priya Sundaram",
            amount=8000.00,
            remarks="Fund transfer",
            status="approved",
            vidlive_required=False,
            vidlive_passed=None,
            created_at=now - timedelta(days=7),
        ),
        models.Transaction(
            transaction_id="TXN20240004",
            sender_account=PRIYA_ACC,
            receiver_account=ARJUN_ACC,
            receiver_name="Arjun Mehta",
            amount=12000.00,
            remarks="Payment received",
            status="approved",
            vidlive_required=False,
            vidlive_passed=None,
            created_at=now - timedelta(days=10),
        ),
        models.Transaction(
            transaction_id="TXN20240005",
            sender_account=ARJUN_ACC,
            receiver_account="AMAZON00000000001",
            receiver_name="Amazon",
            amount=3200.00,
            remarks="Online purchase",
            status="approved",
            vidlive_required=False,
            vidlive_passed=None,
            created_at=now - timedelta(days=12),
        ),
        models.Transaction(
            transaction_id="TXN20240006",
            sender_account=ARJUN_ACC,
            receiver_account="SAVINGS000000001",
            receiver_name="Arjun Savings",
            amount=5500.00,
            remarks="Transfer to savings",
            status="approved",
            vidlive_required=False,
            vidlive_passed=None,
            created_at=now - timedelta(days=15),
        ),
    ]
    db.add_all(txns)
    db.commit()
    print(f"[OK] {len(txns)} transactions inserted.")


def seed(db: Session):
    seed_customers(db)
    seed_transactions(db)
    print()
    print("Seed complete. Test credentials:")
    print("  Customer ID: IOB2024001  |  Password: Arjun@123")
    print("  Customer ID: IOB2024002  |  Password: Rajesh@123")
    print("  Customer ID: IOB2024003  |  Password: Priya@123")
    print()
    print("  Receiver account for testing: 0057100000030003 (Priya Sundaram)")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
