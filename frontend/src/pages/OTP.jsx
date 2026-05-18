import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../App'
import { authApi } from '../api'

const OTP_LENGTH = 6
const RESEND_COUNTDOWN = 60

export default function OTP() {
  const navigate = useNavigate()
  const { loginState, authenticate } = useAuth()

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN)
  const [resending, setResending] = useState(false)

  const inputRefs = useRef([])

  // Redirect if no login state
  useEffect(() => {
    if (!loginState) navigate('/login')
  }, [loginState, navigate])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  function handleDigitChange(index, value) {
    const cleaned = value.replace(/\D/g, '').slice(0, 1)
    const next = [...digits]
    next[index] = cleaned
    setDigits(next)
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus()
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    const next = Array(OTP_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIdx]?.focus()
  }

  async function handleVerify(e) {
    e.preventDefault()
    const otp = digits.join('')
    if (otp.length < OTP_LENGTH) {
      setError('Please enter all 6 digits of your OTP.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await authApi.verifyOtp(loginState.customer_id, otp)
      await authenticate(res.data.access_token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.')
      setDigits(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (countdown > 0 || resending) return
    setResending(true)
    try {
      await authApi.login(loginState.customer_id, '__resend__')
    } catch {
      // ignore — we'd need the password again in real use
    } finally {
      setCountdown(RESEND_COUNTDOWN)
      setResending(false)
      setDigits(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    }
  }

  if (!loginState) return null

  return (
    <div style={s.page}>
      <Header />

      <div style={s.container}>
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h1 style={s.title}>OTP Verification</h1>
            <p style={s.subtitle}>
              A 6-digit OTP has been sent to{' '}
              <strong style={s.phoneHighlight}>{loginState.phone_hint}</strong>
            </p>
            <p style={s.terminalNote}>
              (Check the backend terminal for the OTP during demo)
            </p>
          </div>

          <form style={s.form} onSubmit={handleVerify} noValidate>
            <div style={s.otpRow}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  style={s.otpBox}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && (
              <div style={s.errorBox}>
                <span>⚠</span> {error}
              </div>
            )}

            <button style={s.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>

            <div style={s.resendRow}>
              {countdown > 0 ? (
                <span style={s.resendTimer}>
                  Resend OTP in <strong>{countdown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  style={s.resendBtn}
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? 'Sending…' : 'Resend OTP'}
                </button>
              )}
            </div>
          </form>
        </div>

        <button style={s.backLink} onClick={() => navigate('/login')}>
          ← Back to Login
        </button>
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
    textAlign: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 8,
  },
  subtitle: {
    color: '#A8C8F0',
    fontSize: 14,
    lineHeight: 1.5,
  },
  phoneHighlight: {
    color: 'var(--iob-gold)',
  },
  terminalNote: {
    color: '#7AAAD0',
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic',
  },
  form: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    alignItems: 'center',
  },
  otpRow: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
  },
  otpBox: {
    width: 48,
    height: 56,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 700,
    border: '2px solid var(--iob-border)',
    borderRadius: 8,
    color: 'var(--iob-text)',
    outline: 'none',
    transition: 'border-color 0.2s',
    caretColor: 'transparent',
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
    width: '100%',
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
    transition: 'background 0.2s',
  },
  resendRow: {
    textAlign: 'center',
    fontSize: 13,
  },
  resendTimer: {
    color: 'var(--iob-muted)',
  },
  resendBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--iob-blue)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: 'var(--iob-muted)',
    fontSize: 13,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
}
