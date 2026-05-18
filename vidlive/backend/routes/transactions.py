import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import get_current_customer

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _make_txn_id() -> str:
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    suffix = str(uuid.uuid4().int)[:4]
    return f"TXN{ts}{suffix}"


@router.post("/transfer", response_model=schemas.TransferResponse)
def transfer(
    payload: schemas.TransferRequest,
    db: Session = Depends(get_db),
    current_customer: models.Customer = Depends(get_current_customer),
):
    if payload.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transfer amount must be greater than zero.",
        )

    if float(current_customer.balance) < payload.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient balance for this transaction.",
        )

    # Find receiver
    receiver = db.query(models.Customer).filter(
        models.Customer.account_number == payload.receiver_account
    ).first()

    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beneficiary account not found. Please verify account number.",
        )

    if receiver.account_number == current_customer.account_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot transfer to your own account.",
        )

    txn_id = _make_txn_id()

    if payload.amount >= 50000:
        # Create a pending transaction — VID-LIVE verification required
        session_id = str(uuid.uuid4())
        txn = models.Transaction(
            transaction_id=txn_id,
            sender_account=current_customer.account_number,
            receiver_account=receiver.account_number,
            receiver_name=receiver.full_name,
            amount=payload.amount,
            remarks=payload.remarks,
            status="pending",
            vidlive_required=True,
            vidlive_passed=None,
        )
        db.add(txn)
        db.commit()
        db.refresh(txn)

        return schemas.TransferResponse(
            vidlive_required=True,
            transaction_id=txn_id,
            session_id=session_id,
            message="High value transaction — VID-LIVE verification required.",
        )

    else:
        # Direct transfer — deduct immediately
        current_customer.balance = float(current_customer.balance) - payload.amount
        receiver.balance = float(receiver.balance) + payload.amount

        txn = models.Transaction(
            transaction_id=txn_id,
            sender_account=current_customer.account_number,
            receiver_account=receiver.account_number,
            receiver_name=receiver.full_name,
            amount=payload.amount,
            remarks=payload.remarks,
            status="approved",
            vidlive_required=False,
            vidlive_passed=None,
        )
        db.add(txn)
        db.commit()

        return schemas.TransferResponse(
            vidlive_required=False,
            success=True,
            transaction_id=txn_id,
            message=f"₹{payload.amount:,.2f} transferred successfully to {receiver.full_name}.",
        )


@router.get("/history", response_model=schemas.TransactionHistoryResponse)
def transaction_history(
    db: Session = Depends(get_db),
    current_customer: models.Customer = Depends(get_current_customer),
):
    account = current_customer.account_number
    txns = (
        db.query(models.Transaction)
        .filter(
            (models.Transaction.sender_account == account)
            | (models.Transaction.receiver_account == account)
        )
        .order_by(models.Transaction.created_at.desc())
        .limit(10)
        .all()
    )
    return schemas.TransactionHistoryResponse(transactions=txns)
