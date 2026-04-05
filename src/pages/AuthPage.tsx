import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useVidLive } from '@/hooks/useVidLive'
import { useProfile } from '@/store/userProfile'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// ── IOB DeepShield Header ────────────────────────────────────────────────────
function IOBHeader({ isHackerMode, enrolled }: { isHackerMode: boolean; enrolled: boolean }) {
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
              />
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ color: '#C8102E', fontWeight: 700, fontSize: 18 }}>DeepShield</span>
          </div>
          {isHackerMode ? (
            <Badge
              className="text-xs font-bold animate-pulse"
              style={{ backgroundColor: '#DC2626', color: 'white', border: 'none' }}
            >
              ⚠ HACKER MODE
            </Badge>
          ) : (
            <Badge
              className="text-xs font-bold"
              style={{ backgroundColor: '#16A34A', color: 'white', border: 'none' }}
            >
              ✓ Genuine Session
            </Badge>
          )}
        </div>
        <div style={{ color: '#FFD700', fontStyle: 'italic', fontSize: 13 }}>
          Good People to Grow With
        </div>
      </div>
      <div style={{ height: 3, backgroundColor: '#C8102E' }} />
    </div>
  )
}

// ── Score bar helper ─────────────────────────────────────────────────────────
function ScoreBar({ value, label }: { value: number; label: string }) {
  const color = value > 70 ? '#16A34A' : value >= 40 ? '#D97706' : '#DC2626'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold" style={{ color }}>
          {value}/100
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E7EB' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ── Trust Score Gauge ────────────────────────────────────────────────────────
function TrustGauge({
  score,
  status,
}: {
  score: number
  status: 'GENUINE' | 'SUSPICIOUS' | 'FRAUDULENT' | 'RETRY' | 'PENDING'
}) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)

  const color =
    status === 'GENUINE'
      ? '#16A34A'
      : status === 'FRAUDULENT'
      ? '#DC2626'
      : status === 'RETRY'
      ? '#DC2626'
      : status === 'SUSPICIOUS'
      ? '#D97706'
      : '#6B7280'

  const statusLabel =
    status === 'PENDING' ? 'ANALYZING' : status

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
        />
        <text x="60" y="55" textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: color, fontFamily: 'Poppins, sans-serif' }}>
          {score}
        </text>
        <text x="60" y="72" textAnchor="middle" style={{ fontSize: 8, fontWeight: 600, fill: color, fontFamily: 'Poppins, sans-serif' }}>
          {statusLabel}
        </text>
      </svg>
    </div>
  )
}

const INSTRUCTIONS = [
  { text: 'Position your face in the frame', step: 0 },
  { text: 'Look straight — hold still', step: 1 },
  { text: 'Slowly turn your head LEFT', step: 2 },
  { text: 'Slowly turn your head RIGHT', step: 3 },
  { text: 'Blink twice slowly', step: 4 },
]

