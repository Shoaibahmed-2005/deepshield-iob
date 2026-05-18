import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import TransactionCard from '../components/TransactionCard'
import { useAuth } from '../App'
import { transactionsApi } from '../api'

function formatIndianCurrency(amount) {
  const num = parseFloat(amount)
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function maskAccount(acc = '') {
  if (acc.length < 4) return acc
  const last4 = acc.slice(-4)
  const masked = 'XXXX XXXX XXXX ' + last4
  return masked
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { customer, refreshCustomer } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [txnError, setTxnError] = useState('')

  useEffect(() => {
    transactionsApi.history()
      .then((res) => setTransactions(res.data.transactions))
      .catch(() => setTxnError('Could not load transaction history.'))
  }, [])

  useEffect(() => {
    refreshCustomer()
  }, [])

  if (!customer) return null

  return (
    <div style={s.page}>
      <Header showLogout />

      <div style={s.body}>
        <Sidebar />

        <main style={s.main}>
          {/* Enrollment banner */}
          {!customer.is_face_enrolled && (
            <div style={s.enrollBanner}>
              <span style={s.bannerIcon}>⚠</span>
              <div>
                <strong>Secure your account — Enable VID-LIVE Face Verification</strong>
                <p style={s.bannerSub}>
                  High-value transactions above ₹50,000 require VID-LIVE verification. Enroll
                  now to protect your account against deepfake attacks.
                </p>
              </div>
              <button style={s.bannerBtn} onClick={() => navigate('/enroll')}>
                Enroll Now
              </button>
            </div>
          )}

          {/* Account Summary */}
          <div style={s.accountCard}>
            <div style={s.accountCardLeft}>
              <p style={s.acLabel}>Account Number</p>
              <p style={s.acNumber}>{maskAccount(customer.account_number)}</p>
              <p style={s.acType}>Savings Account &nbsp;|&nbsp; IFSC: IOBA0000001</p>
            </div>
            <div style={s.accountCardRight}>
              <p style={s.balLabel}>Available Balance</p>
              <p style={s.balAmount}>{formatIndianCurrency(customer.balance)}</p>
              <p style={s.balSub}>As of today</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={s.quickActions}>
            <QuickBtn icon="↗" label="Fund Transfer" onClick={() => navigate('/transfer')} primary />
            <QuickBtn icon="☰" label="Mini Statement" onClick={() => {}} />
            <QuickBtn
              icon="🎥"
              label="Enable VID-LIVE"
              onClick={() => navigate('/enroll')}
              highlight={!customer.is_face_enrolled}
            />
            <QuickBtn icon="⬇" label="Download Statement" disabled />
          </div>

          {/* Recent Transactions */}
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <h2 style={s.sectionTitle}>Recent Transactions</h2>
              <span style={s.sectionSub}>Last 10 transactions</span>
            </div>
            {txnError ? (
              <p style={s.error}>{txnError}</p>
            ) : transactions.length === 0 ? (
              <p style={s.noData}>No transactions found.</p>
            ) : (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr style={s.thead}>
                      <th style={s.th}>Txn ID</th>
                      <th style={s.th}>Date</th>
                      <th style={s.th}>Description</th>
                      <th style={{ ...s.th, textAlign: 'right' }}>Amount</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <TransactionCard
                        key={txn.transaction_id}
                        txn={txn}
                        customerAccount={customer.account_number}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Security Status */}
          <div style={s.securityCard}>
            <h3 style={s.secCardTitle}>Security Status</h3>
            <div style={s.secCardGrid}>
              <SecurityItem
                label="VID-LIVE Status"
                value={customer.is_face_enrolled ? 'Active' : 'Inactive'}
                valueStyle={{ color: customer.is_face_enrolled ? 'var(--iob-success)' : 'var(--iob-danger)', fontWeight: 700 }}
              />
              <SecurityItem label="Last Login" value={formatDate(new Date().toISOString())} />
              <SecurityItem label="Registered Device" value="This Device" />
              <SecurityItem
                label="Session"
                value="Secure (TLS 1.3)"
                valueStyle={{ color: 'var(--iob-success)' }}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function QuickBtn({ icon, label, onClick, primary, highlight, disabled }) {
  return (
    <button
      style={{
        ...s.qBtn,
        ...(primary ? s.qBtnPrimary : {}),
        ...(highlight ? s.qBtnHighlight : {}),
        ...(disabled ? s.qBtnDisabled : {}),
      }}
      onClick={onClick}
      disabled={disabled}
    >
      <span style={s.qBtnIcon}>{icon}</span>
      <span style={s.qBtnLabel}>{label}</span>
    </button>
  )
}

function SecurityItem({ label, value, valueStyle }) {
  return (
    <div style={s.secItem}>
      <p style={s.secLabel}>{label}</p>
      <p style={{ ...s.secValue, ...valueStyle }}>{value}</p>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--iob-bg)' },
  body: { display: 'flex', flex: 1 },
  main: { flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1040 },

  enrollBanner: {
    backgroundColor: '#FFF8E1',
    border: '2px solid var(--iob-gold)',
    borderRadius: 8,
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  bannerIcon: { fontSize: 24, flexShrink: 0 },
  bannerSub: { fontSize: 12, color: '#7A6020', marginTop: 4, lineHeight: 1.4 },
  bannerBtn: {
    marginLeft: 'auto',
    flexShrink: 0,
    backgroundColor: 'var(--iob-gold)',
    color: '#3A2800',
    border: 'none',
    borderRadius: 6,
    padding: '8px 18px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },

  accountCard: {
    background: 'linear-gradient(135deg, #003F7D 0%, #0057A8 100%)',
    borderRadius: 12,
    padding: '28px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#FFFFFF',
    boxShadow: '0 4px 20px rgba(0,63,125,0.25)',
    borderBottom: '4px solid var(--iob-gold)',
  },
  accountCardLeft: {},
  accountCardRight: { textAlign: 'right' },
  acLabel: { fontSize: 11, color: '#A8C8F0', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  acNumber: { fontSize: 20, fontWeight: 700, letterSpacing: 2, marginBottom: 6 },
  acType: { fontSize: 12, color: '#A8C8F0' },
  balLabel: { fontSize: 11, color: '#A8C8F0', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  balAmount: { fontSize: 32, fontWeight: 700, marginBottom: 4 },
  balSub: { fontSize: 12, color: '#A8C8F0' },

  quickActions: {
    display: 'flex',
    gap: 12,
  },
  qBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '16px 12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--iob-border)',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
    color: 'var(--iob-text)',
  },
  qBtnPrimary: {
    backgroundColor: 'var(--iob-blue)',
    color: '#FFFFFF',
    border: '2px solid var(--iob-gold)',
  },
  qBtnHighlight: {
    border: '2px solid var(--iob-gold)',
    backgroundColor: '#FFF8E1',
  },
  qBtnDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  qBtnIcon: { fontSize: 24 },
  qBtnLabel: { fontSize: 12, fontWeight: 600 },

  section: {
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--iob-border)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--iob-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'var(--iob-blue-light)',
  },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: 'var(--iob-text)' },
  sectionSub: { fontSize: 12, color: 'var(--iob-muted)' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#F7FAFD' },
  th: { padding: '10px 14px', fontSize: 12, fontWeight: 700, color: 'var(--iob-muted)', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left' },
  error: { padding: 20, color: 'var(--iob-danger)', fontSize: 14 },
  noData: { padding: 20, color: 'var(--iob-muted)', fontSize: 14 },

  securityCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--iob-border)',
    borderRadius: 8,
    padding: '20px 24px',
  },
  secCardTitle: { fontSize: 15, fontWeight: 700, color: 'var(--iob-text)', marginBottom: 16 },
  secCardGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
  secItem: {},
  secLabel: { fontSize: 11, color: 'var(--iob-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  secValue: { fontSize: 14, fontWeight: 600, color: 'var(--iob-text)' },
}
