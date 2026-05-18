# VID-LIVE — Indian Overseas Bank
## Deepfake-Resilient Banking Authentication System

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (Vite) — port 5173 |
| Backend | Python FastAPI — port 8000 |
| Database | PostgreSQL (`vidlive_db`) |
| Auth | JWT (24h) + bcrypt 4.0.1 |
| Face Detection | MediaPipe FaceMesh (CDN, browser) |
| Deepfake Detection | HuggingFace `prithivMLmods/Deepfake-Detection-Exp-02-22-ONNX` (ONNX, CPU-only) |
| OTP | Printed to backend terminal (simulated SMS) |

---

## Quick Start

### Prerequisites

- Python 3.10+ (tested on 3.14)
- Node.js 18+
- PostgreSQL running locally with a database named `vidlive_db`

---

### Step 1 — Create and activate virtual environment

```bash
# From project root (IOB-ORVIX/)
python -m venv venv

# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate
```

---

### Step 2 — Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

> **Note:** The ONNX deepfake model (~80 MB) downloads automatically on first backend start.
> No GPU, CUDA, or PyTorch required — runs on CPU via `onnxruntime`.

---

### Step 3 — Configure database password

Open `backend/.env` and set your PostgreSQL password:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/vidlive_db
SECRET_KEY=iob-vidlive-secret-key-2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=24
```

Create the database if it doesn't exist:

```sql
CREATE DATABASE vidlive_db;
```

---

### Step 4 — Seed the database

```bash
# From backend/
python seed.py
```

Safe to run multiple times — skips already-seeded data.

---

### Step 5 — Start the backend

```bash
# From backend/
uvicorn main:app --reload
```

Backend: http://localhost:8000  
API docs: http://localhost:8000/docs

The OTP for each login will print to **this terminal**:

```
========================================
OTP for IOB2024001: 482931
========================================
```

---

### Step 6 — Start the frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

---

## Test Credentials

| Customer ID | Password | Name | Balance |
|------------|----------|------|---------|
| IOB2024001 | Arjun@123 | Arjun Mehta | Rs. 2,50,000 |
| IOB2024002 | Rajesh@123 | Rajesh Venkataraman | Rs. 25,00,000 |
| IOB2024003 | Priya@123 | Priya Sundaram | Rs. 85,000 |

**Receiver account for testing:** `0057100000030003` (Priya Sundaram)

---

## Demo Flow

```
http://localhost:5173

/ (Landing)
  → /login        Enter Customer ID + Password
    → /otp         Enter OTP from backend terminal
      → /dashboard  View balance, recent transactions
          ├── /transfer    Amount < Rs.50,000  → instant transfer
          │              Amount >= Rs.50,000  → /vidlive → /result
          └── /enroll      One-time face enrollment (VID-LIVE)
```

---

## API Routes

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Login with Customer ID + Password, triggers OTP |
| POST | `/auth/verify-otp` | No | Verify OTP, returns JWT |
| GET | `/auth/me` | JWT | Get current customer profile |

### Transactions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/transactions/transfer` | JWT | Transfer funds. >= Rs.50,000 requires VID-LIVE |
| GET | `/transactions/history` | JWT | Last 10 transactions |

### VID-LIVE
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/vidlive/start` | JWT | Start a VID-LIVE session |
| POST | `/vidlive/analyze-frame` | JWT | Analyze a base64 frame for deepfake |
| POST | `/vidlive/submit-scores` | JWT | Submit all step scores, compute trust |
| POST | `/vidlive/enroll-face` | JWT | Store face baseline for enrollment |

---

## Trust Score Formula

| Step | Check | Max |
|------|-------|-----|
| 3 | 3D Geometry — parallax > 0.7 = 15pts, > 0.4 = 10pts | 15 |
| 4 | AI Deepfake — avg Real confidence × 35 | 35 |
| 5 | Reaction Timing — 200-400ms = 25pts, 400-600ms = 15pts | 25 |
| 6 | Micro-expression naturalness (from frontend) | 25 |
| **Total** | | **100** |

**Pass threshold: 70 / 100**

---

## Project Structure

```
IOB-ORVIX/
  backend/
    main.py              FastAPI app entry — CORS, router registration, ONNX model load
    database.py          SQLAlchemy engine + session factory
    models.py            Customer, Transaction, VidLiveSession ORM models
    schemas.py           Pydantic request/response schemas
    auth.py              JWT + bcrypt utilities, get_current_customer dependency
    seed.py              Idempotent DB seeder (safe to run multiple times)
    requirements.txt
    .env                 DATABASE_URL, SECRET_KEY (not committed to Git)
    routes/
      auth.py            /auth/* routes + in-memory OTP store
      transactions.py    /transactions/* routes
      vidlive.py         /vidlive/* routes + score computation

  frontend/
    index.html           CSS variables, MediaPipe CDN, Google Fonts
    vite.config.js
    package.json
    src/
      main.jsx           React entry point
      App.jsx            Router, AuthContext, TxnContext
      api.js             Axios + JWT interceptor (token in memory, not localStorage)
      pages/
        Landing.jsx      IOB-styled landing page
        Login.jsx        Customer ID + Password form
        OTP.jsx          6-box OTP input with auto-advance
        Dashboard.jsx    Account summary, transactions, quick actions
        Transfer.jsx     Fund transfer form with VID-LIVE trigger
        VidLive.jsx      6-step liveness verification (webcam + MediaPipe + ONNX)
        Result.jsx       Trust score circle, breakdown, audit trail
        Enroll.jsx       Face enrollment flow (webcam + biometric baseline)
      components/
        Header.jsx       IOB header with gold accent line
        Sidebar.jsx      Customer avatar, nav, enrollment badge
        TransactionCard.jsx  Transaction table row
        StepCard.jsx     VID-LIVE step card with animated score bar
        TrustMeter.jsx   Animated canvas trust score circle
```

---

## Phase Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | Complete | Project structure, all pages/routes scaffolded |
| Phase 2 | Complete | Full auth flow, transactions, DB integration, all APIs verified |
| Phase 3 | Complete | VID-LIVE webcam logic — MediaPipe FaceMesh + ONNX deepfake model |

---

## Known Notes

- **OTP** is printed to the backend terminal (simulates SMS delivery)
- **bcrypt** must be pinned to `4.0.1` — passlib 1.7.4 is incompatible with bcrypt >= 4.1
- **Python 3.14** users: `datetime.utcnow()` is replaced with `datetime.now(timezone.utc)` throughout
- **Windows console**: Rs. symbol used in messages instead of ₹ to avoid encoding issues
- **ONNX model**: Downloads automatically from HuggingFace Hub on first backend start; no GPU required

---

© Indian Overseas Bank — VID-LIVE System v2.0
