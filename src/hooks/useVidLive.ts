import { useRef, useState, useEffect } from 'react'
import { type UserProfile } from '@/store/userProfile'
import {
  assessFrameQuality,
  calcJitterScore,
  calcReactionScore,
  calcParallaxScore,
  calcTrustScore,
  calcTotalDisplacement,
} from '@/utils/detection'

// Tell TypeScript about MediaPipe globals from CDN
declare const FaceMesh: any
declare const Camera: any

export interface VidLiveState {
  // Status
  isLoaded: boolean
  error: string | null

  // Refs for video elements (attach to JSX)
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>

  // Live values
  landmarksDetected: number
  jitterScore: number
  reactionTimeMs: number | null
  yawRatio: number
  preprocessGrade: 'good' | 'marginal' | 'poor'
  preprocessBrightness: number
  preprocessContrast: number

  // Scores (all 0-100)
  preprocessScore: number
  jitterScoreVal: number
  reactionScore: number
  parallaxScore: number
  trustScore: number
  trustStatus: 'GENUINE' | 'SUSPICIOUS' | 'FRAUDULENT' | 'RETRY' | 'PENDING'
  trustFlags: string[]

  // Measurement validity — how many frames actually had a face
  totalFaceFrames: number

  // Controls
  startDetection: (deviceId?: string) => void
  stopDetection: () => void
  recordReactionTime: () => void
  resetScores: () => void
}

