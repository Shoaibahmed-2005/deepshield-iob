import React from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={s.page}>
      <Header />

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <p style={s.heroEyebrow}>Indian Overseas Bank</p>
          <h1 style={s.heroTitle}>Secure Internet Banking</h1>
          <p style={s.heroSub}>
            Experience world-class digital banking with AI-powered security and VID-LIVE
            deepfake protection.
          </p>
        </div>
      </section>

      {/* Login cards */}
      <section style={s.cardsSection}>
        <div style={s.cardsRow}>
          {/* Personal */}
          <div style={s.card}>
            <div style={s.cardIconWrap}>
              <span style={s.cardIcon}>👤</span>
            </div>
            <h2 style={s.cardTitle}>Personal Internet Banking</h2>
            <p style={s.cardDesc}>
              Manage your savings, current accounts, fixed deposits, and transfers securely
              from anywhere.
            </p>
            <button style={s.primaryBtn} onClick={() => navigate('/login')}>
              Login to Personal Banking
            </button>
            <p style={s.cardHint}>Protected by VID-LIVE™ Technology</p>
          </div>

          {/* Corporate — disabled */}
          <div style={{ ...s.card, ...s.cardDisabled }}>
            <div style={s.cardIconWrap}>
              <span style={s.cardIcon}>🏢</span>
            </div>
            <h2 style={{ ...s.cardTitle, color: 'var(--iob-muted)' }}>
              Corporate Internet Banking
            </h2>
            <p style={{ ...s.cardDesc, color: '#8FA8BF' }}>
              Advanced banking solutions for businesses, including bulk payments, trade finance,
              and cash management.
            </p>
            <button style={s.disabledBtn} disabled>
              Coming Soon
            </button>
            <p style={{ ...s.cardHint, color: '#8FA8BF' }}>
              Available for registered corporates
            </p>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section style={s.features}>
        <div style={s.featuresInner}>
          <FeatureTile icon="🔒" title="256-bit Encryption" desc="All your data is secured with military-grade TLS 1.3 encryption in transit and at rest." />
          <FeatureTile icon="🤖" title="AI-Powered Security" desc="Real-time threat detection powered by machine learning models trained on fraud patterns." />
          <FeatureTile icon="🎥" title="VID-LIVE Protected" desc="Our proprietary video-based liveness detection stops deepfakes and presentation attacks." />
        </div>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <p style={s.footerCopy}>
            © {new Date().getFullYear()} Indian Overseas Bank. All rights reserved.
          </p>
          <p style={s.footerToll}>Toll Free: 1800-890-4445 &nbsp;|&nbsp; Available 24×7</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureTile({ icon, title, desc }) {
  return (
    <div style={s.featureTile}>
      <span style={s.featureIcon}>{icon}</span>
      <h3 style={s.featureTitle}>{title}</h3>
      <p style={s.featureDesc}>{desc}</p>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--iob-bg)',
  },
  hero: {
    backgroundColor: 'var(--iob-blue)',
    background: 'linear-gradient(135deg, #003F7D 0%, #0057A8 60%, #1976D2 100%)',
    padding: '60px 24px',
    borderBottom: '4px solid var(--iob-gold)',
  },
  heroInner: {
    maxWidth: 800,
    margin: '0 auto',
    textAlign: 'center',
  },
  heroEyebrow: {
    color: 'var(--iob-gold)',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: 16,
  },
  heroSub: {
    color: '#A8C8F0',
    fontSize: 17,
    lineHeight: 1.6,
    maxWidth: 540,
    margin: '0 auto',
  },
  cardsSection: {
    padding: '48px 24px',
    maxWidth: 960,
    margin: '0 auto',
    width: '100%',
  },
  cardsRow: {
    display: 'flex',
    gap: 24,
    justifyContent: 'center',
  },
  card: {
    flex: '1 1 360px',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--iob-border)',
    borderRadius: 12,
    padding: '36px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxShadow: '0 2px 12px rgba(0,63,125,0.08)',
    gap: 14,
  },
  cardDisabled: {
    opacity: 0.65,
    background: '#F7FAFD',
  },
  cardIconWrap: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    backgroundColor: 'var(--iob-blue-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 30,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--iob-text)',
  },
  cardDesc: {
    fontSize: 14,
    color: 'var(--iob-muted)',
    lineHeight: 1.6,
  },
  primaryBtn: {
    backgroundColor: 'var(--iob-blue)',
    color: '#FFFFFF',
    border: '2px solid var(--iob-gold)',
    borderRadius: 6,
    padding: '12px 28px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    transition: 'background 0.2s',
    marginTop: 4,
  },
  disabledBtn: {
    backgroundColor: '#D0D8E4',
    color: '#8FA8BF',
    border: 'none',
    borderRadius: 6,
    padding: '12px 28px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'not-allowed',
    width: '100%',
    marginTop: 4,
  },
  cardHint: {
    fontSize: 11,
    color: 'var(--iob-muted)',
    letterSpacing: 0.3,
  },
  features: {
    backgroundColor: 'var(--iob-blue-dark)',
    padding: '48px 24px',
    marginTop: 'auto',
  },
  featuresInner: {
    maxWidth: 960,
    margin: '0 auto',
    display: 'flex',
    gap: 24,
    justifyContent: 'center',
  },
  featureTile: {
    flex: '1 1 260px',
    maxWidth: 300,
    textAlign: 'center',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  featureIcon: {
    fontSize: 36,
  },
  featureTitle: {
    color: 'var(--iob-gold)',
    fontSize: 15,
    fontWeight: 700,
  },
  featureDesc: {
    color: '#A8C8F0',
    fontSize: 13,
    lineHeight: 1.6,
  },
  footer: {
    backgroundColor: 'var(--iob-blue-dark)',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    padding: '20px 24px',
  },
  footerInner: {
    maxWidth: 960,
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerCopy: {
    color: '#6A8DB0',
    fontSize: 12,
  },
  footerToll: {
    color: 'var(--iob-gold)',
    fontSize: 12,
    fontWeight: 600,
  },
}
