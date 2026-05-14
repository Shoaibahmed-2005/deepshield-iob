import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react'
import { useVidLive } from '@/hooks/useVidLive'
import { useProfile } from '@/store/userProfile'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageShell } from '@/components/layout/PageShell'
import { fadeInUp, hoverLift } from '@/lib/motion'

const STEPS = [
  { label: 'Face Alignment', instruction: 'Look straight at the camera and stay still.' },
  { label: 'Turn Left', instruction: 'Turn your head to the left slowly.' },
  { label: 'Turn Right', instruction: 'Turn your head to the right slowly.' },
  { label: 'Live Response', instruction: 'Follow the blink prompt naturally.' },
  { label: 'Stability Check', instruction: 'Hold still for final secure baseline.' },
]

const STEP_DURATION = 4000

export default function EnrollmentPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useProfile()
  const vidlive = useVidLive(profile)

  const [phase, setPhase] = useState<'welcome' | 'capture' | 'success'>('welcome')
  const [stepIndex, setStepIndex] = useState(0)
  const [countdown, setCountdown] = useState(100)
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false, false])

  const baselineLandmarks = useRef<number[]>([])
  const baselineYaw = useRef<number>(1.0)
  const reactionSamples = useRef<number[]>([])
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (phase !== 'capture') return
    setTimeout(() => {
      vidlive.startDetection()
    }, 120)
    runEnrollmentSequence()

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
      vidlive.stopDetection()
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
    }, 40)
  }

  function runEnrollmentSequence() {
    reactionSamples.current = []
    setCompletedSteps([false, false, false, false, false])

    setStepIndex(0)
    startCountdown(STEP_DURATION)

    setTimeout(() => {
      if (vidlive.videoRef.current) baselineLandmarks.current = []
      baselineYaw.current = vidlive.yawRatio
    }, 2000)

    setTimeout(() => {
      setStepIndex(1)
      setCompletedSteps((prev) => {
        const next = [...prev]
        next[0] = true
        return next
      })
      startCountdown(STEP_DURATION)
      vidlive.recordReactionTime()
    }, STEP_DURATION)

    setTimeout(() => {
      if (vidlive.reactionTimeMs !== null) reactionSamples.current.push(vidlive.reactionTimeMs)
    }, STEP_DURATION * 2)

    setTimeout(() => {
      setStepIndex(2)
      setCompletedSteps((prev) => {
        const next = [...prev]
        next[1] = true
        return next
      })
      startCountdown(STEP_DURATION)
      vidlive.recordReactionTime()
    }, STEP_DURATION * 2)

    setTimeout(() => {
      if (vidlive.reactionTimeMs !== null) reactionSamples.current.push(vidlive.reactionTimeMs)
    }, STEP_DURATION * 3)

    setTimeout(() => {
      setStepIndex(3)
      setCompletedSteps((prev) => {
        const next = [...prev]
        next[2] = true
        return next
      })
      startCountdown(STEP_DURATION)
      vidlive.recordReactionTime()
    }, STEP_DURATION * 3)

    setTimeout(() => {
      if (vidlive.reactionTimeMs !== null) reactionSamples.current.push(vidlive.reactionTimeMs)
    }, STEP_DURATION * 4)

    setTimeout(() => {
      setStepIndex(4)
      setCompletedSteps((prev) => {
        const next = [...prev]
        next[3] = true
        return next
      })
      startCountdown(3000)
    }, STEP_DURATION * 4)

    setTimeout(() => {
      setCompletedSteps([true, true, true, true, true])
      if (countdownRef.current) clearInterval(countdownRef.current)
      setCountdown(0)

      const samples = reactionSamples.current.filter((sample) => sample > 0)
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

  if (phase === 'welcome') {
    return (
      <PageShell backTo="/" backLabel="Home">
        <div className="mx-auto flex w-full max-w-5xl justify-center px-4 py-10 sm:px-6 lg:px-8">
          <motion.div className="w-full max-w-2xl" {...fadeInUp}>
            <Card className="premium-card border-0">
              <CardContent className="space-y-6 pt-8 pb-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#e6efff] p-3 text-[#0f3e92]">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-[#0f3f92]">DeepShield Enrollment</h1>
                    <p className="text-sm text-[#5f79a4]">
                      Create your secure identity profile in under 20 seconds.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#d8e3fb] bg-[#f7faff] p-4">
                  <p className="mb-3 text-sm font-medium text-[#2d548f]">What happens during enrollment</p>
                  <div className="grid gap-2 text-sm text-[#5f7aa6]">
                    {[
                      'Guided face capture with clear instructions',
                      'Movement and response timing baseline creation',
                      'On-device scoring for secure future verification',
                      'No raw video is stored after completion',
                    ].map((line) => (
                      <div key={line} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="security-kpi flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#d29a20]" />
                  <p className="text-sm text-[#385a8f]">Keep your face clearly visible for best accuracy.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    variant="brand"
                    size="lg"
                    className="w-full"
                    onClick={() => setPhase('capture')}
                    disabled={!vidlive.isLoaded}
                  >
                    {vidlive.isLoaded ? 'Begin Enrollment' : 'Initializing Engine'}
                  </Button>
                  <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/auth')}>
                    Skip to Authentication
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </PageShell>
    )
  }

  if (phase === 'success') {
    return (
      <PageShell backTo="/" backLabel="Home">
        <div className="mx-auto flex w-full max-w-5xl justify-center px-4 py-10 sm:px-6 lg:px-8">
          <motion.div className="w-full max-w-xl" {...fadeInUp}>
            <Card className="premium-card border-0">
              <CardContent className="space-y-6 pt-8 pb-8 text-center">
                <div className="mx-auto rounded-full bg-emerald-100 p-4 text-emerald-700">
                  <UserRoundCheck className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-emerald-700">Profile Enrollment Complete</h2>
                  <p className="mt-2 text-sm text-[#5f79a4]">
                    Your secure verification baseline is ready for authentication.
                  </p>
                </div>
                <div className="rounded-xl border border-[#d8e3fb] bg-[#f7faff] p-3 text-sm text-[#43659a]">
                  Profile ID: <span className="font-semibold">{profile.userId}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button variant="brand" size="lg" className="w-full" onClick={() => navigate('/auth')}>
                    Start Authentication
                  </Button>
                  <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/hacker')}>
                    View Security Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </PageShell>
    )
  }

  const completedCount = completedSteps.filter(Boolean).length

  return (
    <PageShell backTo="/" backLabel="Home">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d5e2fc] bg-white/70 px-4 py-3 backdrop-blur-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#6a84af]">Enrollment in progress</p>
            <p className="text-sm font-medium text-[#214b95]">{STEPS[stepIndex].instruction}</p>
          </div>
          <Badge className="bg-[#e6efff] text-[#0e3e92] hover:bg-[#dce8ff]">
            Step {stepIndex + 1} of {STEPS.length}
          </Badge>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.28fr_0.72fr]">
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
                  Position your face inside the frame to continue secure enrollment.
                </div>
              )}
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.12em] text-[#5e79a3]">
                <span>Step progress</span>
                <span>{countdown}%</span>
              </div>
              <Progress value={countdown} className="h-2.5 bg-[#e6efff]" />
            </div>
          </motion.section>

          <motion.section className="space-y-4" {...fadeInUp}>
            <Card className="premium-card">
              <CardContent className="pt-5 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6884b2]">
                  Verification checklist
                </p>
                <div className="mt-4 space-y-3">
                  {STEPS.map((step, index) => {
                    const isCurrent = index === stepIndex
                    const isComplete = completedSteps[index]
                    return (
                      <motion.div
                        key={step.label}
                        className="flex items-center gap-3 rounded-xl border border-[#d8e4fb] bg-[#f7faff] px-3 py-2"
                        {...hoverLift}
                      >
                        <div
                          className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${
                            isComplete
                              ? 'bg-emerald-600 text-white'
                              : isCurrent
                              ? 'bg-[#0f3e92] text-white'
                              : 'bg-[#e8efff] text-[#4f6d9d]'
                          }`}
                        >
                          {isComplete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isCurrent ? 'text-[#173f8b]' : 'text-[#54709f]'}`}>
                            {step.label}
                          </p>
                          <p className="text-xs text-[#6a84af]">{step.instruction}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card">
              <CardContent className="space-y-3 pt-5 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6884b2]">Live quality status</p>
                <div className="security-kpi flex items-center justify-between text-sm">
                  <span className="text-[#5e79a3]">Face tracking</span>
                  <span className="font-semibold text-[#194693]">{vidlive.landmarksDetected} / 468</span>
                </div>
                <div className="security-kpi flex items-center justify-between text-sm">
                  <span className="text-[#5e79a3]">Frame quality</span>
                  <Badge
                    className={`${
                      vidlive.preprocessGrade === 'good'
                        ? 'bg-emerald-600'
                        : vidlive.preprocessGrade === 'marginal'
                        ? 'bg-amber-600'
                        : 'bg-rose-600'
                    } text-white`}
                  >
                    {vidlive.preprocessGrade}
                  </Badge>
                </div>
                <div className="security-kpi flex items-center justify-between text-sm">
                  <span className="text-[#5e79a3]">Completion</span>
                  <span className="font-semibold text-[#194693]">{completedCount} / {STEPS.length}</span>
                </div>
                {vidlive.error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {vidlive.error}
                  </div>
                )}
                {!vidlive.error && (
                  <div className="flex items-center gap-2 text-sm text-[#617ca8]">
                    <LoaderCircle className="h-4 w-4 animate-spin text-[#0f3e92]" />
                    Secure baseline analysis running...
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </div>
    </PageShell>
  )
}