export function useVidLive(profile: UserProfile): VidLiveState {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const landmarkHistory = useRef<{ x: number; y: number }[][]>([])
  const yawHistory = useRef<number[]>([])
  const instructionShownAt = useRef<number | null>(null)
  const cameraRef = useRef<any>(null)
  const faceMeshRef = useRef<any>(null)

  // Stable refs to avoid stale closure issues
  const jitterScoreRef = useRef(50)
  const reactionScoreRef = useRef(50)
  const parallaxScoreRef = useRef(50)
  const preprocessGradeRef = useRef<'good' | 'marginal' | 'poor'>('good')

  // State for all scores
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [landmarksDetected, setLandmarksDetected] = useState(0)
  const [jitterScore, setJitterScore] = useState(50)
  const [reactionTimeMs, setReactionTimeMs] = useState<number | null>(null)
  const [yawRatio, setYawRatio] = useState(1.0)
  const [preprocessGrade, setPreprocessGrade] = useState<'good' | 'marginal' | 'poor'>('good')
  const [preprocessBrightness, setPreprocessBrightness] = useState(50)
  const [preprocessContrast, setPreprocessContrast] = useState(50)
  const [preprocessScore, setPreprocessScore] = useState(50)
  const [jitterScoreVal, setJitterScoreVal] = useState(50)
  const [reactionScore, setReactionScore] = useState(50)
  const [parallaxScore, setParallaxScore] = useState(50)
  const [trustScore, setTrustScore] = useState(50)
  const [trustStatus, setTrustStatus] = useState<'GENUINE' | 'SUSPICIOUS' | 'FRAUDULENT' | 'RETRY' | 'PENDING'>('PENDING')
  const [trustFlags, setTrustFlags] = useState<string[]>([])
  const [totalFaceFrames, setTotalFaceFrames] = useState(0)

  // Initialize MediaPipe FaceMesh on mount
  useEffect(() => {
    let cancelled = false

    const initFaceMesh = () => {
      try {
        if (typeof FaceMesh === 'undefined') {
          setTimeout(initFaceMesh, 500)
          return
        }

        const faceMesh = new FaceMesh({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        })

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })

        faceMesh.onResults((results: any) => {
          if (cancelled) return

          if (!results.multiFaceLandmarks?.[0]) {
            setLandmarksDetected(0)
            return
          }

          const lms = results.multiFaceLandmarks[0]
          setLandmarksDetected(lms.length)
          // Count frames where a real face was actually present
          setTotalFaceFrames((prev) => prev + 1)

          // Store landmark history (keep last 30 frames)
          const simplified = lms.map((l: any) => ({ x: l.x, y: l.y }))
          landmarkHistory.current.push(simplified)
          if (landmarkHistory.current.length > 30) landmarkHistory.current.shift()

          // Calculate yaw ratio every frame
          // noseTip=1, leftEar=234, rightEar=454
          const nose = lms[1]
          const lEar = lms[234]
          const rEar = lms[454]
          const dLeft = Math.hypot(nose.x - lEar.x, nose.y - lEar.y)
          const dRight = Math.hypot(nose.x - rEar.x, nose.y - rEar.y)
          const yaw = dLeft / (dRight + 0.0001)
          setYawRatio(parseFloat(yaw.toFixed(3)))
          yawHistory.current.push(yaw)
          if (yawHistory.current.length > 60) yawHistory.current.shift()

          // Draw landmarks on canvas overlay
          if (canvasRef.current && videoRef.current) {
            drawLandmarksOnCanvas(canvasRef.current, lms, videoRef.current)
          }

          // PREPROCESSING assessment
          if (videoRef.current && canvasRef.current) {
            const quality = assessFrameQuality(videoRef.current, canvasRef.current)
            setPreprocessGrade(quality.grade)
            preprocessGradeRef.current = quality.grade
            setPreprocessBrightness(quality.brightness)
            setPreprocessContrast(quality.contrast)
            const pScore =
              quality.grade === 'good' ? 90 : quality.grade === 'marginal' ? 55 : 20
            setPreprocessScore(pScore)
          }

          // JITTER SCORE
          if (landmarkHistory.current.length >= 5) {
            const j = calcJitterScore(landmarkHistory.current)
            setJitterScoreVal(j)
            setJitterScore(j)
            jitterScoreRef.current = j
          }

          // REACTION TIMING
          if (instructionShownAt.current !== null) {
            const displacement = calcTotalDisplacement(landmarkHistory.current)
            if (displacement > 0.008) {
              const rt = performance.now() - instructionShownAt.current
              setReactionTimeMs(Math.round(rt))
              const rs = calcReactionScore(rt, profile.reactionMeanMs)
              setReactionScore(rs)
              reactionScoreRef.current = rs
              instructionShownAt.current = null
            }
          }

          // PARALLAX SCORE
          if (yawHistory.current.length >= 10) {
            const ps = calcParallaxScore(yawHistory.current, profile.parallaxYawMean)
            setParallaxScore(ps)
            parallaxScoreRef.current = ps
          }

          // TRUST SCORE (recalculate every frame using stable refs)
          const ts = calcTrustScore(
            jitterScoreRef.current,
            reactionScoreRef.current,
            parallaxScoreRef.current,
            preprocessGradeRef.current
          )
          setTrustScore(ts.score)
          setTrustStatus(ts.status)
          setTrustFlags(ts.flags)
        })

        faceMeshRef.current = faceMesh
        if (!cancelled) setIsLoaded(true)
      } catch {
        if (!cancelled) setError('MediaPipe failed to load. Check internet connection.')
      }
    }

    initFaceMesh()
    return () => { cancelled = true }
  }, [profile.reactionMeanMs, profile.parallaxYawMean])

  // startDetection: attach camera to facemesh
  const startDetection = (deviceId?: string) => {
    if (!videoRef.current || !faceMeshRef.current) return

    if (deviceId) {
      // ── Specific device (e.g. OBS Virtual Camera in hacker mode) ──────────
      // The MediaPipe Camera utility always opens the DEFAULT camera internally.
      // That would mismatch when the user selects a virtual camera.
      // Fix: get the stream ourselves, then drive the MediaPipe loop manually
      // via requestAnimationFrame so analysis always uses the RIGHT stream.
      navigator.mediaDevices
        .getUserMedia({
          video: { deviceId: { exact: deviceId }, width: 640, height: 480 },
        })
        .then((stream) => {
          if (!videoRef.current) return
          videoRef.current.srcObject = stream
          videoRef.current.play().then(() => {
            let active = true
            const loop = async () => {
              if (!active || !videoRef.current || !faceMeshRef.current) return
              if (videoRef.current.readyState >= 2) {
                try {
                  await faceMeshRef.current.send({ image: videoRef.current })
                } catch {
                  // ignore individual frame errors
                }
              }
              requestAnimationFrame(loop)
            }
            loop()
            // Expose a .stop() so stopDetection() works identically
            cameraRef.current = {
              stop: () => {
                active = false
                stream.getTracks().forEach((t) => t.stop())
              },
            }
          })
        })
        .catch(() => {
          setError('Could not access selected camera device.')
        })
    } else {
      // ── Default camera: let MediaPipe Camera utility handle everything ─────
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && faceMeshRef.current) {
            await faceMeshRef.current.send({ image: videoRef.current })
          }
        },
        width: 640,
        height: 480,
      })
      camera.start()
      cameraRef.current = camera
    }
  }

  const stopDetection = () => {
    cameraRef.current?.stop()
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((t) => t.stop())
    }
  }

  const recordReactionTime = () => {
    instructionShownAt.current = performance.now()
  }

  const resetScores = () => {
    landmarkHistory.current = []
    yawHistory.current = []
    instructionShownAt.current = null
    jitterScoreRef.current = 50
    reactionScoreRef.current = 50
    parallaxScoreRef.current = 50
    preprocessGradeRef.current = 'good'
    setReactionTimeMs(null)
    setReactionScore(50)
    setParallaxScore(50)
    setJitterScoreVal(50)
    setJitterScore(50)
    setTrustScore(50)
    setTrustStatus('PENDING')
    setTrustFlags([])
    setTotalFaceFrames(0)
  }

  return {
    isLoaded,
    error,
    videoRef,
    canvasRef,
    landmarksDetected,
    jitterScore,
    reactionTimeMs,
    yawRatio,
    preprocessGrade,
    preprocessBrightness,
    preprocessContrast,
    preprocessScore,
    jitterScoreVal,
    reactionScore,
    parallaxScore,
    trustScore,
    trustStatus,
    trustFlags,
    totalFaceFrames,
    startDetection,
    stopDetection,
    recordReactionTime,
    resetScores,
  }
}

