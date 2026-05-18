import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../App'
import { useTxn } from '../App'
import { transactionsApi } from '../api'

function formatIndianCurrency(amount) {
  const num = parseFloat(amount)
  if (isNaN(num)) return ''
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Transfer() {
  const navigate = useNavigate()
  const { customer } = useAuth()
  const { setPendingTxn } = useTxn()

  const [form, setForm] = useState({
    receiverAccount: '',
    confirmAccount: '',
    amount: '',
    remarks: '',
    mode: 'IMPS',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const amount = parseFloat(form.amount) || 0
  const isHighValue = amount >= 50000

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setError('')
    setSuccessMsg('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!form.receiverAccount.trim()) {
      setError('Please enter the beneficiary account number.')
      return
    }
    if (form.receiverAccount !== form.confirmAccount) {
      setError('Account numbers do not match. Please re-enter.')
      return
    }
    if (!amount || amount <= 0) {
      setError('Please enter a valid transfer amount.')
      return
    }
    if (amount > parseFloat(customer.balance)) {
      setError('Insufficient balance for this transaction.')
      return
    }

    setLoading(true)
    try {
      const res = await transactionsApi.transfer(
        form.receiverAccount.trim(),
        amount,
        form.remarks.trim()
      )
      const data = res.data

      if (data.vidlive_required) {
        setPendingTxn({
          transaction_id: data.transaction_id,
          session_id: data.session_id,
          amount,
          receiver_account: form.receiverAccount,
        })
        navigate('/vidlive')
      } else {
        setSuccessMsg(data.message || 'Transfer successful.')
        setForm({ receiverAccount: '', confirmAccount: '', amount: '', remarks: '', mode: 'IMPS' })
      }
    } catch (err) {
      setError(err.message || 'Transfer failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <Header showLogout />

      <div style={s.body}>
        <Sidebar />

        <main style={s.main}>
          <div style={s.breadcrumb}>
            <button style={s.backBtn} onClick={() => navigate('/dashboard')}>
              ← Dashboard
            </button>
            <span style={s.sep}>/</span>
            <span style={s.breadCurrent}>Fund Transfer</span>
          </div>

          <div style={s.card}>
            <div style={s.cardHeader}>
              <h1 style={s.title}>Fund Transfer — NEFT / IMPS</h1>
              <p style={s.subtitle}>Transfer funds to any IOB or other bank account</p>
            </div>

            <form style={s.form} onSubmit={handleSubmit} noValidate>
              {/* Mode selection */}
              <div style={s.modeRow}>
                {['IMPS', 'NEFT', 'RTGS'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    style={{
                      ...s.modeBtn,
                      ...(form.mode === m ? s.modeBtnActive : {}),
                      ...(m !== 'IMPS' ? s.modeBtnDisabled : {}),
                    }}
                    onClick={() => m === 'IMPS' && handleChange('mode', m)}
                    disabled={m !== 'IMPS'}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div style={s.grid2}>
                <Field
                  label="Beneficiary Account Number"
                  id="receiverAccount"
                  type="text"
                  placeholder="16-digit account number"
                  value={form.receiverAccount}
                  onChange={(v) => handleChange('receiverAccount', v)}
                  maxLength={20}
                />
                <Field
                  label="Confirm Account Number"
                  id="confirmAccount"
                  type="text"
                  placeholder="Re-enter account number"
                  value={form.confirmAccount}
                  onChange={(v) => handleChange('confirmAccount', v)}
                  maxLength={20}
                />
              </div>

              <Field
                label="Amount (₹)"
                id="amount"
                type="number"
                placeholder="0.00"
                value={form.amount}
                onChange={(v) => handleChange('amount', v)}
                prefix="₹"
              />

              {/* High-value warning */}
              {isHighValue && (
                <div style={s.highValueWarning}>
                  <span style={s.warningIcon}>⚠️</span>
                  <div>
                    <strong>High value transaction</strong>
                    <p style={s.warningDetail}>
                      Transfers of {formatIndianCurrency(amount)} or above require{' '}
                      <strong>VID-LIVE biometric verification</strong>. Your webcam will be
                      activated to verify your identity.
                    </p>
                  </div>
                </div>
              )}

              <Field
                label="Remarks (optional)"
                id="remarks"
                type="text"
                placeholder="Purpose of transfer"
                value={form.remarks}
                onChange={(v) => handleChange('remarks', v)}
              />

              {error && (
                <div style={s.errorBox}>
                  <span>⚠</span> {error}
                </div>
              )}

              {successMsg && (
                <div style={s.successBox}>
                  <span>✓</span> {successMsg}
                </div>
              )}

              <div style={s.submitRow}>
                <div style={s.amountPreview}>
                  {amount > 0 && (
                    <>
                      <span style={s.previewLabel}>Transfer amount:</span>
                      <span style={s.previewAmount}>{formatIndianCurrency(amount)}</span>
                    </>
                  )}
                </div>
                <button style={s.submitBtn} type="submit" disabled={loading}>
                  {loading
                    ? 'Processing…'
                    : isHighValue
                    ? 'Proceed to VID-LIVE Verification →'
                    : 'Transfer Now'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

function Field({ label, id, type, placeholder, value, onChange, maxLength, prefix }) {
  return (
    <div style={s.fieldGroup}>
      <label style={s.label} htmlFor={id}>{label}</label>
      <div style={{ position: 'relative' }}>
        {prefix && <span style={s.prefix}>{prefix}</span>}
        <input
          id={id}
          style={{ ...s.input, ...(prefix ? { paddingLeft: 30 } : {}) }}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
        />
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--iob-bg)' },
  body: { display: 'flex', flex: 1 },
  main: { flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 },

  breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 },
  backBtn: { background: 'none', border: 'none', color: 'var(--iob-blue)', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  sep: { color: 'var(--iob-muted)' },
  breadCurrent: { color: 'var(--iob-muted)' },

  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--iob-border)',
    borderRadius: 10,
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,63,125,0.06)',
  },
  cardHeader: {
    backgroundColor: 'var(--iob-blue)',
    padding: '24px 32px',
    borderBottom: '3px solid var(--iob-gold)',
  },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: 700, marginBottom: 4 },
  subtitle: { color: '#A8C8F0', fontSize: 13 },

  form: { padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 },

  modeRow: { display: 'flex', gap: 8 },
  modeBtn: {
    padding: '8px 20px',
    borderRadius: 20,
    border: '2px solid var(--iob-border)',
    backgroundColor: '#FFFFFF',
    color: 'var(--iob-muted)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modeBtnActive: {
    backgroundColor: 'var(--iob-blue)',
    borderColor: 'var(--iob-blue)',
    color: '#FFFFFF',
  },
  modeBtnDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },

  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },

  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--iob-text)' },
  input: {
    border: '1px solid var(--iob-border)',
    borderRadius: 6,
    padding: '10px 14px',
    fontSize: 14,
    color: 'var(--iob-text)',
    outline: 'none',
    width: '100%',
  },
  prefix: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--iob-muted)',
    fontSize: 14,
    pointerEvents: 'none',
  },

  highValueWarning: {
    backgroundColor: '#FFF8E1',
    border: '2px solid var(--iob-gold)',
    borderRadius: 8,
    padding: '14px 18px',
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  warningIcon: { fontSize: 22, flexShrink: 0 },
  warningDetail: { fontSize: 13, color: '#5C4500', marginTop: 4, lineHeight: 1.5 },

  errorBox: {
    backgroundColor: '#FFEBEE',
    border: '1px solid #FFCDD2',
    color: 'var(--iob-danger)',
    borderRadius: 6,
    padding: '10px 14px',
    fontSize: 13,
    display: 'flex',
    gap: 8,
  },
  successBox: {
    backgroundColor: '#E8F5E9',
    border: '1px solid #A5D6A7',
    color: 'var(--iob-success)',
    borderRadius: 6,
    padding: '10px 14px',
    fontSize: 13,
    display: 'flex',
    gap: 8,
  },

  submitRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  amountPreview: { display: 'flex', alignItems: 'center', gap: 8 },
  previewLabel: { fontSize: 13, color: 'var(--iob-muted)' },
  previewAmount: { fontSize: 20, fontWeight: 700, color: 'var(--iob-text)' },
  submitBtn: {
    backgroundColor: 'var(--iob-blue)',
    color: '#FFFFFF',
    border: '2px solid var(--iob-gold)',
    borderRadius: 6,
    padding: '12px 28px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.2s',
    whiteSpace: 'nowrap',
  },
}
