import React, { useEffect, useRef } from 'react'

/**
 * Animated circular trust-score meter drawn on a canvas.
 * Props:
 *   score   — 0-100
 *   size    — canvas size in px (default 180)
 *   animate — whether to animate fill-in (default true)
 */
export default function TrustMeter({ score = 0, size = 180, animate = true }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  const isPass = score >= 70
  const arcColor = isPass ? 'var(--iob-success)' : 'var(--iob-danger)'
  const label = isPass ? 'VERIFIED' : 'FAILED'
  const labelColor = isPass ? '#1B6B3A' : '#B71C1C'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 16
    const lineWidth = 14
    const startAngle = -Math.PI / 2
    const target = (score / 100) * 2 * Math.PI

    let current = 0
    const step = target / 60

    function draw(angle) {
      ctx.clearRect(0, 0, size, size)

      // Track
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI)
      ctx.strokeStyle = '#E0E9F4'
      ctx.lineWidth = lineWidth
      ctx.stroke()

      // Fill arc
      ctx.beginPath()
      ctx.arc(cx, cy, radius, startAngle, startAngle + angle)
      ctx.strokeStyle = isPass ? '#1B6B3A' : '#B71C1C'
      ctx.lineWidth = lineWidth
      ctx.lineCap = 'round'
      ctx.stroke()

      // Score text
      ctx.fillStyle = '#1A2B4A'
      ctx.font = `bold ${Math.floor(size / 4.5)}px 'Noto Sans', sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(Math.round((angle / (2 * Math.PI)) * 100), cx, cy - 10)

      // Label text
      ctx.fillStyle = labelColor
      ctx.font = `600 ${Math.floor(size / 10)}px 'Noto Sans', sans-serif`
      ctx.fillText(label, cx, cy + Math.floor(size / 6))
    }

    if (animate) {
      function frame() {
        current = Math.min(current + step, target)
        draw(current)
        if (current < target) {
          animRef.current = requestAnimationFrame(frame)
        }
      }
      animRef.current = requestAnimationFrame(frame)
    } else {
      draw(target)
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [score, size, animate, isPass, label, labelColor])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block' }}
    />
  )
}