// ── CANVAS DRAWING HELPER ────────────────────────────────────────────────────
function drawLandmarksOnCanvas(
  canvas: HTMLCanvasElement,
  landmarks: any[],
  video: HTMLVideoElement
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = video.videoWidth || 640
  canvas.height = video.videoHeight || 480
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const w = canvas.width
  const h = canvas.height

  // Draw all 468 landmarks as tiny green dots
  ctx.fillStyle = 'rgba(0, 255, 100, 0.6)'
  landmarks.forEach((lm: any) => {
    ctx.beginPath()
    ctx.arc(lm.x * w, lm.y * h, 1.2, 0, Math.PI * 2)
    ctx.fill()
  })

  // Key landmarks — larger cyan dots
  const keyPoints = [1, 33, 263, 152, 234, 454, 10, 338]
  ctx.fillStyle = 'rgba(0, 220, 255, 0.9)'
  keyPoints.forEach((idx) => {
    if (landmarks[idx]) {
      ctx.beginPath()
      ctx.arc(landmarks[idx].x * w, landmarks[idx].y * h, 3.5, 0, Math.PI * 2)
      ctx.fill()
    }
  })

  // Draw jawline connection
  const jawline = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 172, 136, 150, 149, 176, 148, 152]
  ctx.strokeStyle = 'rgba(0, 255, 100, 0.4)'
  ctx.lineWidth = 1
  ctx.beginPath()
  jawline.forEach((idx, i) => {
    if (!landmarks[idx]) return
    const x = landmarks[idx].x * w
    const y = landmarks[idx].y * h
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  })
  ctx.stroke()
}
