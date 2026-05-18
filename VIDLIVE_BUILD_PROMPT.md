# VID-LIVE — Complete Build Prompt
# Paste this entire prompt into Claude Code / Cursor / Windsurf

Build this incrementally and ensure every phase runs correctly before proceeding to the next phase. Never leave broken imports or incomplete files.
---

Build me a complete full-stack web application called **VID-LIVE** for **Indian Overseas Bank (IOB)**.
This is a deepfake-resilient banking authentication system.
Do not simplify anything. Build everything production grade.

---

## TECH STACK

- Frontend: React (Vite) — port 5173
- Backend: Python FastAPI — port 8000
- Database: PostgreSQL (already installed, database name: vidlive_db)
- Auth: JWT tokens + bcrypt password hashing
- Face Detection: MediaPipe FaceMesh via CDN in browser
- Deepfake Detection: HuggingFace transformers (local, offline after first run)
- OTP: Print to terminal (simulate SMS)

---

## PROJECT STRUCTURE

```
vidlive/
  backend/
    main.py
    database.py
    models.py
    schemas.py
    auth.py
    seed.py
    requirements.txt
    .env
    routes/
      auth.py
      transactions.py
      vidlive.py
  frontend/
    index.html
    vite.config.js
    package.json
    src/
      main.jsx
      App.jsx
      api.js
      pages/
        Landing.jsx
        Login.jsx
        OTP.jsx
        Dashboard.jsx
        Transfer.jsx
        VidLive.jsx
        Result.jsx
        Enroll.jsx
      components/
        Header.jsx
        Sidebar.jsx
        TransactionCard.jsx
        StepCard.jsx
        TrustMeter.jsx
```

---

## COLOR THEME — IOB BRANDING (STRICT)

Use these exact values everywhere. No other colors.

```
--iob-blue-dark:   #003F7D   (header, footer, navbar)
--iob-blue:        #0057A8   (primary buttons, active states)
--iob-blue-mid:    #1976D2   (hover states)
--iob-blue-light:  #E6F1FB   (card backgrounds, section fills)
--iob-gold:        #FFB300   (accent, highlights, CTA borders)
--iob-white:       #FFFFFF
--iob-bg:          #F0F4F9   (page background)
--iob-text:        #1A2B4A   (primary text)
--iob-muted:       #5A7399   (secondary text)
--iob-success:     #1B6B3A   (pass, approved)
--iob-danger:      #B71C1C   (fail, blocked)
--iob-border:      #C5D8F0   (borders, dividers)

Font: 'Noto Sans', sans-serif — import from Google Fonts
```

