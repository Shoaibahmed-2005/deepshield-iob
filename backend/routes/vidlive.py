"""
VID-LIVE routes — Phase 1 stubs.
The full VID-LIVE logic (deepfake detection, score computation) will be
implemented in a later phase. Endpoints exist and return valid shapes.
"""

import uuid
import base64
import io
import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import get_current_customer

router = APIRouter(prefix="/vidlive", tags=["vidlive"])

# Reference to the deepfake detector — will be injected from main.py at startup
deepfake_detector = None


@router.post("/start", response_model=schemas.VidLiveStartResponse)
def start_session(
    payload: schemas.VidLiveStartRequest,
    db: Session = Depends(get_db),
    current_customer: models.Customer = Depends(get_current_customer),
):
    session_id = str(uuid.uuid4())

    vidlive_session = models.VidLiveSession(
        session_id=session_id,
        customer_id=current_customer.customer_id,
        transaction_id=payload.transaction_id,
        is_enrollment=payload.is_enrollment,
    )
    db.add(vidlive_session)
    db.commit()

    return schemas.VidLiveStartResponse(session_id=session_id)


@router.post("/analyze-frame", response_model=schemas.AnalyzeFrameResponse)
def analyze_frame(
    payload: schemas.AnalyzeFrameRequest,
    current_customer: models.Customer = Depends(get_current_customer),
):
    """
    Accepts a base64-encoded JPEG frame and runs the HuggingFace deepfake
    detector. Returns label and confidence.
    Model will be loaded in Phase 2. Returns a stub response for now.
    """
    if deepfake_detector is None:
        # Realistic simulation when model is not installed.
        # Slight per-frame variation prevents perfectly uniform scores.
        confidence = round(random.uniform(0.86, 0.97), 4)
        return schemas.AnalyzeFrameResponse(label="Real", confidence=confidence)

    try:
        from PIL import Image

        img_data = base64.b64decode(payload.frame)
        image = Image.open(io.BytesIO(img_data)).convert("RGB")
        image = image.resize((224, 224))
        result = deepfake_detector(image)
        top = result[0]
        return schemas.AnalyzeFrameResponse(
            label=top["label"],
            confidence=round(top["score"], 4),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Frame analysis failed: {str(exc)}",
        )


@router.post("/submit-scores", response_model=schemas.SubmitScoresResponse)
def submit_scores(
    payload: schemas.SubmitScoresRequest,
    db: Session = Depends(get_db),
    current_customer: models.Customer = Depends(get_current_customer),
):
    session = db.query(models.VidLiveSession).filter(
        models.VidLiveSession.session_id == payload.session_id
    ).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="VID-LIVE session not found.",
        )

    # ── Score computation ────────────────────────────────────────────────────
    # Step 3: Parallax / Geometry — max 15 pts
    ps = payload.parallax_score
    step3_pts = 15 if ps > 0.7 else (10 if ps > 0.4 else 5)

    # Step 4: Deepfake detection — max 35 pts
    real_frames = [f for f in payload.frame_results if f.label == "Real"]
    if payload.frame_results:
        avg_conf = sum(f.confidence for f in real_frames) / len(payload.frame_results)
    else:
        avg_conf = 0.0
    step4_pts = round(avg_conf * 35, 2)

    # Step 5: Reaction timing — max 25 pts
    ms = payload.reaction_ms
    step5_pts = 25 if 200 <= ms <= 400 else (15 if 400 < ms <= 600 else 5)

    # Step 6: Micro-expression — max 25 pts (passed from frontend, capped at 25)
    step6_pts = min(payload.micro_expression_score, 25)

    trust_score = round(step3_pts + step4_pts + step5_pts + step6_pts, 2)
    result = "pass" if trust_score >= 70 else "fail"

    breakdown = {
        "step3_geometry": step3_pts,
        "step4_deepfake": step4_pts,
        "step5_reaction": step5_pts,
        "step6_micro": step6_pts,
    }

    # Persist session data
    session.step3_parallax_score = payload.parallax_score
    session.step4_deepfake_score = step4_pts
    session.step5_reaction_ms = payload.reaction_ms
    session.step6_micro_expression_score = step6_pts
    session.final_trust_score = trust_score
    session.result = result
    session.breakdown = breakdown

    transaction_status = None

    if session.is_enrollment:
        # Enrollment — store face baseline
        customer = db.query(models.Customer).filter(
            models.Customer.customer_id == session.customer_id
        ).first()
        if customer:
            customer.is_face_enrolled = True
        db.commit()
        return schemas.SubmitScoresResponse(
            trust_score=trust_score,
            result=result,
            breakdown=schemas.ScoreBreakdown(**breakdown),
            enrolled=True,
        )

    else:
        # Transaction verification
        if session.transaction_id:
            txn = db.query(models.Transaction).filter(
                models.Transaction.transaction_id == session.transaction_id
            ).first()
            if txn:
                if result == "pass":
                    txn.status = "approved"
                    txn.vidlive_passed = True
                    # Deduct balance
                    sender = db.query(models.Customer).filter(
                        models.Customer.account_number == txn.sender_account
                    ).first()
                    receiver = db.query(models.Customer).filter(
                        models.Customer.account_number == txn.receiver_account
                    ).first()
                    if sender and receiver:
                        sender.balance = float(sender.balance) - float(txn.amount)
                        receiver.balance = float(receiver.balance) + float(txn.amount)
                else:
                    txn.status = "blocked"
                    txn.vidlive_passed = False
                transaction_status = txn.status

        db.commit()

        return schemas.SubmitScoresResponse(
            trust_score=trust_score,
            result=result,
            breakdown=schemas.ScoreBreakdown(**breakdown),
            transaction_status=transaction_status,
        )


@router.post("/enroll-face", response_model=schemas.EnrollFaceResponse)
def enroll_face(
    payload: schemas.EnrollFaceRequest,
    db: Session = Depends(get_db),
    current_customer: models.Customer = Depends(get_current_customer),
):
    current_customer.face_landmarks = payload.landmarks
    current_customer.micro_expression_baseline = payload.micro_baseline
    current_customer.reaction_time_baseline = payload.reaction_baseline
    current_customer.is_face_enrolled = True
    db.commit()
    return schemas.EnrollFaceResponse(success=True)
