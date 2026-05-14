import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Camera,
  CircleAlert,
  Monitor,
  Shield,
  ShieldAlert,
  Webcam,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageShell } from '@/components/layout/PageShell'
import { fadeInUp, hoverLift } from '@/lib/motion'

interface DeviceInfo {
  deviceId: string
  label: string
  isVirtual: boolean
}

const VIRTUAL_KEYWORDS = ['obs', 'virtual', 'manycam', 'xsplit', 'snap camera', 'fake', 'vcam', 'droidcam']

const attackSteps = [
  {
    title: 'Capture Input',
    description: 'Camera feed enters the attacker workstation as a normal live stream.',
    icon: Camera,
  },
  {
    title: 'Real-time Face Swap',
    description: 'A synthesis tool introduces temporal delay and subtle rendering artifacts.',
    icon: Monitor,
  },
  {
    title: 'Virtual Camera Injection',
    description: 'The manipulated feed is exposed to the browser as a standard camera device.',
    icon: Webcam,
  },
  {
    title: 'DeepShield Defense',
    description: 'Timing, depth, and consistency checks identify risk and block the session.',
    icon: ShieldAlert,
  },
]

export default function HackerPage() {
  const navigate = useNavigate()
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [selectedIsVirtual, setSelectedIsVirtual] = useState(false)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    enumerateCameras()
  }, [])

  async function enumerateCameras() {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      const all = await navigator.mediaDevices.enumerateDevices()
      const videos = all.filter((d) => d.kind === 'videoinput')
      const mapped: DeviceInfo[] = videos.map((d) => {
        const label = d.label || `Camera ${d.deviceId.slice(0, 8)}`
        const isVirtual = VIRTUAL_KEYWORDS.some((kw) => label.toLowerCase().includes(kw))
        return { deviceId: d.deviceId, label, isVirtual }
      })
      setDevices(mapped)
      if (mapped.length > 0) selectDevice(mapped[0])
    } catch {
      setDevices([])
    }
  }

  function selectDevice(device: DeviceInfo) {
    setSelectedDeviceId(device.deviceId)
    setSelectedIsVirtual(device.isVirtual)
    startPreview(device.deviceId)
  }

  async function startPreview(deviceId: string) {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: deviceId ? { exact: deviceId } : undefined },
      })
      streamRef.current = stream
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
        await videoPreviewRef.current.play()
      }
    } catch {
      // ignore preview failure
    }
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <PageShell
      dark
      backTo="/"
      backLabel="Home"
      rightSlot={<Badge className="bg-rose-600 text-white">Educational security simulation</Badge>}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.section
          className="mb-5 rounded-2xl border border-rose-500/40 bg-rose-950/40 px-4 py-3"
          {...fadeInUp}
        >
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 text-rose-300" />
            <div>
              <p className="text-sm font-semibold text-rose-200">Security simulation environment</p>
              <p className="text-sm text-rose-200/80">
                This page demonstrates spoofing paths and how DeepShield identifies suspicious sessions.
              </p>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <motion.section className="space-y-4" {...fadeInUp}>
            <Card className="border border-slate-700/70 bg-slate-900/70">
              <CardContent className="pt-5 pb-5">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Attack timeline overview</h2>
                  <Badge className="bg-slate-700 text-slate-100">4 phases</Badge>
                </div>
                <div className="space-y-3">
                  {attackSteps.map((step, index) => (
                    <motion.div
                      key={step.title}
                      className="rounded-xl border border-slate-700 bg-slate-900/90 p-4"
                      {...hoverLift}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <step.icon className="h-4 w-4 text-cyan-300" />
                          <h3 className="text-sm font-semibold text-slate-100">{step.title}</h3>
                        </div>
                        <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-200">
                          0{index + 1}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">{step.description}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section className="space-y-4" {...fadeInUp}>
            <Card className="border border-slate-700/70 bg-slate-900/70">
              <CardContent className="pt-5 pb-5">
                <h2 className="text-lg font-semibold text-white">Camera feed comparison</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Select a camera device and launch authentication under simulation mode.
                </p>

                <div className="mt-4 space-y-2">
                  {devices.length === 0 && (
                    <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-slate-300">
                      No camera devices available. Please allow camera access.
                    </div>
                  )}
                  {devices.map((device) => {
                    const selected = selectedDeviceId === device.deviceId
                    return (
                      <button
                        key={device.deviceId}
                        type="button"
                        onClick={() => selectDevice(device)}
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                          selected
                            ? device.isVirtual
                              ? 'border-rose-400 bg-rose-900/35'
                              : 'border-emerald-400 bg-emerald-900/25'
                            : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${device.isVirtual ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                          <span className="max-w-[220px] truncate text-sm text-slate-100">{device.label}</span>
                        </div>
                        <Badge className={device.isVirtual ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}>
                          {device.isVirtual ? 'Virtual' : 'Real'}
                        </Badge>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-slate-700">
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className="aspect-video w-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                </div>

                {selectedDeviceId && (
                  <div
                    className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
                      selectedIsVirtual
                        ? 'border-rose-400/50 bg-rose-900/40 text-rose-200'
                        : 'border-emerald-400/50 bg-emerald-900/30 text-emerald-200'
                    }`}
                  >
                    {selectedIsVirtual
                      ? 'Virtual camera selected: DeepShield should flag this session as high risk.'
                      : 'Real camera selected: Session should appear as a genuine login attempt.'}
                  </div>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Button
                    variant="danger"
                    size="lg"
                    className="w-full"
                    onClick={() =>
                      navigate('/auth', {
                        state: { isHackerMode: true, deviceId: selectedDeviceId },
                      })
                    }
                  >
                    Launch Simulation Login
                  </Button>
                  <Button variant="outline" size="lg" className="w-full bg-transparent text-slate-200 hover:bg-slate-800" onClick={() => navigate('/auth', { state: {} })}>
                    Launch Genuine Login
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-700/70 bg-slate-900/70">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-cyan-300" />
                  <p className="text-sm font-semibold text-slate-100">What DeepShield evaluates</p>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-300">
                  <p>- Response timing latency patterns</p>
                  <p>- Depth consistency across movement</p>
                  <p>- Temporal stability and frame quality</p>
                  <p>- Face boundary artifact behavior</p>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </div>
    </PageShell>
  )
}