Header must look exactly like IOB:
- Dark blue (#003F7D) background
- IOB logo text on left (white, bold, with Hindi subtitle "इंडियन ओवरसीज़ बैंक")
- "Good people to grow with" tagline below
- Gold accent line at bottom of header (2px)

---

## DATABASE MODELS

### customers
```
id, customer_id (IOB2024001), full_name, phone_number,
password_hash, account_number (16 digit), balance (numeric),
is_face_enrolled (bool default false),
face_landmarks (JSON — stored after enrollment),
micro_expression_baseline (JSON),
reaction_time_baseline (float),
registered_at
```

### transactions
```
id, transaction_id (TXN + timestamp),
sender_account, receiver_account, receiver_name,
amount, remarks, status (pending/approved/blocked),
vidlive_required (bool), vidlive_passed (bool),
created_at
```

### vidlive_sessions
```
id, session_id (UUID), customer_id, transaction_id,
is_enrollment (bool),
step3_parallax_score (float),
step4_deepfake_score (float),
step5_reaction_ms (float),
step6_micro_expression_score (float),
final_trust_score (float),
result (pass/fail),
breakdown (JSON),
created_at
```

---

## SEED DATA

Create seed.py that inserts exactly this data:

### Customers:

**Customer 1 — Legitimate User**
- customer_id: IOB2024001
- full_name: Arjun Mehta
- phone: 9876543210
- password: Arjun@123 (bcrypt hashed)
- account_number: 0057100000010001
- balance: 250000.00
- is_face_enrolled: False

**Customer 2 — Rich Man (Hacker Target)**
- customer_id: IOB2024002
- full_name: Rajesh Venkataraman
- phone: 9876500001
- password: Rajesh@123 (bcrypt hashed)
- account_number: 0057100000020002
- balance: 2500000.00
- is_face_enrolled: False

**Customer 3 — Receiver**
- customer_id: IOB2024003
- full_name: Priya Sundaram
- phone: 9876500002
- password: Priya@123 (bcrypt hashed)
- account_number: 0057100000030003
- balance: 85000.00
- is_face_enrolled: False

### Transactions (seed 6 past transactions for Arjun):
- Received ₹45,000 salary from employer — 3 days ago — approved
- Paid ₹1,850 electricity bill to TNEB — 5 days ago — approved
- Transferred ₹8,000 to Priya Sundaram — 7 days ago — approved
- Received ₹12,000 from Priya Sundaram — 10 days ago — approved
- Paid ₹3,200 to Amazon — 12 days ago — approved
- Transferred ₹5,500 to savings — 15 days ago — approved

---

## BACKEND ROUTES

### /auth/login (POST)
- Accept: customer_id, password
- Verify password with bcrypt
- Generate 6-digit OTP, store in memory dict with 5 min expiry
- Print OTP to terminal: "OTP for {customer_id}: {otp}"
- Return: { otp_sent: true, phone_hint: "XXXXXX3210" }

### /auth/verify-otp (POST)
- Accept: customer_id, otp
- Validate OTP and expiry
- Return JWT (24hr expiry) with customer_id, account_number, full_name

### /auth/me (GET) — protected
- Return full customer profile + balance

### /transactions/transfer (POST) — protected
- Accept: receiver_account, amount, remarks
- Validate receiver account exists
- If amount >= 50000:
  - Create pending transaction
  - Return { vidlive_required: true, transaction_id, session_id }
- If amount < 50000:
  - Deduct balance, mark approved
  - Return { vidlive_required: false, success: true }

### /transactions/history (GET) — protected
- Return last 10 transactions for logged-in customer

### /vidlive/start (POST) — protected
- Accept: transaction_id, is_enrollment (bool)
- Create vidlive_session
- Return session_id

### /vidlive/analyze-frame (POST) — protected
- Accept: session_id, frame (base64 JPEG)
- Convert base64 to PIL image
- Run through HuggingFace model locally:
  model = "dima806/deepfake_vs_real_image_detection"
  pipeline("image-classification", model=model)
- Return: { label: "Real"/"Fake", confidence: 0.97 }

### /vidlive/submit-scores (POST) — protected
- Accept: session_id, parallax_score, reaction_ms, micro_expression_score, frame_results (list)
- Compute trust score:
  - Step 3 (parallax): max 15 pts — score > 0.7 = 15, > 0.4 = 10, else 5
  - Step 4 (deepfake): max 35 pts — avg confidence of "Real" frames × 35
  - Step 5 (reaction): max 25 pts — 200-400ms = 25, 400-600ms = 15, else 5
  - Step 6 (micro): max 25 pts — score passed from frontend
- If is_enrollment:
  - Store face data in customer record
  - Mark is_face_enrolled = true
  - Return { enrolled: true, trust_score }
- If not enrollment:
  - If trust_score >= 70: approve transaction, deduct balance
  - If trust_score < 70: block transaction
  - Store full session in vidlive_sessions
  - Return { trust_score, result, breakdown, transaction_status }

### /vidlive/enroll-face (POST) — protected
- Accept: landmarks (JSON), micro_baseline (JSON), reaction_baseline (float)
- Store in customer record
- Mark is_face_enrolled = true
- Return { success: true }

---

## FRONTEND PAGES

### 1. Landing Page (/)
IOB-styled landing page. NOT a simple blank page.
- Header with IOB logo, dark blue background, gold accent line
- Hero section: "Secure Internet Banking" with IOB blue background
- Two cards side by side:
  - "Personal Internet Banking" with Login button
  - "Corporate Internet Banking" (disabled, greyed out)
- Below: 3 feature highlights with icons:
  - "256-bit Encryption"
  - "AI-Powered Security"  
  - "VID-LIVE Protected"
- Footer: dark blue, IOB copyright, toll free number 1800-890-4445

### 2. Login Page (/login)
- White card, centered, IOB header
- Title: "Personal Internet Banking Login"
- Fields: Customer ID, Password (show/hide toggle)
- "Login" button — IOB blue
- Below button: small text "Secured by VID-LIVE™ Technology"
- On success: redirect to /otp

### 3. OTP Page (/otp)
- White card, centered
- Title: "OTP Verification"
- Subtitle: "OTP sent to XXXXXX3210"
- 6 individual OTP input boxes (auto-advance on type)
- Resend OTP link (60 second countdown)
- Verify button
- On success: redirect to /dashboard

### 4. Dashboard (/dashboard)
This must look like a real bank dashboard. Not simple.

- Header: IOB header with customer name top right, logout button
- Left sidebar: 
  - Customer photo placeholder (initials circle, IOB blue)
  - Customer name, Customer ID
  - Nav links: Dashboard, Transfer, Statement, Profile, Security
  - VID-LIVE enrollment status badge (Enrolled/Not Enrolled)

- Main content area:
  - Account Summary Card (prominent, IOB blue gradient):
    - Account Number (masked: XXXX XXXX XXXX 0001)
    - Available Balance (large font): ₹2,50,000.00
    - Account Type: Savings Account
    - IFSC: IOBA0000001
  
  - Quick Actions row (4 buttons):
    - Fund Transfer (primary)
    - Mini Statement
    - Enable VID-LIVE Security
    - Download Statement (disabled)
  
  - Recent Transactions section:
    - Last 6 transactions in a clean table
    - Date, Description, Amount (green for credit, red for debit)
    - Each row has transaction ID

  - Security Status card (bottom right):
    - VID-LIVE Status: Active/Inactive
    - Last Login: timestamp
    - Registered Device: This Device

### 5. Transfer Page (/transfer)
- Back button to dashboard
- Title: "Fund Transfer — NEFT/IMPS"
- Form:
  - Beneficiary Account Number
  - Confirm Account Number
  - Beneficiary Name (auto-fill on account lookup)
  - Amount (₹)
  - Remarks
  - Transfer Mode: IMPS (selected by default)
- Amount warning: if >= ₹50,000 show gold banner:
  "⚠️ High value transaction — VID-LIVE verification will be required"
- Proceed button → if >= 50000 redirect to /vidlive, else show success

### 6. VID-LIVE Page (/vidlive)
This is the core feature. Build this carefully.

Layout: Two columns
- Left: Live webcam feed (large)
- Right: 6 step cards showing real-time scores

**Webcam area:**
- Dark background (#0A1628)
- Live video feed
- Oval face guide overlay (gold border)
- Current instruction text at bottom (large, white, bold)
- Recording indicator (red dot, pulsing)
- Timer countdown
- Step indicator: "Step 3 of 6"

**Instructions sequence (auto-advancing):**
1. "Look straight at the camera" — 3 seconds
2. "Slowly turn your head LEFT" — 3 seconds
3. "Slowly turn your head RIGHT" — 3 seconds
4. "Look straight and HOLD STILL" — 5 seconds (rPPG + micro)
5. "Please BLINK when you hear the beep" — beep plays, wait for blink

**Right panel — 6 Step Cards:**

Each card has:
- Step number badge (IOB blue)
- Step name
- Status badge: Pending / Running / Pass / Fail
- Score bar (animated fill)
- Brief result text

Step 1 — Video Capture
- Shows: frames captured count, fps, resolution
- Always passes — it's the collector

Step 2 — Lighting Normalization  
- Shows: before/after lighting score
- Always passes — it's the preprocessor

Step 3 — 3D Geometry Check
- Shows: Yaw angle, Pitch angle, Parallax Score
- Uses MediaPipe FaceMesh landmarks
- Compute yaw from nose tip vs face center
- Score > 0.7 = Pass

Step 4 — AI Deepfake Detection
- Sends frame to /vidlive/analyze-frame every 2 seconds
- Shows: per-frame confidence bars updating live
- Shows: "Real: 97%" or "Fake: 89%"
- Average across all frames = final score

Step 5 — Reaction Timing
- Web Audio API plays 800Hz beep at random time during "hold still"
- MediaPipe detects blink via Eye Aspect Ratio (EAR)
- EAR = (vertical distances) / (horizontal distance) of eye landmarks
- EAR < 0.2 = blink detected
- Measures ms between beep and blink
- Shows: reaction time in ms, "Normal" / "Abnormal" badge

Step 6 — Micro-expression Analysis
- During "hold still" phase
- Track 468 landmarks every frame
- Compute variance of landmark positions over time
- Real face: small natural variance (involuntary micro-movements)
- Deepfake: near-zero variance (unnaturally still) OR erratic variance
- Expected variance range: 0.8 - 3.5 pixels std dev
- Score based on how natural the variance pattern is
- Shows: variance graph (canvas line graph), naturalness score

**After all steps complete:**
- Show "Analyzing..." spinner (2 seconds)
- Call /vidlive/submit-scores
- Redirect to /result

### 7. Result Page (/result)
- Large trust score circle (animated fill, color coded):
  - >= 70: IOB blue/green — "VERIFIED"
  - < 70: red — "VERIFICATION FAILED"

- Score breakdown cards (4 cards in grid):
  - Step 3: Geometry — X/15
  - Step 4: Deepfake — X/35
  - Step 5: Timing — X/25
  - Step 6: Micro-expression — X/25

- Transaction status:
  - APPROVED: green banner "₹75,000 transferred successfully to Priya Sundaram"
  - BLOCKED: red banner "Transaction blocked. Possible deepfake attempt detected."

- Forensic details (collapsible):
  - Session ID
  - Timestamp
  - Per-step raw scores
  - "Report saved for audit"

- Button: "Return to Dashboard"

### 8. Enrollment Page (/enroll)
- Accessed from Dashboard → "Enable VID-LIVE Security"
- Explains what enrollment does
- Runs same webcam flow as VID-LIVE but stores baseline
- On completion: marks customer as enrolled
- Shows success screen: "VID-LIVE protection is now active on your account"

---

## MEDIAPIPE IMPLEMENTATION

Load via CDN in index.html:
```html
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
```

In VidLive.jsx:
- Initialize FaceMesh with maxNumFaces: 1, refineLandmarks: true
- Run on every video frame
- Extract landmarks array (468 points, each {x, y, z})
- For Step 3: use landmarks 1 (nose tip), 10 (forehead), 152 (chin), 234 (left), 454 (right)
- For Step 5: use landmarks 33, 160, 158, 133, 153, 144 (left eye) for EAR
- For Step 6: track all 468 landmarks, compute std dev per frame

---

## DEEPFAKE MODEL — LOCAL SETUP

In backend/main.py, load model on startup:
```python
from transformers import pipeline
import torch

print("Loading deepfake detection model...")
deepfake_detector = pipeline(
    "image-classification",
    model="dima806/deepfake_vs_real_image_detection",
    device=-1  # CPU
)
print("Model loaded successfully.")
```

In /vidlive/analyze-frame:
```python
from PIL import Image
import base64, io

def analyze_frame(base64_frame):
    img_data = base64.b64decode(base64_frame)
    image = Image.open(io.BytesIO(img_data)).convert("RGB")
    image = image.resize((224, 224))
    result = deepfake_detector(image)
    return result  # [{"label": "Real", "score": 0.97}]
```

---

## ENVIRONMENT FILE

Create backend/.env:
```
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/vidlive_db
SECRET_KEY=iob-vidlive-secret-key-2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=24
```

---

## REQUIREMENTS.TXT

```
fastapi==0.109.0
uvicorn==0.27.0
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
python-dotenv==1.0.0
transformers==4.37.0
torch==2.1.0
pillow==10.2.0
numpy==1.26.3
pydantic==2.5.3
```

---

## PACKAGE.JSON DEPENDENCIES

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.11"
  }
}
```

---

## CORS SETUP

In main.py allow:
```python
origins = ["http://localhost:5173"]
```

---

## API.JS (Frontend)

Create src/api.js:
- Base URL: http://localhost:8000
- Axios instance with JWT interceptor
- Store JWT in memory (React state / context) NOT localStorage
- Auto-attach Authorization: Bearer token to all requests

---

## IMPORTANT RULES FOR AGENT

1. Every page must have the IOB header
2. No page should look like a generic React template
3. All monetary values formatted as ₹X,XX,XXX.XX (Indian format)
4. All dates in DD/MM/YYYY format
5. Use Noto Sans font throughout
6. Mobile responsive is NOT required — desktop only is fine
7. Do not use any UI component library (no MUI, no Ant Design, no Chakra) — pure CSS
8. All CSS in each component's own <style> block or inline — no separate CSS files
9. Console.log the OTP clearly in terminal during demo
10. 3 attempts allowed for VID-LIVE — after 3 fails show "Please visit your nearest IOB branch"
11. On dashboard, if face not enrolled, show a prominent gold banner: "Secure your account — Enable VID-LIVE Face Verification"
12. All API errors must show as proper bank-style error messages, not raw JSON

---

## HOW TO RUN (generate this as README.md)

```bash
# 1. Create and activate venv
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# 2. Install backend dependencies
cd backend
pip install -r requirements.txt

# 3. Add your PostgreSQL password to .env file

# 4. Run seed data
python seed.py

# 5. Start backend (model downloads automatically on first run)
uvicorn main:app --reload

# 6. In new terminal — start frontend
cd ../frontend
npm install
npm run dev

# 7. Open http://localhost:5173

# Test Credentials:
# Customer ID: IOB2024001 | Password: Arjun@123
# Customer ID: IOB2024002 | Password: Rajesh@123
```

---

Build everything completely. Do not leave placeholders or TODOs.
Every page fully functional. Every API route complete.
The UI must look like a real bank — not a student project.
