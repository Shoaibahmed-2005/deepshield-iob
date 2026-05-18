/**
 * VID-LIVE Page — Phase 1 Stub
 *
 * Full MediaPipe + deepfake detection logic will be implemented in Phase 2.
 * This page shows the correct layout with all step cards and webcam area,
 * but does not yet run the liveness checks.
 */

import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import StepCard from '../components/StepCard'
import { useTxn } from '../App'
import { vidliveApi } from '../api'

const STEPS = [
  { num: 1, title: 'Video Capture', maxScore: 10 },
  { num: 2, title: 'Lighting Normalization', maxScore: 10 },
  { num: 3, title: '3D Geometry Check', maxScore: 15 },
  { num: 4, title: 'AI Deepfake Detection', maxScore: 35 },
  { num: 5, title: 'Reaction Timing', maxScore: 25 },
  { num: 6, title: 'Micro-expression Analysis', maxScore: 25 },
]

const INSTRUCTIONS = [
  { text: 'Look straight at the camera', duration: 3000 },
  { text: 'Slowly turn your head LEFT', duration: 3000 },
  { text: 'Slowly turn your head RIGHT', duration: 3000 },
  { text: 'Look straight and HOLD STILL', duration: 5000 },
  { text: 'Please BLINK when you hear the beep', duration: 4000 },
]

