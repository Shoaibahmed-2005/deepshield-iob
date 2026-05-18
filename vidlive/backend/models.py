from sqlalchemy import Column, Integer, String, Float, Boolean, JSON, DateTime, Numeric, Text
from sqlalchemy.sql import func
from database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String(20), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    phone_number = Column(String(15), nullable=False)
    password_hash = Column(String(255), nullable=False)
    account_number = Column(String(16), unique=True, nullable=False)
    balance = Column(Numeric(15, 2), nullable=False, default=0.00)
    is_face_enrolled = Column(Boolean, default=False, nullable=False)
    face_landmarks = Column(JSON, nullable=True)
    micro_expression_baseline = Column(JSON, nullable=True)
    reaction_time_baseline = Column(Float, nullable=True)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(30), unique=True, index=True, nullable=False)
    sender_account = Column(String(16), nullable=False)
    receiver_account = Column(String(16), nullable=False)
    receiver_name = Column(String(100), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    remarks = Column(Text, nullable=True)
    status = Column(String(10), nullable=False, default="pending")  # pending/approved/blocked
    vidlive_required = Column(Boolean, default=False, nullable=False)
    vidlive_passed = Column(Boolean, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class VidLiveSession(Base):
    __tablename__ = "vidlive_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(36), unique=True, index=True, nullable=False)
    customer_id = Column(String(20), nullable=False)
    transaction_id = Column(String(30), nullable=True)
    is_enrollment = Column(Boolean, default=False, nullable=False)
    step3_parallax_score = Column(Float, nullable=True)
    step4_deepfake_score = Column(Float, nullable=True)
    step5_reaction_ms = Column(Float, nullable=True)
    step6_micro_expression_score = Column(Float, nullable=True)
    final_trust_score = Column(Float, nullable=True)
    result = Column(String(10), nullable=True)  # pass/fail
    breakdown = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
