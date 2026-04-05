// ── PREPROCESSING ──────────────────────────────────────────────────────────
export function assessFrameQuality(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): {
  brightness: number
  contrast: number
  grade: 'good' | 'marginal' | 'poor'
} {
  const ctx = canvas.getContext('2d')
  if (!ctx) return { brightness: 50, contrast: 50, grade: 'good' }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  const luminances: number[] = []
  for (let i = 0; i < data.length; i += 40) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const Y = 0.299 * r + 0.587 * g + 0.114 * b
    luminances.push(Y)
  }

  if (luminances.length === 0) return { brightness: 50, contrast: 50, grade: 'good' }

  const mean = luminances.reduce((a, b) => a + b, 0) / luminances.length
  const variance =
    luminances.reduce((acc, v) => acc + (v - mean) ** 2, 0) / luminances.length
  const stdDev = Math.sqrt(variance)

  const brightness = Math.round((mean / 255) * 100)
  const contrast = Math.round(Math.min(100, (stdDev / 128) * 100))

  let grade: 'good' | 'marginal' | 'poor'
  if (brightness >= 35 && brightness <= 85 && contrast > 25) {
    grade = 'good'
  } else if ((brightness >= 20 && brightness < 35) || (contrast >= 15 && contrast <= 25)) {
    grade = 'marginal'
  } else {
    grade = 'poor'
  }

  return { brightness, contrast, grade }
}

// ── JITTER SCORE ────────────────────────────────────────────────────────────
export function calcJitterScore(
  history: { x: number; y: number }[][]
): number {
  if (history.length < 5) return 50

  const jawlineIndices = Array.from({ length: 17 }, (_, i) => i) // indices 0-16

  let totalDisplacement = 0
  let pairCount = 0

  for (let f = 1; f < history.length; f++) {
    const prev = history[f - 1]
    const curr = history[f]
    if (!prev || !curr) continue

    let frameDisplacement = 0
    let landmarkCount = 0

    for (const idx of jawlineIndices) {
      if (prev[idx] && curr[idx]) {
        const dx = curr[idx].x - prev[idx].x
        const dy = curr[idx].y - prev[idx].y
        frameDisplacement += Math.sqrt(dx * dx + dy * dy)
        landmarkCount++
      }
    }

    if (landmarkCount > 0) {
      totalDisplacement += frameDisplacement / landmarkCount
      pairCount++
    }
  }

  if (pairCount === 0) return 50

  const meanDisplacement = totalDisplacement / pairCount
  const jitterScore = Math.max(0, Math.min(100, 100 - meanDisplacement * 5000))
  return Math.round(jitterScore)
}

// ── REACTION SCORE ──────────────────────────────────────────────────────────
export function calcReactionScore(
  reactionMs: number,
  enrolledMeanMs: number
): number {
  if (enrolledMeanMs === 200) {
    // No enrolled profile — use absolute thresholds
    if (reactionMs < 100) return 50
    if (reactionMs < 500) return 90
    if (reactionMs < 800) return 60
    return 20
  }

  // Enrolled profile — compare deviation from baseline
  const deviation = Math.abs(reactionMs - enrolledMeanMs)
  // Human reaction to a screen prompt can naturally vary. Loosening these constraints:
  if (deviation < 300) return 95
  if (deviation < 500) return 75
  if (deviation < 700) return 40
  return 15
}

// ── PARALLAX SCORE ──────────────────────────────────────────────────────────
export function calcParallaxScore(
  yawRatioHistory: number[],
  enrolledYawMean: number
): number {
  if (yawRatioHistory.length < 10) return 50

  const mean = yawRatioHistory.reduce((a, b) => a + b, 0) / yawRatioHistory.length
  const variance =
    yawRatioHistory.reduce((acc, v) => acc + (v - mean) ** 2, 0) / yawRatioHistory.length

  let score: number
  if (variance > 0.010) {
    score = 95
  } else if (variance > 0.005) {
    score = 80
  } else if (variance > 0.002) {
    score = 60
  } else {
    score = 30
  }

  // Penalise if mean yaw deviates too much from enrolled baseline
  if (Math.abs(mean - enrolledYawMean) > 0.25) {
    score = Math.max(0, score - 15)
  }

  return Math.max(0, Math.min(100, score))
}

// ── TRUST SCORE ─────────────────────────────────────────────────────────────
export function calcTrustScore(
  jitter: number,
  reaction: number,
  parallax: number,
  grade: 'good' | 'marginal' | 'poor'
): {
  score: number
  status: 'GENUINE' | 'SUSPICIOUS' | 'FRAUDULENT' | 'RETRY'
  flags: string[]
} {
  if (grade === 'poor') {
    return { score: 0, status: 'RETRY', flags: ['Poor lighting — retry'] }
  }

  const weighted = jitter * 0.2 + reaction * 0.4 + parallax * 0.4
  const score = Math.round(weighted)

  const flags: string[] = []
  if (jitter < 40) flags.push('Landmark jitter detected at face boundaries')
  if (reaction < 40) flags.push('Reaction timing anomaly — possible virtual camera delay')
  if (parallax < 40) flags.push('Parallax anomaly — depth ratios inconsistent with real face')

  let status: 'GENUINE' | 'SUSPICIOUS' | 'FRAUDULENT'
  if (score > 74) status = 'GENUINE'
  else if (score >= 40) status = 'SUSPICIOUS'
  else status = 'FRAUDULENT'

  return { score, status, flags }
}

// ── HELPER: TOTAL DISPLACEMENT ───────────────────────────────────────────────
export function calcTotalDisplacement(
  history: { x: number; y: number }[][]
): number {
  if (history.length < 6) return 0

  const lastFrame = history[history.length - 1]
  const prevFrame = history[history.length - 6]

  if (!lastFrame || !prevFrame) return 0

  let totalDisplacement = 0
  let count = 0

  for (let i = 0; i < Math.min(lastFrame.length, prevFrame.length); i++) {
    if (lastFrame[i] && prevFrame[i]) {
      const dx = lastFrame[i].x - prevFrame[i].x
      const dy = lastFrame[i].y - prevFrame[i].y
      totalDisplacement += Math.sqrt(dx * dx + dy * dy)
      count++
    }
  }

  return count > 0 ? totalDisplacement / count : 0
}
