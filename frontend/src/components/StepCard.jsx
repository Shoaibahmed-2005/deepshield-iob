import React from 'react'

const STATUS_STYLES = {
  Pending: { bg: '#F0F4F9', color: 'var(--iob-muted)', border: 'var(--iob-border)' },
  Running: { bg: '#E6F1FB', color: 'var(--iob-blue)', border: 'var(--iob-blue)' },
  Pass: { bg: '#E8F5E9', color: 'var(--iob-success)', border: '#A5D6A7' },
  Fail: { bg: '#FFEBEE', color: 'var(--iob-danger)', border: '#FFCDD2' },
}

export default function StepCard({ stepNumber, title, status = 'Pending', score = 0, maxScore = 25, detail }) {
  const ss = STATUS_STYLES[status] || STATUS_STYLES.Pending
  const pct = maxScore > 0 ? Math.min((score / maxScore) * 100, 100) : 0
  const barColor =
    status === 'Pass'
      ? 'var(--iob-success)'
      : status === 'Fail'
      ? 'var(--iob-danger)'
      : status === 'Running'
      ? 'var(--iob-blue)'
      : 'var(--iob-border)'

  return (
    <div style={styles.card}>
      <div style={styles.top}>
        <div style={styles.stepBadge}>{stepNumber}</div>
        <div style={styles.titleBlock}>
          <span style={styles.title}>{title}</span>
          <span
            style={{
              ...styles.statusBadge,
              backgroundColor: ss.bg,
              color: ss.color,
              borderColor: ss.border,
            }}
          >
            {status === 'Running' ? '◌ Running…' : status}
          </span>
        </div>
        <div style={styles.scoreText}>
          {score.toFixed ? score.toFixed(1) : score}/{maxScore}
        </div>
      </div>

      {/* Score bar */}
      <div style={styles.barTrack}>
        <div
          style={{
            ...styles.barFill,
            width: `${pct}%`,
            backgroundColor: barColor,
            transition: 'width 0.6s ease',
          }}
        />
      </div>

      {detail && <div style={styles.detail}>{detail}</div>}
    </div>
  )
}

const styles = {
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--iob-border)',
    borderRadius: 8,
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  top: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    backgroundColor: 'var(--iob-blue)',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleBlock: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--iob-text)',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 600,
    border: '1px solid',
    borderRadius: 10,
    padding: '1px 8px',
    alignSelf: 'flex-start',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--iob-text)',
    whiteSpace: 'nowrap',
  },
  barTrack: {
    height: 6,
    backgroundColor: 'var(--iob-bg)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  detail: {
    fontSize: 11,
    color: 'var(--iob-muted)',
    lineHeight: 1.4,
  },
}
