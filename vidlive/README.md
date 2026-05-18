# VID-LIVE — Indian Overseas Bank
## Deepfake-Resilient Banking Authentication System

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (Vite) — port 5173 |
| Backend | Python FastAPI — port 8000 |
| Database | PostgreSQL (`vidlive_db`) |
| Auth | JWT tokens + bcrypt |
| Face Detection | MediaPipe FaceMesh (CDN, browser-side) |
| Deepfake Detection | HuggingFace `dima806/deepfake_vs_real_image_detection` |
| OTP | Printed to terminal (simulated SMS) |

---

## How to Run

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL running locally with a database named `vidlive_db`

---

### Step 1 — Create & activate virtual environment

```bash
# From project root (IOB-ORVIX)
python -m venv venv

# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate
```

---

### Step 2 — Install backend dependencies

```bash
cd vidlive/backend
pip install -r requirements.txt
```

> **Note:** First `pip install` will download PyTorch (~2 GB). Allow time for this.
> The HuggingFace deepfake model (~400 MB) downloads automatically on first backend start.

---

### Step 3 — Configure database password

Open `vidlive/backend/.env` and replace `PASSWORD` with your PostgreSQL password:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/vidlive_db
```

Make sure `vidlive_db` database exists:

```sql
CREATE DATABASE vidlive_db;
```

---

### Step 4 — Run database seed

```bash
# From vidlive/backend/
python seed.py
```

This creates all tables and inserts 3 test customers + 6 historical transactions.

---

### Step 5 — Start the backend

```bash
# From vidlive/backend/
uvicorn main:app --reload
```

Backend starts at: http://localhost:8000  
API docs at: http://localhost:8000/docs

---

### Step 6 — Start the frontend (new terminal)

```bash
cd vidlive/frontend
npm install
npm run dev
```

Frontend starts at: http://localhost:5173

---

### Step 7 — Open the app

Visit: **http://localhost:5173**

---

## Test Credentials

| Customer ID | Password | Name | Balance |
|------------|----------|------|---------|
| IOB2024001 | Arjun@123 | Arjun Mehta | ₹2,50,000 |
| IOB2024002 | Rajesh@123 | Rajesh Venkataraman | ₹25,00,000 |
| IOB2024003 | Priya@123 | Priya Sundaram | ₹85,000 |

**Receiver account for testing transfers:** `0057100000030003` (Priya Sundaram)

---

## User Flow

```
/ (Landing)
  → /login (Customer ID + Password)
    → /otp  (OTP printed in backend terminal)
      → /dashboard
          ├── /transfer  (amount < ₹50,000 → instant)
          │   └── (amount ≥ ₹50,000) → /vidlive → /result
          └── /enroll  (VID-LIVE face enrollment)
```

---

## Demo Scenario

1. Login as **IOB2024001** (Arjun Mehta)
2. OTP appears in the **backend terminal** — enter it
3. Dashboard shows account balance and recent transactions
4. Click **Fund Transfer** → enter Priya's account `0057100000030003`
5. Enter amount **≥ ₹50,000** → gold warning banner appears
6. Click Proceed → VID-LIVE verification page opens
7. Allow camera → click **Start VID-LIVE Verification**
8. Watch the 6-step pipeline run in real time
9. View result page with trust score and breakdown

---

## OTP Note

During demo, OTP is printed to the **backend terminal**:

```
========================================
OTP for IOB2024001: 482931
========================================
```

---

## Architecture

```
vidlive/
  backend/
    main.py          ← FastAPI app, CORS, router registration
    database.py      ← SQLAlchemy engine, session factory
    models.py        ← Customer, Transaction, VidLiveSession ORM models
    schemas.py       ← Pydantic request/response schemas
    auth.py          ← JWT creation/verification, bcrypt, get_current_customer
    seed.py          ← Database seeder (run once)
    requirements.txt
    .env             ← DATABASE_URL, SECRET_KEY
    routes/
      auth.py        ← /auth/login, /auth/verify-otp, /auth/me
      transactions.py← /transactions/transfer, /transactions/history
      vidlive.py     ← /vidlive/start, /vidlive/analyze-frame,
                       /vidlive/submit-scores, /vidlive/enroll-face

  frontend/
    index.html       ← CSS variables, MediaPipe CDN scripts, Google Fonts
    vite.config.js
    package.json
    src/
      main.jsx       ← React entry point
      App.jsx        ← BrowserRouter, AuthContext, TxnContext, routes
      api.js         ← Axios instance, JWT interceptor, all API functions
      pages/
        Landing.jsx  ← IOB-styled landing page
        Login.jsx    ← Customer ID + Password login
        OTP.jsx      ← 6-box OTP input with auto-advance
        Dashboard.jsx← Account summary, transactions, quick actions
        Transfer.jsx ← Fund transfer form with VID-LIVE trigger
        VidLive.jsx  ← 6-step liveness verification (Phase 2 full logic)
        Result.jsx   ← Trust score circle, breakdown, forensic details
        Enroll.jsx   ← Face enrollment flow
      components/
        Header.jsx        ← IOB header with gold accent line
        Sidebar.jsx       ← Customer avatar, nav, enrollment badge
        TransactionCard.jsx← Table row for a single transaction
        StepCard.jsx       ← VID-LIVE step card with score bar
        TrustMeter.jsx     ← Animated canvas trust score circle
```

---

## VID-LIVE Trust Score Formula

| Step | Check | Max Points |
|------|-------|-----------|
| 3 | 3D Geometry (parallax > 0.7 = 15pts) | 15 |
| 4 | AI Deepfake Detection (avg Real confidence × 35) | 35 |
| 5 | Reaction Timing (200-400ms = 25pts) | 25 |
| 6 | Micro-expression naturalness | 25 |
| **Total** | | **100** |

**Pass threshold: 70 / 100**

---

© Indian Overseas Bank — VID-LIVE System v1.0
