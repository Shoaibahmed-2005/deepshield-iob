import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CircleX,
  ShieldAlert,
  ShieldCheck,
  VideoOff,
} from 'lucide-react'
import { useVidLive } from '@/hooks/useVidLive'
import { useProfile } from '@/store/userProfile'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageShell } from '@/components/layout/PageShell'
import { fadeInUp, hoverLift } from '@/lib/motion'

const INSTRUCTIONS = [
  { text: 'Position your face in the frame', step: 0 },
  { text: 'Look straight and stay still', step: 1 },
  { text: 'Turn your head to the left', step: 2 },
  { text: 'Turn your head to the right', step: 3 },
  { text: 'Stay still for final verification', step: 4 },
]

function trustTone(status: 'GENUINE' | 'SUSPICIOUS' | 'FRAUDULENT' | 'RETRY' | 'PENDING') {
  if (status === 'GENUINE') return { label: 'Verified', className: 'bg-emerald-600 text-white' }
  if (status === 'SUSPICIOUS') return { label: 'Needs Review', className: 'bg-amber-600 text-white' }
  if (status === 'FRAUDULENT' || status === 'RETRY') return { label: 'Blocked', className: 'bg-rose-600 text-white' }
  return { label: 'Analyzing', className: 'bg-[#0f3e92] text-white' }
}

function scoreLabel(score: number) {
  if (score >= 75) return 'Strong'
  if (score >= 45) return 'Moderate'
  return 'Low'
}

