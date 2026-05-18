/**
 * Enrollment Page — Phase 1 Stub
 * Full webcam enrollment logic will be added in Phase 2.
 * This page shows the correct layout and runs a simulated enrollment flow.
 */

import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import StepCard from '../components/StepCard'
import { useAuth } from '../App'
import { vidliveApi } from '../api'

const ENROLL_STEPS = [
  { num: 1, title: 'Face Detection', maxScore: 20 },
  { num: 2, title: 'Landmark Capture', maxScore: 20 },
  { num: 3, title: '3D Face Mapping', maxScore: 20 },
  { num: 4, title: 'Micro-expression Baseline', maxScore: 20 },
  { num: 5, title: 'Reaction Baseline', maxScore: 20 },
]

export default function Enroll() {
  const navigate = useNavigate()
  const { customer, refreshCustomer } = useAuth()

  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [stepStatuses, setStepStatuses] = useState(
    ENROLL_STEPS.map(() => ({ status: 'Pending', score: 0, detail: '' }))
  )
  const [phase, setPhase] = useState('idle') // idle | running | done | error
  const [cameraError, setCameraError] = useState('')
  const [sessionId, setSessionId] = useState(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setCameraError('Camera access denied. Please allow camera access and reload the page.')
    }
  }

  function stopCamera() {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
  }

  function updateStep(index, partial) {
    setStepStatuses((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...partial }
      return next
    })
  }

  function delay(ms) {
    return new Promise((r) => setTimeout(r, ms))
  }

  async function runEnrollment() {
    if (phase !== 'idle') return
    setPhase('running')

    // Start session
    try {
      const res = await vidliveApi.start(null, true)
      setSessionId(res.data.session_id)
    } catch {
      setPhase('error')
      setCameraError('Failed to start enrollment session.')
      return
    }

    // Step 1 — Face detection
    updateStep(0, { status: 'Running', detail: 'Scanning for face…' })
    await delay(1200)
    updateStep(0, { status: 'Pass', score: 20, detail: 'Face detected — good lighting confirmed' })

    // Step 2 — Landmarks
    updateStep(1, { status: 'Running', detail: 'Capturing 468 facial landmarks…' })
    await delay(1500)
    updateStep(1, { status: 'Pass', score: 20, detail: '468 landmarks captured at 30fps' })

    // Step 3 — 3D mapping
    updateStep(2, { status: 'Running', detail: 'Building 3D face map — turn head slowly…' })
    await delay(2000)
    updateStep(2, { status: 'Pass', score: 20, detail: '3D depth map stored — parallax baseline set' })

    // Step 4 — Micro-expression baseline
    updateStep(3, { status: 'Running', detail: 'Recording micro-expression baseline…' })
    await delay(2000)
    updateStep(3, { status: 'Pass', score: 20, detail: 'Baseline: variance 1.6 std dev — stored' })

    // Step 5 — Reaction baseline
    updateStep(4, { status: 'Running', detail: 'Measuring natural reaction timing…' })
    await delay(1500)
    updateStep(4, { status: 'Pass', score: 20, detail: 'Baseline reaction: 340ms average' })

    // Submit enrollment
    try {
      await vidliveApi.enrollFace(
        { landmarks: 'baseline_enrolled' },
        { variance: 1.6 },
        340
      )
      await refreshCustomer()
      setPhase('done')
      stopCamera()
    } catch {
      setPhase('error')
      setCameraError('Enrollment failed. Please try again.')
    }
  }

  return (
    <div style={s.page}>
      <Header showLogout />

      <div style={s.body}>
        <Sidebar />

        <main style={s.main}>
          <div style={s.breadcrumb}>
            <button style={s.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>
            <span style={s.sep}>/</span>
            <span style={s.breadCurrent}>VID-LIVE Enrollment</span>
          </div>

          {phase === 'done' ? (
            <SuccessScreen onBack={() => navigate('/dashboard')} />
          ) : (
            <div style={s.layout}>
              {/* Left — Webcam */}
              <div style={s.camSection}>
                <div style={s.camBox}>
                  {cameraError ? (
                    <div style={s.camError}>{cameraError}</div>
                  ) : (
                    <>
                      <video ref={videoRef} style={s.video} autoPlay muted playsInline />
                      <div style={s.ovalGuide} />
                      <div style={s.instructionBar}>
                        {phase === 'running'
                          ? 'Hold face inside oval — follow on-screen instructions'
                          : 'Position your face inside the oval to begin'}
                      </div>
                    </>
                  )}
                </div>

                {phase === 'idle' && (
                  <button
                    style={s.startBtn}
                    onClick={runEnrollment}
                    disabled={!!cameraError}
                  >
                    ▶  Start Face Enrollment
                  </button>
                )}

                {phase === 'running' && (
                  <div style={s.runningNote}>Enrollment in progress — please stay still</div>
                )}
              </div>

              {/* Right — Info + steps */}
              <div style={s.infoSection}>
                <div style={s.infoCard}>
                  <h2 style={s.infoTitle}>Enable VID-LIVE Protection</h2>
                  <p style={s.infoDesc}>
                    VID-LIVE enrollment captures your facial biometric baseline — including
                    3D geometry, micro-expression patterns, and reaction timing. This data is
                    used to verify your identity during high-value transactions.
                  </p>
                  <ul style={s.infoList}>
                    <li>✓ Protects transactions ≥ ₹50,000</li>
                    <li>✓ Detects deepfakes and video replay attacks</li>
                    <li>✓ Measures natural facial micro-movements</li>
                    <li>✓ One-time enrollment — 60 seconds</li>
                  </ul>
                </div>

                <div style={s.stepsList}>
                  <h3 style={s.stepsTitle}>Enrollment Steps</h3>
                  {ENROLL_STEPS.map((step, i) => (
                    <StepCard
                      key={step.num}
                      stepNumber={step.num}
                      title={step.title}
                      status={stepStatuses[i].status}
                      score={stepStatuses[i].score}
                      maxScore={step.maxScore}
                      detail={stepStatuses[i].detail}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function SuccessScreen({ onBack }) {
  return (
    <div style={ss.wrap}>
      <div style={ss.icon}>🎉</div>
      <h2 style={ss.title}>VID-LIVE Protection is Now Active</h2>
      <p style={ss.desc}>
        Your facial biometric baseline has been enrolled successfully. All transactions above
        ₹50,000 will now be protected by VID-LIVE deepfake detection.
      </p>
      <div style={ss.feature}>
        <span style={ss.featureIcon}>🔒</span>
        <span>Your account is now secured with AI-powered face verification</span>
      </div>
      <button style={ss.btn} onClick={onBack}>
        Return to Dashboard
      </button>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--iob-bg)' },
  body: { display: 'flex', flex: 1 },
  main: { flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 },
  backBtn: { background: 'none', border: 'none', color: 'var(--iob-blue)', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  sep: { color: 'var(--iob-muted)' },
  breadCurrent: { color: 'var(--iob-muted)' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flex: 1 },
  camSection: { display: 'flex', flexDirection: 'column', gap: 12 },
  camBox: {
    position: 'relative',
    backgroundColor: '#0A1628',
    borderRadius: 10,
    overflow: 'hidden',
    aspectRatio: '4/3',
    border: '2px solid var(--iob-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scaleX(-1)' },
  ovalGuide: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '42%',
    paddingBottom: '56%',
    border: '3px solid var(--iob-gold)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  instructionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    textAlign: 'center',
    padding: '12px',
  },
  camError: { color: '#FF6B6B', fontSize: 14, textAlign: 'center', padding: 24, lineHeight: 1.6 },
  startBtn: {
    backgroundColor: 'var(--iob-blue)',
    color: '#FFFFFF',
    border: '2px solid var(--iob-gold)',
    borderRadius: 8,
    padding: '12px 24px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
  },
  runningNote: {
    backgroundColor: '#E6F1FB',
    border: '1px solid var(--iob-blue)',
    color: 'var(--iob-blue)',
    borderRadius: 6,
    padding: '10px',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 600,
  },
  infoSection: { display: 'flex', flexDirection: 'column', gap: 16 },
  infoCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--iob-border)',
    borderRadius: 10,
    padding: '20px 24px',
  },
  infoTitle: { fontSize: 18, fontWeight: 700, color: 'var(--iob-text)', marginBottom: 10 },
  infoDesc: { fontSize: 14, color: 'var(--iob-muted)', lineHeight: 1.7, marginBottom: 14 },
  infoList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: 'var(--iob-text)' },
  stepsList: { display: 'flex', flexDirection: 'column', gap: 8 },
  stepsTitle: { fontSize: 14, fontWeight: 700, color: 'var(--iob-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
}

const ss = {
  wrap: {
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--iob-border)',
    borderRadius: 12,
    padding: '48px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    textAlign: 'center',
    maxWidth: 540,
    alignSelf: 'center',
    width: '100%',
    margin: '40px auto',
  },
  icon: { fontSize: 56 },
  title: { fontSize: 22, fontWeight: 700, color: 'var(--iob-text)' },
  desc: { fontSize: 15, color: 'var(--iob-muted)', lineHeight: 1.7 },
  feature: {
    backgroundColor: 'var(--iob-blue-light)',
    border: '1px solid var(--iob-border)',
    borderRadius: 8,
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    color: 'var(--iob-text)',
    width: '100%',
  },
  featureIcon: { fontSize: 20 },
  btn: {
    backgroundColor: 'var(--iob-blue)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    padding: '12px 32px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 8,
  },
}