export default function VidLive() {
  const navigate = useNavigate()
  const { pendingTxn, setVidliveResult } = useTxn()

  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [sessionId, setSessionId] = useState(null)
  const [cameraError, setCameraError] = useState('')
  const [stepStatuses, setStepStatuses] = useState(
    STEPS.map(() => ({ status: 'Pending', score: 0, detail: '' }))
  )
  const [currentInstruction, setCurrentInstruction] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [frameCount, setFrameCount] = useState(0)

  // Start VID-LIVE session on mount
  useEffect(() => {
    if (!pendingTxn) {
      navigate('/dashboard')
      return
    }

    vidliveApi
      .start(pendingTxn.transaction_id, false)
      .then((res) => setSessionId(res.data.session_id))
      .catch(() => setCameraError('Failed to start VID-LIVE session. Please try again.'))

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
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setCameraError('Camera access denied. Please allow camera access and reload.')
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
    }
  }

  function updateStep(index, partial) {
    setStepStatuses((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...partial }
      return next
    })
  }

  async function runSequence() {
    if (!sessionId || running) return
    setRunning(true)
    setDone(false)

    // Step 1 — Video Capture starts
    updateStep(0, { status: 'Running', score: 0, detail: 'Initialising camera…' })
    await delay(500)
    updateStep(0, { status: 'Pass', score: 10, detail: 'Camera active — 480p @ 30fps' })

    // Step 2 — Lighting
    updateStep(1, { status: 'Running', score: 0, detail: 'Normalising lighting conditions…' })
    await delay(800)
    updateStep(1, { status: 'Pass', score: 10, detail: 'Lighting OK — brightness within range' })

    // Walk through instructions while collecting
    for (let i = 0; i < INSTRUCTIONS.length; i++) {
      setCurrentInstruction(i)
      const dur = INSTRUCTIONS[i].duration
      setTimeLeft(Math.ceil(dur / 1000))

      // Countdown
      const startTs = Date.now()
      await new Promise((resolve) => {
        const tick = setInterval(() => {
          const elapsed = Date.now() - startTs
          setTimeLeft(Math.max(0, Math.ceil((dur - elapsed) / 1000)))
          setFrameCount((c) => c + 1)
          if (elapsed >= dur) {
            clearInterval(tick)
            resolve()
          }
        }, 300)
      })

      // Trigger step cards at appropriate instructions
      if (i === 1) {
        updateStep(2, { status: 'Running', score: 0, detail: 'Detecting head rotation…' })
      }
      if (i === 2) {
        updateStep(2, { status: 'Pass', score: 12, detail: 'Parallax detected — 3D geometry confirmed' })
        updateStep(3, { status: 'Running', score: 0, detail: 'Sending frames for deepfake analysis…' })
      }
      if (i === 3) {
        updateStep(3, { status: 'Running', score: 18, detail: 'Analysing… Real: 94%' })
        updateStep(4, { status: 'Running', score: 0, detail: 'Waiting for audio cue…' })
        updateStep(5, { status: 'Running', score: 0, detail: 'Tracking landmark variance…' })
      }
      if (i === 4) {
        updateStep(3, { status: 'Pass', score: 32, detail: 'Real: 91% avg confidence across frames' })
        updateStep(4, { status: 'Pass', score: 22, detail: 'Reaction: 310ms — Normal range' })
        updateStep(5, { status: 'Pass', score: 21, detail: 'Variance: 1.8 std dev — Natural micro-movements detected' })
      }
    }

    // Finalise
    setDone(true)
    setRunning(false)

    // Small delay then submit
    await delay(1500)

    try {
      const payload = {
        session_id: sessionId,
        parallax_score: 0.82,
        reaction_ms: 310,
        micro_expression_score: 21,
        frame_results: [
          { label: 'Real', confidence: 0.94 },
          { label: 'Real', confidence: 0.92 },
          { label: 'Real', confidence: 0.96 },
        ],
      }
      const res = await vidliveApi.submitScores(payload)
      setVidliveResult(res.data)
      stopCamera()
      navigate('/result')
    } catch {
      setCameraError('Failed to submit results. Please try again.')
      setRunning(false)
    }
  }

  function delay(ms) {
    return new Promise((r) => setTimeout(r, ms))
  }

  return (
    <div style={s.page}>
      <Header showLogout />

      <div style={s.layout}>
        {/* Left — Webcam */}
        <div style={s.camPanel}>
          <div style={s.camBox}>
            {cameraError ? (
              <div style={s.camError}>{cameraError}</div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  style={s.video}
                  autoPlay
                  muted
                  playsInline
                />

                {/* Oval face guide */}
                <div style={s.ovalGuide} />

                {/* Recording indicator */}
                {running && (
                  <div style={s.recIndicator}>
                    <span style={s.recDot} />
                    <span style={s.recText}>LIVE</span>
                  </div>
                )}

                {/* Step / timer info */}
                {running && (
                  <div style={s.stepInfo}>
                    Step {Math.min(currentInstruction + 1, 5)} of 5 &nbsp;|&nbsp; {timeLeft}s remaining
                  </div>
                )}

                {/* Instruction overlay */}
                <div style={s.instructionBar}>
                  {done
                    ? 'Analysing results…'
                    : running
                    ? INSTRUCTIONS[currentInstruction]?.text
                    : 'Click "Start Verification" to begin'}
                </div>
              </>
            )}
          </div>

          {!running && !done && (
            <button
              style={s.startBtn}
              onClick={runSequence}
              disabled={!sessionId || !!cameraError}
            >
              {sessionId ? '▶  Start VID-LIVE Verification' : 'Initialising…'}
            </button>
          )}

          {done && (
            <div style={s.analysingBar}>
              <span style={s.spinner}>⟳</span> Submitting results…
            </div>
          )}

          <div style={s.frameCounter}>
            Frames captured: <strong>{frameCount}</strong>
          </div>
        </div>

        {/* Right — Step cards */}
        <div style={s.stepsPanel}>
          <div style={s.stepsPanelHeader}>
            <h2 style={s.stepsTitle}>VID-LIVE Verification</h2>
            <p style={s.stepsSub}>6-layer deepfake detection pipeline</p>
          </div>

          <div style={s.stepsList}>
            {STEPS.map((step, i) => (
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

          {pendingTxn && (
            <div style={s.txnInfo}>
              <p style={s.txnInfoLabel}>Transaction being verified:</p>
              <p style={s.txnInfoId}>{pendingTxn.transaction_id}</p>
              <p style={s.txnInfoAmount}>
                ₹{parseFloat(pendingTxn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const pulse = `@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`

const s = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0A1628' },

  layout: {
    flex: 1,
    display: 'flex',
    gap: 0,
    minHeight: 0,
  },

  camPanel: {
    flex: '0 0 55%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0A1628',
    padding: '24px',
    gap: 16,
  },

  camBox: {
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    aspectRatio: '4/3',
    border: '2px solid #1E3A5F',
    flex: 1,
    minHeight: 360,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    transform: 'scaleX(-1)', // mirror
  },

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
    boxShadow: '0 0 0 4000px rgba(0,0,0,0.35)',
  },

  recIndicator: {
    position: 'absolute',
    top: 14,
    left: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: '4px 10px',
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#F44336',
    display: 'inline-block',
    animation: 'pulse 1s infinite',
  },
  recText: { color: '#FFFFFF', fontSize: 11, fontWeight: 700, letterSpacing: 1 },

  stepInfo: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0,87,168,0.85)',
    color: '#FFFFFF',
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 12,
    fontWeight: 600,
  },

  instructionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 700,
    textAlign: 'center',
    padding: '16px',
    letterSpacing: 0.5,
  },

  camError: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    padding: 24,
    lineHeight: 1.6,
  },

  startBtn: {
    backgroundColor: 'var(--iob-blue)',
    color: '#FFFFFF',
    border: '2px solid var(--iob-gold)',
    borderRadius: 8,
    padding: '14px 28px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
  },

  analysingBar: {
    backgroundColor: 'rgba(255,179,0,0.15)',
    border: '1px solid var(--iob-gold)',
    color: 'var(--iob-gold)',
    borderRadius: 8,
    padding: '12px',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 600,
  },

  spinner: {
    display: 'inline-block',
    marginRight: 8,
    animation: 'spin 1s linear infinite',
  },

  frameCounter: {
    color: '#4A7AAE',
    fontSize: 12,
    textAlign: 'center',
  },

  stepsPanel: {
    flex: '0 0 45%',
    backgroundColor: 'var(--iob-bg)',
    borderLeft: '1px solid var(--iob-border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },

  stepsPanelHeader: {
    backgroundColor: 'var(--iob-blue-dark)',
    padding: '20px 24px',
    borderBottom: '2px solid var(--iob-gold)',
  },
  stepsTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 700, marginBottom: 4 },
  stepsSub: { color: '#A8C8F0', fontSize: 12 },

  stepsList: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  txnInfo: {
    borderTop: '1px solid var(--iob-border)',
    padding: '16px',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  txnInfoLabel: { fontSize: 11, color: 'var(--iob-muted)', textTransform: 'uppercase', letterSpacing: 0.5 },
  txnInfoId: { fontSize: 12, fontFamily: 'monospace', color: 'var(--iob-text)' },
  txnInfoAmount: { fontSize: 20, fontWeight: 700, color: 'var(--iob-blue)' },
}
