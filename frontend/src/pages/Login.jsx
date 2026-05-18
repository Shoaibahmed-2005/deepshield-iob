import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../App'
import { authApi } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [customerId, setCustomerId] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!customerId.trim() || !password) {
      setError('Please enter both Customer ID and Password.')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.login(customerId.trim(), password)
      login(customerId.trim(), res.data.phone_hint)
      navigate('/otp')
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <Header />

      <div style={s.container}>
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h1 style={s.title}>Personal Internet Banking</h1>
            <p style={s.subtitle}>Login to your IOB account</p>
          </div>

          <form style={s.form} onSubmit={handleSubmit} noValidate>
            <div style={s.fieldGroup}>
              <label style={s.label} htmlFor="customerId">Customer ID</label>
              <input
                id="customerId"
                style={s.input}
                type="text"
                placeholder="e.g. IOB2024001"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label} htmlFor="password">Password</label>
              <div style={s.pwdWrap}>
                <input
                  id="password"
                  style={{ ...s.input, paddingRight: 44 }}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  style={s.eyeBtn}
                  onClick={() => setShowPwd((v) => !v)}
                  tabIndex={-1}
                >
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div style={s.errorBox}>
                <span>⚠</span> {error}
              </div>
            )}

            <button style={s.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Verifying…' : 'Login'}
            </button>

            <p style={s.secureNote}>🔒 Secured by VID-LIVE™ Technology</p>
          </form>

          <div style={s.cardFooter}>
            <a href="#" style={s.link} onClick={(e) => e.preventDefault()}>
              Forgot Customer ID?
            </a>
            <span style={s.sep}>|</span>
            <a href="#" style={s.link} onClick={(e) => e.preventDefault()}>
              Reset Password
            </a>
          </div>
        </div>

        <div style={s.notice}>
          <strong>⚠ Security Notice:</strong> IOB will never ask for your OTP, password, or card
          details over phone or email. Never share these with anyone.
        </div>
      </div>
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
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    gap: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--iob-border)',
    borderRadius: 12,
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0,63,125,0.12)',
  },
  cardHeader: {
    backgroundColor: 'var(--iob-blue)',
    padding: '28px 32px 24px',
    borderBottom: '3px solid var(--iob-gold)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    color: '#A8C8F0',
    fontSize: 13,
  },
  form: {
    padding: '28px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--iob-text)',
  },
  input: {
    border: '1px solid var(--iob-border)',
    borderRadius: 6,
    padding: '10px 14px',
    fontSize: 14,
    color: 'var(--iob-text)',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s',
  },
  pwdWrap: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    padding: 4,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    border: '1px solid #FFCDD2',
    color: 'var(--iob-danger)',
    borderRadius: 6,
    padding: '10px 14px',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  submitBtn: {
    backgroundColor: 'var(--iob-blue)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 6,
    padding: '12px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    marginTop: 4,
    transition: 'background 0.2s',
  },
  secureNote: {
    textAlign: 'center',
    fontSize: 11,
    color: 'var(--iob-muted)',
    marginTop: -4,
  },
  cardFooter: {
    borderTop: '1px solid var(--iob-border)',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'var(--iob-bg)',
  },
  link: {
    color: 'var(--iob-blue)',
    fontSize: 13,
  },
  sep: {
    color: 'var(--iob-border)',
    fontSize: 13,
  },
  notice: {
    maxWidth: 420,
    backgroundColor: '#FFF8E1',
    border: '1px solid var(--iob-gold)',
    borderRadius: 8,
    padding: '12px 16px',
    fontSize: 12,
    color: '#5C4500',
    lineHeight: 1.5,
    width: '100%',
  },
}