export default function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isHackerMode = false, deviceId } = (location.state as { isHackerMode?: boolean; deviceId?: string }) || {}

  const [profile] = useProfile()
  const vidlive = useVidLive(profile)

  const [phase, setPhase] = useState<'intro' | 'active' | 'complete'>('intro')
  const [currentInstruction, setCurrentInstruction] = useState('Preparing secure session')
  const [stepIndex, setStepIndex] = useState(0)
  const [stepDots, setStepDots] = useState([false, false, false, false, false])
  const [noFaceDetected, setNoFaceDetected] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const faceFramesRef = useRef(0)

  useEffect(() => {
    faceFramesRef.current = vidlive.totalFaceFrames
  }, [vidlive.totalFaceFrames])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
      vidlive.stopDetection()
    }
  }, [])

  const checks = useMemo(
    () => [
      {
        label: 'Capture Quality',
        value: vidlive.preprocessScore,
        detail: vidlive.preprocessGrade === 'good' ? 'Lighting and contrast are stable' : 'Adjust face framing for better quality',
      },
      {
        label: 'Face Stability',
        value: vidlive.jitterScoreVal,
        detail: 'Checks for spoofing artifacts and boundary instability.',
      },
      {
        label: 'Live Response Check',
        value: vidlive.reactionScore,
        detail: vidlive.reactionTimeMs ? `${vidlive.reactionTimeMs} ms response detected` : 'Waiting for movement response',
      },
      {
        label: 'Depth Verification',
        value: vidlive.parallaxScore,
        detail: 'Confirms natural 3D depth consistency from head motion.',
      },
    ],
    [
      vidlive.preprocessScore,
      vidlive.preprocessGrade,
      vidlive.jitterScoreVal,
      vidlive.reactionScore,
      vidlive.reactionTimeMs,
      vidlive.parallaxScore,
    ]
  )

  const overallProgress = ((stepIndex + (phase === 'complete' ? 1 : 0)) / INSTRUCTIONS.length) * 100
  const trustMeta = trustTone(vidlive.trustStatus)

  function clearTimers() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  function addTimer(fn: () => void, delay: number) {
    const id = setTimeout(fn, delay)
    timersRef.current.push(id)
  }

  function resetSession() {
    clearTimers()
    vidlive.stopDetection()
    vidlive.resetScores()
    setStepDots([false, false, false, false, false])
    setStepIndex(0)
    setNoFaceDetected(false)
    setCurrentInstruction('Preparing secure session')
    setPhase('intro')
  }

  function startSession() {
    setPhase('active')
    setNoFaceDetected(false)
    setStepDots([false, false, false, false, false])
    setStepIndex(0)
    vidlive.resetScores()

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
      setStepDots((prev) => {
        const next = [...prev]
        next[0] = true
        return next
      })
    }, 3000)

    addTimer(() => {
      setCurrentInstruction(INSTRUCTIONS[2].text)
      setStepIndex(2)
      setStepDots((prev) => {
        const next = [...prev]
        next[1] = true
        return next
      })
      vidlive.recordReactionTime()
    }, 7000)

    addTimer(() => {
      setCurrentInstruction(INSTRUCTIONS[3].text)
      setStepIndex(3)
      setStepDots((prev) => {
        const next = [...prev]
        next[2] = true
        return next
      })
      vidlive.recordReactionTime()
    }, 12000)

    addTimer(() => {
      setCurrentInstruction(INSTRUCTIONS[4].text)
      setStepIndex(4)
      setStepDots((prev) => {
        const next = [...prev]
        next[3] = true
        return next
      })
      vidlive.recordReactionTime()
    }, 17000)

    addTimer(() => {
      vidlive.stopDetection()
      setNoFaceDetected(faceFramesRef.current < 20)
      setCurrentInstruction('Security analysis completed')
      setStepDots([true, true, true, true, true])
      setPhase('complete')
    }, 21000)
  }

  if (phase === 'intro') {
    return (
      <PageShell backTo="/" backLabel="Home">
        <div className="mx-auto flex w-full max-w-6xl justify-center px-4 py-10 sm:px-6 lg:px-8">
          <motion.div className="w-full max-w-2xl" {...fadeInUp}>
            <Card className="premium-card border-0">
              <CardContent className="space-y-6 pt-8 pb-8">
                <div className="flex items-center gap-3">
                  <div className={`rounded-2xl p-3 ${isHackerMode ? 'bg-rose-100 text-rose-700' : 'bg-[#e6efff] text-[#0f3e92]'}`}>
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-[#0f3f92]">Secure Authentication</h1>
                    <p className="text-sm text-[#5f79a4]">Follow the guided verification steps to continue.</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-[#d8e3fb] bg-[#f7faff] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#5d79a4]">Session mode</span>
                    <Badge className={isHackerMode ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}>
                      {isHackerMode ? 'Security simulation' : 'Live customer session'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#5d79a4]">Enrollment profile</span>
                    <span className="text-sm font-medium text-[#1b4c97]">
                      {profile.enrolled ? 'Loaded and active' : 'Not found (fallback thresholds)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#5d79a4]">Estimated duration</span>
                    <span className="text-sm font-medium text-[#1b4c97]">~21 seconds</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#f0d89f] bg-[#fff8e9] px-3 py-2 text-sm text-[#7a5a16]">
                  Keep your face centered, avoid heavy backlighting, and follow each prompt naturally.
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button variant="brand" size="lg" className="w-full" onClick={startSession} disabled={!vidlive.isLoaded}>
                    {vidlive.isLoaded ? 'Start Verification' : 'Initializing Engine'}
                  </Button>
                  <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/enroll')}>
                    {profile.enrolled ? 'Re-enroll Profile' : 'Enroll First'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </PageShell>
    )
  }

  if (phase === 'complete') {
    if (noFaceDetected) {
      return (
        <PageShell backTo="/" backLabel="Home">
          <div className="mx-auto flex w-full max-w-5xl justify-center px-4 py-10 sm:px-6 lg:px-8">
            <motion.div className="w-full max-w-xl" {...fadeInUp}>
              <Card className="premium-card border-rose-200 bg-rose-50/60">
                <CardContent className="space-y-5 pt-8 pb-8 text-center">
                  <VideoOff className="mx-auto h-12 w-12 text-rose-600" />
                  <div>
                    <h2 className="text-2xl font-semibold text-rose-700">Face Not Detected</h2>
                    <p className="mt-2 text-sm text-rose-700/80">
                      We could not capture enough facial frames for a secure decision.
                    </p>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-white p-3 text-sm text-rose-700">
                    Valid frames detected: <span className="font-semibold">{vidlive.totalFaceFrames}</span>
                  </div>
                  <Button variant="danger" size="lg" className="w-full" onClick={resetSession}>
                    Retry Verification
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </PageShell>
      )
    }

    const isSuccess = vidlive.trustStatus === 'GENUINE'
    const isReview = vidlive.trustStatus === 'SUSPICIOUS'
    const icon = isSuccess ? CheckCircle2 : isReview ? AlertTriangle : ShieldAlert
    const title = isSuccess
      ? 'Authentication Successful'
      : isReview
      ? 'Additional Verification Needed'
      : 'Authentication Blocked'
    const subtitle = isSuccess
      ? 'Your identity has been securely verified.'
      : isReview
      ? 'We detected risk signals and require additional verification.'
      : 'This session has been blocked for customer security.'
    const tone =
      isSuccess ? 'text-emerald-700 bg-emerald-100' : isReview ? 'text-amber-700 bg-amber-100' : 'text-rose-700 bg-rose-100'

    return (
      <PageShell backTo="/" backLabel="Home">
        <div className="mx-auto flex w-full max-w-5xl justify-center px-4 py-10 sm:px-6 lg:px-8">
          <motion.div className="w-full max-w-2xl" {...fadeInUp}>
            <Card className="premium-card border-0">
              <CardContent className="space-y-6 pt-8 pb-8">
                <div className="text-center">
                  <div className={`mx-auto mb-4 inline-flex rounded-full p-3 ${tone}`}>
                    {icon({ className: 'h-9 w-9' })}
                  </div>
                  <h2 className="text-2xl font-semibold text-[#153f88]">{title}</h2>
                  <p className="mt-2 text-sm text-[#607aa5]">{subtitle}</p>
                </div>

                <div className="grid gap-3 rounded-2xl border border-[#d8e3fb] bg-[#f7faff] p-4 sm:grid-cols-2">
                  <div className="security-kpi flex items-center justify-between">
                    <span className="text-sm text-[#5f79a4]">Trust score</span>
                    <span className="text-lg font-semibold text-[#0f3e92]">{vidlive.trustScore}/100</span>
                  </div>
                  <div className="security-kpi flex items-center justify-between">
                    <span className="text-sm text-[#5f79a4]">Session status</span>
                    <Badge className={trustMeta.className}>{trustMeta.label}</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {checks.map((check) => (
                    <div key={check.label} className="rounded-xl border border-[#d8e4fb] bg-white px-4 py-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#204b95]">{check.label}</span>
                        <span className="text-sm font-semibold text-[#194590]">
                          {check.value}/100 • {scoreLabel(check.value)}
                        </span>
                      </div>
                      <Progress value={check.value} className="h-2 bg-[#e6efff]" />
                      <p className="mt-2 text-xs text-[#6883af]">{check.detail}</p>
                    </div>
                  ))}
                </div>

                {vidlive.trustFlags.length > 0 && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <p className="mb-2 text-sm font-semibold text-rose-700">Detected risk signals</p>
                    <div className="space-y-1 text-sm text-rose-700/85">
                      {vidlive.trustFlags.map((flag) => (
                        <p key={flag}>{flag}</p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button variant={isSuccess ? 'brand' : 'danger'} size="lg" className="w-full" onClick={() => navigate('/')}>
                    {isSuccess ? 'Continue to Banking' : 'Return to Login'}
                  </Button>
                  <Button variant="outline" size="lg" className="w-full" onClick={resetSession}>
                    Retry Authentication
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      backTo="/"
      backLabel="Home"
      rightSlot={
        <Badge className={isHackerMode ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}>
          {isHackerMode ? 'Security simulation' : 'Live session'}
        </Badge>
      }
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 rounded-2xl border border-[#d5e2fc] bg-white/70 px-4 py-3 backdrop-blur-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[#6984af]">Current instruction</p>
              <p className="text-sm font-medium text-[#204b95]">{currentInstruction}</p>
            </div>
            <Badge className={trustMeta.className}>{trustMeta.label}</Badge>
          </div>
          <Progress value={overallProgress} className="h-2.5 bg-[#e6efff]" />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <motion.section className="premium-card overflow-hidden p-4" {...fadeInUp}>
            <div className="relative overflow-hidden rounded-2xl border border-[#cfddf8] bg-[#d7e6ff]">
              <video
                ref={vidlive.videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-video w-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={vidlive.canvasRef}
                className="absolute inset-0 h-full w-full pointer-events-none"
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="pointer-events-none absolute inset-5 rounded-[1.5rem] border-2 border-white/70 shadow-[inset_0_0_0_1px_rgba(15,62,146,0.15)]" />
              {vidlive.landmarksDetected === 0 && (
                <div className="absolute inset-0 grid place-items-center bg-[#0f3e92]/50 p-4 text-center text-sm font-medium text-white">
                  Position your face inside the frame to continue.
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-5">
              {stepDots.map((done, index) => {
                const active = index === stepIndex
                return (
                  <motion.div
                    key={index}
                    className={`rounded-lg border px-3 py-2 text-center text-xs font-medium ${
                      done
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : active
                        ? 'border-[#b8ccf8] bg-[#eaf1ff] text-[#214b95]'
                        : 'border-[#d8e4fb] bg-white text-[#6883ae]'
                    }`}
                    {...hoverLift}
                  >
                    {done ? (
                      <CheckCircle2 className="mx-auto mb-1 h-4 w-4" />
                    ) : active ? (
                      <CircleDashed className="mx-auto mb-1 h-4 w-4 animate-spin" />
                    ) : (
                      <CircleX className="mx-auto mb-1 h-4 w-4 opacity-30" />
                    )}
                    Step {index + 1}
                  </motion.div>
                )
              })}
            </div>

            {vidlive.error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                Camera error: {vidlive.error}
              </div>
            )}
          </motion.section>

          <motion.section className="space-y-4" {...fadeInUp}>
            <Card className="premium-card">
              <CardContent className="pt-5 pb-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6884b2]">Security analysis</h3>
                <div className="mt-4 space-y-3">
                  {checks.map((check) => (
                    <motion.div key={check.label} className="rounded-xl border border-[#d8e4fb] bg-[#f7faff] p-3" {...hoverLift}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#1f4a94]">{check.label}</span>
                        <span className="text-xs font-semibold text-[#41639a]">{scoreLabel(check.value)}</span>
                      </div>
                      <Progress value={check.value} className="h-2 bg-[#e5efff]" />
                      <p className="mt-2 text-xs text-[#6a84af]">{check.detail}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card">
              <CardContent className="space-y-3 pt-5 pb-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6884b2]">Session status</h3>
                <div className="security-kpi flex items-center justify-between text-sm">
                  <span className="text-[#5f79a4]">Trust score</span>
                  <span className="font-semibold text-[#194590]">{vidlive.trustScore}/100</span>
                </div>
                <div className="security-kpi flex items-center justify-between text-sm">
                  <span className="text-[#5f79a4]">Face landmarks</span>
                  <span className="font-semibold text-[#194590]">{vidlive.landmarksDetected} / 468</span>
                </div>
                <div className="security-kpi flex items-center justify-between text-sm">
                  <span className="text-[#5f79a4]">Profile baseline</span>
                  <span className="font-semibold text-[#194590]">{profile.enrolled ? 'Enabled' : 'Fallback mode'}</span>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </div>
    </PageShell>
  )
}