export default function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isHackerMode = false, deviceId } = (location.state as any) || {}
  const [profile] = useProfile()
  const vidlive = useVidLive(profile)

  const [phase, setPhase] = useState<'intro' | 'active' | 'complete'>('intro')
  const [currentInstruction, setCurrentInstruction] = useState('Preparing...')
  const [stepIndex, setStepIndex] = useState(0)
  const [stepDots, setStepDots] = useState([false, false, false, false, false])
  const [noFaceDetected, setNoFaceDetected] = useState(false)

  // Ref so the completion timer can read the LATEST face frame count
  // (closures can't read React state, but refs are always current)
  const faceFramesRef = useRef(0)
  useEffect(() => {
    faceFramesRef.current = vidlive.totalFaceFrames
  }, [vidlive.totalFaceFrames])

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  function clearTimers() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  function addTimer(fn: () => void, delay: number) {
    const id = setTimeout(fn, delay)
    timersRef.current.push(id)
  }

  function startSession() {
    setPhase('active')
    
    // Defer startDetection to ensure React has mounted the video element
    setTimeout(() => {
      vidlive.startDetection(deviceId)
    }, 100)

    addTimer(() => {
      setCurrentInstruction(INSTRUCTIONS[0].text)
      setStepIndex(0)
    }, 0)

    addTimer(() => {
      setCurrentInstruction(INSTRUCTIONS[1].text)
      setStepIndex(1)
    }, 3000)

    addTimer(() => {
      setCurrentInstruction(INSTRUCTIONS[2].text)
      setStepIndex(2)
      setStepDots((p) => { const n = [...p]; n[0] = true; return n })
      vidlive.recordReactionTime()
    }, 7000)

    addTimer(() => {
      setCurrentInstruction(INSTRUCTIONS[3].text)
      setStepIndex(3)
      setStepDots((p) => { const n = [...p]; n[1] = true; return n })
      vidlive.recordReactionTime()
    }, 12000)

    addTimer(() => {
      setCurrentInstruction(INSTRUCTIONS[4].text)
      setStepIndex(4)
      setStepDots((p) => { const n = [...p]; n[2] = true; return n })
      vidlive.recordReactionTime()
    }, 17000)

    addTimer(() => {
      vidlive.stopDetection()
      // Gate: require at least 20 frames with a real face detected.
      // Default scores (all 50) are meaningless without actual face data.
      if (faceFramesRef.current < 20) {
        setNoFaceDetected(true)
      } else {
        setNoFaceDetected(false)
      }
      setCurrentInstruction('Analysis complete')
      setStepDots([true, true, true, true, true])
      setPhase('complete')
    }, 21000)
  }

  useEffect(() => {
    return () => {
      clearTimers()
      vidlive.stopDetection()
    }
  }, [])

  // Border color based on trust
  const borderColor =
    vidlive.trustStatus === 'GENUINE'
      ? '#16A34A'
      : vidlive.trustStatus === 'FRAUDULENT' || vidlive.trustStatus === 'RETRY'
      ? '#DC2626'
      : '#003087'

  // ── INTRO SCREEN ──────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div style={{ backgroundColor: '#F4F6F9', minHeight: '100vh' }}>
        <IOBHeader isHackerMode={isHackerMode} enrolled={profile.enrolled} />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <Card className="w-full max-w-md shadow-xl border-0">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center gap-6">
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{ width: 80, height: 80, backgroundColor: isHackerMode ? '#FEE2E2' : '#EFF6FF' }}
                >
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
                      fill={isHackerMode ? '#DC2626' : '#003087'}
                    />
                    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                <div>
                  <h1
                    className="text-2xl font-bold mb-2"
                    style={{ color: '#003087', fontFamily: 'Poppins, sans-serif' }}
                  >
                    Ready to Authenticate
                  </h1>
                  {isHackerMode && (
                    <div
                      className="rounded-lg p-3 mb-3 text-sm"
                      style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}
                    >
                      ⚠ Hacker mode active — deepfake stream may be injected
                    </div>
                  )}
                  {!isHackerMode && profile.enrolled && (
                    <p className="text-gray-500 text-sm">
                      Enrolled profile loaded — biometric comparison enabled
                    </p>
                  )}
                  {!isHackerMode && !profile.enrolled && (
                    <p className="text-yellow-600 text-sm">
                      No enrollment found — using absolute detection thresholds
                    </p>
                  )}
                </div>

                <p className="text-gray-400 text-xs">
                  You will be asked to move your head and blink during the 21-second session.
                </p>

                <Button
                  className="w-full text-white font-semibold h-12 text-base"
                  style={{ backgroundColor: vidlive.isLoaded ? '#C8102E' : '#9CA3AF', border: 'none' }}
                  onClick={startSession}
                  disabled={!vidlive.isLoaded}
                >
                  {vidlive.isLoaded ? 'Begin Authentication →' : 'Loading DeepShield Engine...'}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/enroll')}
                >
                  {profile.enrolled ? '← Re-enroll' : '← Enroll First'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ── RESULT SCREEN ─────────────────────────────────────────────────────────
  if (phase === 'complete') {
    const { trustScore, trustStatus, trustFlags, preprocessScore, jitterScoreVal, reactionScore, parallaxScore } = vidlive

    // ── NO FACE DETECTED ────────────────────────────────────────────────────
    if (noFaceDetected) {
      return (
        <div style={{ backgroundColor: '#F4F6F9', minHeight: '100vh' }}>
          <IOBHeader isHackerMode={isHackerMode} enrolled={profile.enrolled} />
          <div className="flex items-center justify-center min-h-[80vh] px-4">
            <div
              className="w-full max-w-md rounded-2xl shadow-xl p-8 text-center"
              style={{ backgroundColor: 'white', border: '2px solid #D97706' }}
            >
              <div className="text-6xl mb-4">😶</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#D97706' }}>
                No Face Detected
              </h2>
              <p className="text-gray-600 text-sm mb-2">
                DeepShield could not detect your face during the session.
                Scores are only valid when a face is present for the full 21 seconds.
              </p>
              <p className="text-gray-400 text-xs mb-6">
                Frames with face detected: <strong>{vidlive.totalFaceFrames}</strong> / ~630 expected
              </p>
              <div
                className="rounded-lg p-4 mb-6 text-left text-sm"
                style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
              >
                <p className="font-semibold text-yellow-800 mb-2">Tips to fix this:</p>
                <ul className="space-y-1 text-yellow-700">
                  <li>✓ Ensure your face fills the camera frame</li>
                  <li>✓ Allow camera permissions when prompted</li>
                  <li>✓ Improve lighting — avoid backlighting</li>
                  <li>✓ Remove sunglasses or face coverings</li>
                </ul>
              </div>
              <button
                className="w-full text-white font-bold h-12 rounded-lg"
                style={{ backgroundColor: '#C8102E', border: 'none', cursor: 'pointer', fontSize: 15 }}
                onClick={() => {
                  vidlive.resetScores()
                  setNoFaceDetected(false)
                  setStepDots([false, false, false, false, false])
                  setStepIndex(0)
                  setPhase('intro')
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )
    }

    const scoreTable = [
      { label: 'Frame Quality', score: preprocessScore },
      { label: 'Landmark Tracking', score: jitterScoreVal },
      { label: 'Reaction Timing', score: reactionScore },
      { label: 'Depth Analysis', score: parallaxScore },
    ]

    if (trustStatus === 'GENUINE') {
      return (
        <div style={{ backgroundColor: '#F4F6F9', minHeight: '100vh' }}>
          <IOBHeader isHackerMode={isHackerMode} enrolled={profile.enrolled} />
          <div className="flex items-center justify-center min-h-[80vh] px-4">
            <Card className="w-full max-w-lg shadow-xl" style={{ border: '2px solid #16A34A' }}>
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col items-center text-center gap-5">
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="36" fill="none" stroke="#16A34A" strokeWidth="4" />
                    <path
                      d="M24 40 L35 52 L56 30"
                      fill="none"
                      stroke="#16A34A"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="50"
                      strokeDashoffset="0"
                      style={{ animation: 'checkDraw 0.8s ease forwards' }}
                    />
                    <style>{`@keyframes checkDraw { from { stroke-dashoffset: 50; } to { stroke-dashoffset: 0; } }`}</style>
                  </svg>

                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: '#16A34A' }}>
                      ✓ Authentication Successful
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      Identity Verified — Welcome to IOB NetBanking
                    </p>
                  </div>

                  <Badge style={{ backgroundColor: '#16A34A', color: 'white', border: 'none', fontSize: 14, padding: '6px 16px' }}>
                    Trust Score: {trustScore} / 100
                  </Badge>

                  <div className="w-full rounded-lg overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ backgroundColor: '#F9FAFB' }}>
                          <th className="text-left px-4 py-2 text-gray-500 font-medium">Feature</th>
                          <th className="text-center px-4 py-2 text-gray-500 font-medium">Score</th>
                          <th className="text-center px-4 py-2 text-gray-500 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scoreTable.map((row, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                            <td className="px-4 py-2 text-gray-700">{row.label}</td>
                            <td className="text-center px-4 py-2 font-semibold" style={{ color: row.score > 70 ? '#16A34A' : row.score >= 40 ? '#D97706' : '#DC2626' }}>{row.score}</td>
                            <td className="text-center px-4 py-2 text-green-600 font-bold">✓</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Button
                    className="w-full text-white font-bold h-12"
                    style={{ backgroundColor: '#C8102E', border: 'none' }}
                    onClick={() => navigate('/')}
                  >
                    Proceed to NetBanking →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    if (trustStatus === 'SUSPICIOUS') {
      const lowestFeature = scoreTable.reduce((a, b) => (a.score < b.score ? a : b))
      return (
        <div style={{ backgroundColor: '#F4F6F9', minHeight: '100vh' }}>
          <IOBHeader isHackerMode={isHackerMode} enrolled={profile.enrolled} />
          <div className="flex items-center justify-center min-h-[80vh] px-4">
            <Card className="w-full max-w-lg shadow-xl" style={{ border: '2px solid #D97706' }}>
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col items-center text-center gap-5">
                  <div className="text-5xl" style={{ animation: 'wobble 0.5s infinite' }}>⚠️</div>
                  <style>{`@keyframes wobble { 0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)} }`}</style>

                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: '#D97706' }}>
                      ⚠ Verification Inconclusive
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Score: {trustScore} / 100</p>
                  </div>

                  <p className="text-gray-600 text-sm">
                    Lowest scoring feature: <strong>{lowestFeature.label}</strong> ({lowestFeature.score}/100)
                  </p>

                  <p className="text-gray-500 text-sm">Additional verification required</p>

                  <div className="flex gap-3 w-full">
                    <Button
                      className="flex-1 text-white font-semibold"
                      style={{ backgroundColor: '#C8102E', border: 'none' }}
                      onClick={() => { vidlive.resetScores(); setStepDots([false,false,false,false,false]); setPhase('intro') }}
                    >
                      Try Again
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                    >
                      Visit Branch
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    // FRAUDULENT or RETRY
    return (
      <div style={{ backgroundColor: '#F4F6F9', minHeight: '100vh' }}>
        <IOBHeader isHackerMode={isHackerMode} enrolled={profile.enrolled} />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <Card className="w-full max-w-lg shadow-xl" style={{ border: '2px solid #DC2626', backgroundColor: '#FEF2F2' }}>
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center gap-5">
                <div className="text-5xl" style={{ animation: 'pulse 1s infinite' }}>🚨</div>

                <div>
                  <h2 className="text-2xl font-bold uppercase" style={{ color: '#DC2626' }}>
                    🚨 DEEPFAKE DETECTED
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Trust Score: {trustScore} / 100 — Access Denied
                  </p>
                </div>

                <p className="text-gray-600 text-sm">
                  This authentication attempt has been blocked and flagged for security review.
                </p>

                {trustFlags.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {trustFlags.map((flag, i) => (
                      <Badge
                        key={i}
                        style={{ backgroundColor: '#DC2626', color: 'white', border: 'none', fontSize: 11 }}
                      >
                        {flag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="w-full rounded-lg overflow-hidden" style={{ border: '1px solid #FCA5A5' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: '#FEE2E2' }}>
                        <th className="text-left px-4 py-2 text-red-600 font-medium">Feature</th>
                        <th className="text-center px-4 py-2 text-red-600 font-medium">Score</th>
                        <th className="text-center px-4 py-2 text-red-600 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoreTable.map((row, i) => (
                        <tr key={i} style={{ borderTop: '1px solid #FCA5A5' }}>
                          <td className="px-4 py-2 text-gray-700">{row.label}</td>
                          <td className="text-center px-4 py-2 font-semibold" style={{ color: row.score > 70 ? '#16A34A' : '#DC2626' }}>{row.score}</td>
                          <td className="text-center px-4 py-2" style={{ color: row.score > 70 ? '#16A34A' : '#DC2626', fontWeight: 700 }}>{row.score > 70 ? '✓' : '✗'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {isHackerMode && (
                  <div
                    className="w-full rounded-lg p-4 text-left"
                    style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }}
                  >
                    <p className="text-red-800 font-semibold text-sm mb-2">Why DeepShield caught this attack:</p>
                    <div className="space-y-1 text-xs text-red-700">
                      <p>→ Virtual camera processing introduced measurable reaction delay</p>
                      <p>→ Facial depth ratios too linear for a real 3D human face</p>
                      <p>→ These signals cannot be eliminated by any current deepfake tool</p>
                      <p>→ This protects every IOB customer</p>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full text-white font-semibold h-11"
                  style={{ backgroundColor: '#003087', border: 'none' }}
                  onClick={() => navigate('/')}
                >
                  Return to Login
                </Button>

                {isHackerMode && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/hacker')}
                  >
                    ← Back to Attack Demo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ── ACTIVE SCREEN ─────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: '#F4F6F9', minHeight: '100vh' }}>
      <IOBHeader isHackerMode={isHackerMode} enrolled={profile.enrolled} />

      {/* Status banner */}
      <div
        className="px-6 py-2 text-sm font-medium"
        style={{
          backgroundColor: isHackerMode ? '#7F1D1D' : profile.enrolled ? '#1E3A5F' : '#3B2F00',
          borderBottom: `1px solid ${isHackerMode ? '#EF4444' : profile.enrolled ? '#3B82F6' : '#D97706'}`,
          color: 'white',
        }}
      >
        {isHackerMode
          ? '🔴 Hacker Simulation Active — Deepfake stream may be injected'
          : profile.enrolled
          ? '🔵 Enrolled Profile Loaded — Comparing against your biometric baseline'
          : '⚠ No Enrollment Found — Using absolute detection thresholds'}
      </div>

      {/* Main two-column layout */}
      <div className="px-6 py-4 max-w-6xl mx-auto grid grid-cols-[58%_42%] gap-6">
        {/* LEFT: Video + instructions */}
        <div>
          {/* Instruction card */}
          <div className="bg-white rounded-xl shadow p-4 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: '#003087' }}
              >
                {stepIndex + 1}
              </div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Step {stepIndex + 1} of 5</span>
            </div>
            <p className="text-xl font-bold transition-all duration-500" style={{ color: '#C8102E' }}>
              {currentInstruction}
            </p>
          </div>

          {/* Video */}
          <div
            className="relative rounded-xl overflow-hidden shadow-lg"
            style={{ border: `2px solid ${borderColor}`, transition: 'border-color 0.3s ease' }}
          >
            <video
              ref={vidlive.videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }}
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
            {/* Overlay badge */}
            <div className="absolute top-3 right-3">
              {isHackerMode ? (
                <Badge style={{ backgroundColor: '#DC2626', color: 'white', border: 'none' }}>
                  DEEPFAKE STREAM
                </Badge>
              ) : (
                <Badge style={{ backgroundColor: '#16A34A', color: 'white', border: 'none' }} className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
                  LIVE
                </Badge>
              )}
            </div>

            {/* No face overlay */}
            {vidlive.landmarksDetected === 0 && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              >
                <p className="text-white text-sm font-semibold text-center px-4">
                  No face detected — position yourself in frame
                </p>
              </div>
            )}
          </div>

          {/* Step progress dots */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {stepDots.map((done, i) => (
              <div key={i} className="flex items-center gap-1">
                <div
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === stepIndex ? 12 : 8,
                    height: i === stepIndex ? 12 : 8,
                    backgroundColor: done ? '#16A34A' : i === stepIndex ? '#C8102E' : '#D1D5DB',
                    animation: i === stepIndex ? 'pulse 1s infinite' : 'none',
                  }}
                />
                {i < stepDots.length - 1 && (
                  <div style={{ width: 24, height: 2, backgroundColor: done ? '#16A34A' : '#D1D5DB' }} />
                )}
              </div>
            ))}
          </div>

          {/* Error */}
          {vidlive.error && (
            <div className="mt-3 rounded-lg p-3" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <p className="text-red-700 text-sm font-semibold">Camera Error: {vidlive.error}</p>
              <p className="text-red-500 text-xs mt-1">Please allow camera access and refresh</p>
            </div>
          )}
        </div>

        {/* RIGHT: Detection Dashboard */}
        <div className="space-y-3">
          {/* Title */}
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg" style={{ color: '#003087' }}>
              DeepShield Detection
            </h2>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-500 uppercase tracking-wide">Analyzing</span>
            </div>
          </div>

          {/* Card 1: Frame Quality */}
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm text-gray-700">🔧 Frame Quality</span>
                <Badge
                  style={{
                    backgroundColor:
                      vidlive.preprocessGrade === 'good'
                        ? '#16A34A'
                        : vidlive.preprocessGrade === 'marginal'
                        ? '#D97706'
                        : '#DC2626',
                    color: 'white',
                    border: 'none',
                    fontSize: 11,
                  }}
                >
                  {vidlive.preprocessGrade.toUpperCase()}
                </Badge>
              </div>
              <div className="space-y-2">
                <ScoreBar value={vidlive.preprocessBrightness} label="Brightness" />
                <ScoreBar value={vidlive.preprocessContrast} label="Contrast" />
              </div>
              <div className="mt-2 text-right text-xs text-gray-400">
                Score: {vidlive.preprocessScore}/100
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Landmark Tracking */}
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="pt-4 pb-4">
              <span className="font-semibold text-sm text-gray-700">📍 Facial Landmarks</span>
              <div className="flex items-center justify-center my-2">
                <span
                  className="text-3xl font-bold"
                  style={{
                    color:
                      vidlive.landmarksDetected >= 400
                        ? '#16A34A'
                        : vidlive.landmarksDetected >= 300
                        ? '#D97706'
                        : '#DC2626',
                  }}
                >
                  {vidlive.landmarksDetected}
                </span>
                <span className="text-gray-400 text-lg ml-1">/ 468</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">Boundary Jitter Score:</p>
              <ScoreBar value={vidlive.jitterScoreVal} label="" />
            </CardContent>
          </Card>

          {/* Card 3: Reaction Timing */}
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="pt-4 pb-4">
              <span className="font-semibold text-sm text-gray-700">⏱ Response Timing</span>
              <div className="flex items-center justify-center my-2">
                <span
                  className="text-3xl font-bold"
                  style={{
                    color: vidlive.reactionTimeMs
                      ? vidlive.reactionTimeMs < 400
                        ? '#16A34A'
                        : vidlive.reactionTimeMs < 700
                        ? '#D97706'
                        : '#DC2626'
                      : '#9CA3AF',
                  }}
                >
                  {vidlive.reactionTimeMs ? `${vidlive.reactionTimeMs}ms` : '—'}
                </span>
              </div>
              {profile.enrolled && vidlive.reactionTimeMs && (
                <p className="text-xs text-center text-gray-400 mb-2">
                  Baseline: {profile.reactionMeanMs}ms
                  <span
                    className="ml-2 font-semibold"
                    style={{
                      color:
                        vidlive.reactionTimeMs - profile.reactionMeanMs > 0 ? '#DC2626' : '#16A34A',
                    }}
                  >
                    {vidlive.reactionTimeMs - profile.reactionMeanMs > 0 ? '+' : ''}
                    {vidlive.reactionTimeMs - profile.reactionMeanMs}ms
                  </span>
                </p>
              )}
              <ScoreBar value={vidlive.reactionScore} label="" />
            </CardContent>
          </Card>

          {/* Card 4: Parallax / Depth */}
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-gray-700">📐 3D Depth Analysis</span>
                <span className="text-xs text-gray-400">
                  Yaw: {vidlive.yawRatio.toFixed(3)}
                </span>
              </div>
              <ScoreBar value={vidlive.parallaxScore} label="" />
              <div className="mt-2 text-right">
                <Badge
                  style={{
                    backgroundColor:
                      vidlive.parallaxScore > 70
                        ? '#16A34A'
                        : vidlive.parallaxScore >= 40
                        ? '#D97706'
                        : '#DC2626',
                    color: 'white',
                    border: 'none',
                    fontSize: 11,
                  }}
                >
                  {vidlive.parallaxScore > 70
                    ? 'NATURAL DEPTH'
                    : vidlive.parallaxScore >= 40
                    ? 'MARGINAL'
                    : 'ANOMALY DETECTED'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Trust Score Gauge */}
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="pt-4 pb-4">
              <h3 className="text-center font-semibold text-sm text-gray-700 mb-2">
                Overall Trust Score
              </h3>
              <TrustGauge score={vidlive.trustScore} status={vidlive.trustStatus} />

              {vidlive.trustFlags.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center mt-2">
                  {vidlive.trustFlags.map((flag, i) => (
                    <Badge
                      key={i}
                      style={{ backgroundColor: '#DC2626', color: 'white', border: 'none', fontSize: 10 }}
                    >
                      {flag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
