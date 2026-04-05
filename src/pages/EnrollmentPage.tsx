import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVidLive } from '@/hooks/useVidLive'
import { useProfile } from '@/store/userProfile'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// ── IOB DeepShield Header ────────────────────────────────────────────────────
function IOBHeader() {
  return (
    <div>
      <div
        style={{ backgroundColor: '#003087' }}
        className="flex items-center justify-between px-6 py-3"
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="text-white font-bold text-2xl leading-none">IOB</div>
            <div className="text-white text-xs opacity-80">Indian Overseas Bank</div>
          </div>
          <div style={{ width: 1, height: 40, backgroundColor: '#FFD700', opacity: 0.8 }} />
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
                fill="#C8102E"
                stroke="#C8102E"
                strokeWidth="1"
              />
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ color: '#C8102E', fontWeight: 700, fontSize: 18 }}>DeepShield</span>
          </div>
        </div>
        <div style={{ color: '#FFD700', fontStyle: 'italic', fontSize: 13, fontWeight: 400 }}>
          Good People to Grow With
        </div>
      </div>
      <div style={{ height: 3, backgroundColor: '#C8102E' }} />
    </div>
  )
}

// ── Steps data ───────────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Baseline Capture', instruction: 'Look straight at the camera — stay still' },
  { label: 'Turn Left', instruction: 'Slowly turn your head to the LEFT' },
  { label: 'Turn Right', instruction: 'Slowly turn your head to the RIGHT' },
  { label: 'Blink Detection', instruction: 'Blink twice slowly' },
  { label: 'Complete Profile', instruction: 'Almost done — hold still' },
]

const STEP_DURATION = 4000 // 4 seconds per step

