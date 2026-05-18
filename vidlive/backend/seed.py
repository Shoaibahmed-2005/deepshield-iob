"""
Run once to populate the database with initial customers and transactions.
Usage:  python seed.py
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from database import engine, SessionLocal
import models
from auth import hash_password

models.Base.metadata.create_all(bind=engine)


def make_txn_id(offset_seconds: int = 0) -> str:
    ts = datetime.utcnow() - timedelta(seconds=offset_seconds)
    return "TXN" + ts.strftime("%Y%m%d%H%M%S") + str(abs(offset_seconds))[-4:]


def seed(db: Session):
    # ── Customers ────────────────────────────────────────────────────────────
    existing = db.query(models.Customer).filter(
        models.Customer.customer_id == "IOB2024001"
    ).first()
    if existing:
        print("Seed data already present - skipping.")
        return

    customers = [
        models.Customer(
            customer_id="IOB2024001",
            full_name="Arjun Mehta",
            phone_number="9876543210",
            password_hash=hash_password("Arjun@123"),
            account_number="0057100000010001",
            balance=250000.00,
            is_face_enrolled=False,
        ),
        models.Customer(
            customer_id="IOB2024002",
            full_name="Rajesh Venkataraman",
            phone_number="9876500001",
            password_hash=hash_password("Rajesh@123"),
            account_number="0057100000020002",
            balance=2500000.00,
            is_face_enrolled=False,
        ),
        models.Customer(
            customer_id="IOB2024003",
            full_name="Priya Sundaram",
            phone_number="9876500002",
            password_hash=hash_password("Priya@123"),
            account_number="0057100000030003",
            balance=85000.00,
            is_face_enrolled=False,
        ),
    ]
    db.add_all(customers)
    db.commit()
    print("[OK] Customers inserted.")

    # ── Transactions (6 historical for Arjun) ────────────────────────────────
    arjun_acc = "0057100000010001"
    priya_acc = "0057100000030003"

    now = datetime.utcnow()

    transactions = [
        models.Transaction(
            transaction_id="TXN20240001",
            sender_account="EMPLOYER001",
            receiver_account=arjun_acc,
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
            sender_account=arjun_acc,
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
            sender_account=arjun_acc,
            receiver_account=priya_acc,
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
            sender_account=priya_acc,
            receiver_account=arjun_acc,
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
            sender_account=arjun_acc,
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
            sender_account=arjun_acc,
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
    db.add_all(transactions)
    db.commit()
    print("[OK] Transactions inserted.")
    print("\nSeed complete. Test credentials:")
    print("  Customer ID: IOB2024001  |  Password: Arjun@123")
    print("  Customer ID: IOB2024002  |  Password: Rajesh@123")
    print("  Customer ID: IOB2024003  |  Password: Priya@123")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
