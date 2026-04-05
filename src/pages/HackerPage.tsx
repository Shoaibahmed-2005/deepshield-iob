import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// ── IOB DeepShield Header (dark variant) ─────────────────────────────────────
function IOBHeaderDark() {
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
              />
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ color: '#C8102E', fontWeight: 700, fontSize: 18 }}>DeepShield</span>
          </div>
          <Badge
            className="text-xs font-bold animate-pulse"
            style={{ backgroundColor: '#DC2626', color: 'white', border: 'none' }}
          >
            ⚠ HACKER MODE
          </Badge>
        </div>
        <div style={{ color: '#FFD700', fontStyle: 'italic', fontSize: 13 }}>
          Good People to Grow With
        </div>
      </div>
      <div style={{ height: 3, backgroundColor: '#C8102E' }} />
    </div>
  )
}

interface DeviceInfo {
  deviceId: string
  label: string
  isVirtual: boolean
}

const VIRTUAL_KEYWORDS = ['obs', 'virtual', 'manycam', 'xsplit', 'snap camera', 'fake', 'vcam', 'droidcam']

export default function HackerPage() {
  const navigate = useNavigate()
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [selectedIsVirtual, setSelectedIsVirtual] = useState(false)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    enumerateCameras()
  }, [])

  async function enumerateCameras() {
    try {
      // Request permission first so labels are populated
      await navigator.mediaDevices.getUserMedia({ video: true })
      const all = await navigator.mediaDevices.enumerateDevices()
      const videos = all.filter((d) => d.kind === 'videoinput')
      const deviceList: DeviceInfo[] = videos.map((d) => {
        const label = d.label || `Camera ${d.deviceId.slice(0, 8)}`
        const isVirtual = VIRTUAL_KEYWORDS.some((kw) => label.toLowerCase().includes(kw))
        return { deviceId: d.deviceId, label, isVirtual }
      })
      setDevices(deviceList)
      if (deviceList.length > 0) {
        selectDevice(deviceList[0])
      }
    } catch {
      // Camera permission denied or not available
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: deviceId ? { exact: deviceId } : undefined },
      })
      streamRef.current = stream
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
        videoPreviewRef.current.play()
      }
    } catch {
      // Preview failed silently
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const attackSteps = [
    {
      step: 'STEP 1',
      icon: '📷',
      title: 'Webcam Captures Hacker',
      body: 'Real camera records the attacker\'s actual face normally. This is the only genuine part of the feed.',
      highlight: null,
    },
    {
      step: 'STEP 2',
      icon: '🔄',
      title: 'DeepFaceLive Swaps Face',
      body: 'Open-source tool replaces hacker\'s face with victim\'s in real-time. Introduces ~50-80ms delay — this is DeepShield\'s key detection signal.',
      highlight: { text: 'Processing delay: 50-80ms', color: '#7F1D1D', border: '#EF4444' },
    },
    {
      step: 'STEP 3',
      icon: '💻',
      title: 'OBS Creates Virtual Camera',
      body: 'Operating system registers fake camera as real device. Browser shows it alongside real cameras — cannot tell the difference.',
      highlight: null,
    },
    {
      step: 'STEP 4',
      icon: '🏦',
      title: 'Bank Sees Victim\'s Face',
      body: 'Authentication receives deepfaked stream. Traditional systems fail here. DeepShield detects the physics anomalies and processing artifacts.',
      highlight: { text: 'DeepShield catches it here ↓', color: '#14532D', border: '#22C55E' },
    },
  ]

  return (
    <div style={{ backgroundColor: '#0F172A', minHeight: '100vh' }}>
      <IOBHeaderDark />

      {/* Warning banner */}
      <div
        className="text-center py-3 px-4"
        style={{ backgroundColor: '#7F1D1D', borderBottom: '1px solid #EF4444' }}
      >
        <p className="text-white font-semibold text-sm">
          ⚠️ EDUCATIONAL SIMULATION — Hackathon Demo Only
        </p>
        <p className="text-red-300 text-xs mt-0.5">
          This page demonstrates how deepfake attacks work so you understand what DeepShield protects against
        </p>
      </div>

      {/* Main content */}
      <div className="px-8 py-6 max-w-7xl mx-auto grid grid-cols-2 gap-8">
        {/* LEFT: Attack Pipeline */}
        <div>
          <h2 className="text-white text-xl font-bold mb-1">How Hackers Bypass Traditional Auth</h2>
          <p className="text-gray-400 text-sm mb-6">Real-time face swap attack</p>

          <div className="relative">
            {/* Vertical connector line */}
            <div
              className="absolute"
              style={{
                left: 20,
                top: 40,
                bottom: 40,
                width: 2,
                backgroundColor: '#334155',
                zIndex: 0,
              }}
            />

            <div className="space-y-4 relative">
              {attackSteps.map((step, i) => (
                <div key={i} className="relative flex gap-4">
                  {/* Step number circle */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 z-10"
                    style={{ backgroundColor: '#1E293B', border: '2px solid #475569', color: '#94A3B8' }}
                  >
                    {i + 1}
                  </div>

                  {/* Card */}
                  <div
                    className="flex-1 rounded-xl p-4"
                    style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className="text-xs"
                        style={{ backgroundColor: '#334155', color: '#94A3B8', border: 'none' }}
                      >
                        {step.step}
                      </Badge>
                      <span className="text-2xl leading-none">{step.icon}</span>
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-1">{step.title}</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">{step.body}</p>
                    {step.highlight && (
                      <div
                        className="mt-2 rounded px-3 py-1.5 text-xs font-semibold"
                        style={{
                          backgroundColor: step.highlight.color,
                          border: `1px solid ${step.highlight.border}`,
                          color: 'white',
                        }}
                      >
                        {step.highlight.text}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Live Camera Detection */}
        <div>
          <Card style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}>
            <CardContent className="pt-6">
              <h3 className="text-white font-semibold mb-1">Select Camera Device</h3>
              <p className="text-gray-400 text-sm mb-4">See how virtual cameras appear to browsers</p>

              {/* Camera list */}
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {devices.length === 0 ? (
                  <div className="text-gray-500 text-sm py-4 text-center">
                    No cameras found. Allow camera access to see devices.
                  </div>
                ) : (
                  devices.map((device) => (
                    <div
                      key={device.deviceId}
                      onClick={() => selectDevice(device)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-all"
                      style={{
                        backgroundColor:
                          selectedDeviceId === device.deviceId
                            ? device.isVirtual
                              ? '#450A0A'
                              : '#0C2D1A'
                            : device.isVirtual
                            ? '#1F0A0A'
                            : '#1E293B',
                        border:
                          selectedDeviceId === device.deviceId
                            ? `1.5px solid ${device.isVirtual ? '#EF4444' : '#22C55E'}`
                            : '1.5px solid #334155',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm"
                          style={{
                            color: device.isVirtual ? '#EF4444' : '#22C55E',
                            animation: device.isVirtual ? 'pulse 1s infinite' : 'none',
                          }}
                        >
                          {device.isVirtual ? '●' : '●'}
                        </span>
                        <span className="text-white text-sm truncate max-w-[200px]">
                          {device.label}
                        </span>
                      </div>
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: device.isVirtual ? '#DC2626' : '#16A34A',
                          color: 'white',
                          border: 'none',
                        }}
                      >
                        {device.isVirtual ? '⚠ VIRTUAL' : 'REAL'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>

              {/* Video preview */}
              <div className="rounded-lg overflow-hidden mb-4" style={{ border: '1px solid #334155' }}>
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    maxHeight: 160,
                    objectFit: 'cover',
                    display: 'block',
                    transform: 'scaleX(-1)',
                  }}
                />
              </div>

              {/* Detection status */}
              {selectedDeviceId && (
                <div
                  className="rounded-lg p-3 mb-4"
                  style={{
                    backgroundColor: selectedIsVirtual ? '#7F1D1D' : '#14532D',
                    border: `1px solid ${selectedIsVirtual ? '#EF4444' : '#22C55E'}`,
                    animation: selectedIsVirtual ? 'pulse 2s infinite' : 'none',
                  }}
                >
                  {selectedIsVirtual ? (
                    <>
                      <p className="text-white font-semibold text-sm">⚠ Virtual Camera Detected</p>
                      <p className="text-red-300 text-xs mt-1">Attack pipeline likely active</p>
                      <p className="text-red-300 text-xs">DeepShield will flag this session</p>
                    </>
                  ) : (
                    <>
                      <p className="text-white font-semibold text-sm">✓ Real Camera Detected</p>
                      <p className="text-green-300 text-xs mt-1">
                        Standard authentication — no threat detected
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Launch button */}
              <Button
                className="w-full font-bold text-white h-11 mb-2"
                style={{
                  backgroundColor: '#DC2626',
                  border: '2px solid #EF4444',
                  animation: 'pulse 2s infinite',
                }}
                onClick={() =>
                  navigate('/auth', {
                    state: { isHackerMode: true, deviceId: selectedDeviceId },
                  })
                }
              >
                Launch IOB Login — Hacker Mode →
              </Button>

              <p className="text-gray-500 text-xs text-center mb-3">
                Watch the DeepShield detection panel catch the deepfake in real time
              </p>

              <Button
                variant="outline"
                className="w-full"
                style={{ borderColor: '#475569', color: 'white', backgroundColor: 'transparent' }}
                onClick={() => navigate('/auth', { state: {} })}
              >
                ← Genuine User Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