export default function EnrollmentPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useProfile()
  const vidlive = useVidLive(profile)

  const [phase, setPhase] = useState<'welcome' | 'capture' | 'success'>('welcome')
  const [stepIndex, setStepIndex] = useState(0)
  const [countdown, setCountdown] = useState(100)
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false, false])

  // Local enrollment data refs
  const baselineLandmarks = useRef<number[]>([])
  const baselineYaw = useRef<number>(1.0)
  const reactionSamples = useRef<number[]>([])

  // Countdown timer per step
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Start camera and enrollment sequence when capture phase begins
  useEffect(() => {
    if (phase !== 'capture') return
    vidlive.startDetection()
    runEnrollmentSequence()
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [phase])

  function startCountdown(durationMs: number) {
    if (countdownRef.current) clearInterval(countdownRef.current)
    const start = Date.now()
    setCountdown(100)
    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.max(0, 100 - (elapsed / durationMs) * 100)
      setCountdown(Math.round(pct))
    }, 50)
  }

  function runEnrollmentSequence() {
    reactionSamples.current = []

    // Step 1: Baseline (0–4s)
    setStepIndex(0)
    startCountdown(STEP_DURATION)

    setTimeout(() => {
      // t=2s: record baseline
      if (vidlive.videoRef.current) {
        baselineLandmarks.current = [] // will be captured via yaw
      }
      baselineYaw.current = vidlive.yawRatio
    }, 2000)

    // Step 2: Turn Left (4–8s)
    setTimeout(() => {
      setStepIndex(1)
      setCompletedSteps((prev) => { const n = [...prev]; n[0] = true; return n })
      startCountdown(STEP_DURATION)
      vidlive.recordReactionTime()
    }, STEP_DURATION)

    setTimeout(() => {
      if (vidlive.reactionTimeMs !== null) reactionSamples.current.push(vidlive.reactionTimeMs)
    }, STEP_DURATION * 2)

    // Step 3: Turn Right (8–12s)
    setTimeout(() => {
      setStepIndex(2)
      setCompletedSteps((prev) => { const n = [...prev]; n[1] = true; return n })
      startCountdown(STEP_DURATION)
      vidlive.recordReactionTime()
    }, STEP_DURATION * 2)

    setTimeout(() => {
      if (vidlive.reactionTimeMs !== null) reactionSamples.current.push(vidlive.reactionTimeMs)
    }, STEP_DURATION * 3)

    // Step 4: Blink (12–16s)
    setTimeout(() => {
      setStepIndex(3)
      setCompletedSteps((prev) => { const n = [...prev]; n[2] = true; return n })
      startCountdown(STEP_DURATION)
      vidlive.recordReactionTime()
    }, STEP_DURATION * 3)

    setTimeout(() => {
      if (vidlive.reactionTimeMs !== null) reactionSamples.current.push(vidlive.reactionTimeMs)
    }, STEP_DURATION * 4)

    // Step 5: Hold still (16–19s)
    setTimeout(() => {
      setStepIndex(4)
      setCompletedSteps((prev) => { const n = [...prev]; n[3] = true; return n })
      startCountdown(3000)
    }, STEP_DURATION * 4)

    // t=19s: finalize profile
    setTimeout(() => {
      setCompletedSteps([true, true, true, true, true])
      if (countdownRef.current) clearInterval(countdownRef.current)
      setCountdown(0)

      const samples = reactionSamples.current.filter((s) => s > 0)
      const meanMs =
        samples.length > 0
          ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
          : 300

      setProfile({
        userId: 'IOB_' + Date.now(),
        enrolled: true,
        reactionMeanMs: meanMs,
        reactionSamples: samples,
        landmarkBaseline: baselineLandmarks.current,
        parallaxYawMean: baselineYaw.current,
        enrolledAt: Date.now(),
      })
      vidlive.stopDetection()
      setPhase('success')
    }, STEP_DURATION * 4 + 3000)
  }

  // ── RENDER: WELCOME ──────────────────────────────────────────────────────
  if (phase === 'welcome') {
    return (
      <div style={{ backgroundColor: '#F4F6F9', minHeight: '100vh' }}>
        <IOBHeader />
        <div className="flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-lg shadow-xl border-0">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center gap-6">
                {/* Shield Icon */}
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{ width: 80, height: 80, backgroundColor: '#FEE2E2' }}
                >
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
                      fill="#C8102E"
                      stroke="#C8102E"
                      strokeWidth="1"
                    />
                    <path
                      d="M9 12l2 2 4-4"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div>
                  <h1
                    className="text-2xl font-bold mb-2"
                    style={{ color: '#003087', fontFamily: 'Poppins, sans-serif' }}
                  >
                    DeepShield Biometric Enrollment
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Secure your IOB account with AI-powered liveness detection
                  </p>
                </div>

                <div className="w-full border-t border-gray-200" />

                <div className="w-full text-left">
                  <p className="font-semibold text-gray-800 mb-3">What happens during enrollment:</p>
                  <ul className="space-y-2">
                    {[
                      '20-second guided video session',
                      'Facial movement patterns analyzed',
                      'Mathematical profile created (no video stored)',
                      'Profile used to detect deepfakes on future logins',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <span style={{ color: '#16A34A', fontWeight: 700 }}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-2 w-full rounded-lg p-3" style={{ backgroundColor: '#F0FDF4' }}>
                  <span>🔒</span>
                  <p className="text-xs text-gray-500">
                    Your biometric data never leaves this device
                  </p>
                </div>

                <Button
                  className="w-full text-white font-semibold h-12 text-base"
                  style={{ backgroundColor: '#C8102E', border: 'none' }}
                  onClick={() => setPhase('capture')}
                >
                  Begin Enrollment →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ── RENDER: SUCCESS ──────────────────────────────────────────────────────
  if (phase === 'success') {
    return (
      <div style={{ backgroundColor: '#F4F6F9', minHeight: '100vh' }}>
        <IOBHeader />
        <div className="flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md shadow-xl border-0">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center gap-5">
                {/* Animated checkmark */}
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="4"
                    strokeDasharray="226"
                    strokeDashoffset="0"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                  <path
                    d="M24 40 L35 52 L56 30"
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="50"
                    strokeDashoffset="0"
                    style={{
                      animation: 'checkDraw 0.8s ease forwards 0.3s',
                    }}
                  />
                </svg>

                <style>{`
                  @keyframes checkDraw {
                    from { stroke-dashoffset: 50; }
                    to { stroke-dashoffset: 0; }
                  }
                `}</style>

                <h2 className="text-xl font-bold" style={{ color: '#16A34A' }}>
                  Profile Created Successfully!
                </h2>
                <p className="text-gray-500 text-sm">Your DeepShield profile is now active</p>

                <div
                  className="w-full rounded-lg p-3 text-sm font-mono text-center"
                  style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
                >
                  Profile ID: {profile.userId || 'IOB_' + Date.now()}
                </div>

                <div className="flex gap-3 w-full">
                  <Button
                    className="flex-1 text-white font-semibold"
                    style={{ backgroundColor: '#C8102E', border: 'none' }}
                    onClick={() => navigate('/auth')}
                  >
                    Test Authentication →
                  </Button>
                  <Button
                    className="flex-1 text-white font-semibold"
                    style={{ backgroundColor: '#003087', border: 'none' }}
                    onClick={() => navigate('/hacker')}
                  >
                    View Hacker Demo →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ── RENDER: CAPTURE ──────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: '#F4F6F9', minHeight: '100vh' }}>
      <IOBHeader />
      <div className="px-6 py-6">
        <div className="max-w-5xl mx-auto grid grid-cols-[55%_45%] gap-6">
          {/* LEFT COLUMN */}
          <div>
            {/* Instruction */}
            <div className="mb-3">
              <p
                className="text-xl font-bold transition-all duration-500"
                style={{ color: '#C8102E' }}
              >
                {STEPS[stepIndex]?.instruction}
              </p>
            </div>

            {/* Video */}
            <div
              className="relative rounded-xl overflow-hidden"
              style={{ border: '3px solid #003087' }}
            >
              <video
                ref={vidlive.videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: 'auto', display: 'block', transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={vidlive.canvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  transform: 'scaleX(-1)',
                }}
              />
            </div>

            {/* Countdown bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Step {stepIndex + 1} of {STEPS.length}</span>
                <span>{Math.round(countdown)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E7EB' }}>
                <div
                  className="h-full rounded-full transition-all duration-100"
                  style={{ width: `${countdown}%`, backgroundColor: '#C8102E' }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            <Card className="shadow-lg border-0">
              <CardContent className="pt-6">
                <h3 className="font-bold text-gray-800 mb-4">Enrollment Progress</h3>

                <div className="space-y-3 mb-6">
                  {STEPS.map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                        style={{
                          backgroundColor: completedSteps[i]
                            ? '#16A34A'
                            : i === stepIndex
                            ? '#003087'
                            : '#E5E7EB',
                          color: completedSteps[i] || i === stepIndex ? 'white' : '#6B7280',
                          border: i === stepIndex && !completedSteps[i] ? '2px solid #C8102E' : 'none',
                        }}
                      >
                        {completedSteps[i] ? '✓' : i + 1}
                      </div>
                      <span
                        className="text-sm"
                        style={{
                          fontWeight: i === stepIndex ? 600 : 400,
                          color: completedSteps[i] ? '#16A34A' : i === stepIndex ? '#003087' : '#9CA3AF',
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Live Metrics
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Landmarks</span>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: vidlive.landmarksDetected >= 400 ? '#16A34A' : '#D97706' }}
                      >
                        {vidlive.landmarksDetected} / 468
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Frame Quality</span>
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor:
                            vidlive.preprocessGrade === 'good'
                              ? '#16A34A'
                              : vidlive.preprocessGrade === 'marginal'
                              ? '#D97706'
                              : '#DC2626',
                          color: 'white',
                          border: 'none',
                        }}
                      >
                        {vidlive.preprocessGrade.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Jitter Score</span>
                      <span className="text-sm font-semibold text-gray-700">
                        {vidlive.jitterScoreVal} / 100
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
