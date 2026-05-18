import React from 'react'

function formatIndianCurrency(amount) {
  const num = parseFloat(amount)
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export default function TransactionCard({ txn, customerAccount }) {
  const isCredit = txn.receiver_account === customerAccount
  const sign = isCredit ? '+' : '-'
  const amountColor = isCredit ? 'var(--iob-success)' : 'var(--iob-danger)'

  const description = isCredit
    ? `Received from ${txn.sender_account === 'EMPLOYER001' ? 'Employer' : txn.sender_account}`
    : `Paid to ${txn.receiver_name || txn.receiver_account}`

  const statusColor =
    txn.status === 'approved'
      ? 'var(--iob-success)'
      : txn.status === 'blocked'
      ? 'var(--iob-danger)'
      : '#8B6914'

  return (
    <tr style={styles.row}>
      <td style={styles.cell}>
        <span style={styles.txnId}>{txn.transaction_id}</span>
      </td>
      <td style={styles.cell}>
        <span style={styles.date}>{formatDate(txn.created_at)}</span>
      </td>
      <td style={styles.cell}>
        <span style={styles.desc}>{description}</span>
        {txn.remarks ? <span style={styles.remarks}> — {txn.remarks}</span> : null}
      </td>
      <td style={{ ...styles.cell, textAlign: 'right' }}>
        <span style={{ ...styles.amount, color: amountColor }}>
          {sign} {formatIndianCurrency(txn.amount)}
        </span>
      </td>
      <td style={{ ...styles.cell, textAlign: 'center' }}>
        <span style={{ ...styles.statusBadge, color: statusColor, borderColor: statusColor }}>
          {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
        </span>
      </td>
    </tr>
  )
}

const styles = {
  row: {
    borderBottom: '1px solid var(--iob-border)',
    transition: 'background 0.15s',
  },
  cell: {
    padding: '12px 14px',
    fontSize: 13,
    verticalAlign: 'middle',
  },
  txnId: {
    color: 'var(--iob-muted)',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  date: {
    color: 'var(--iob-muted)',
    whiteSpace: 'nowrap',
  },
  desc: {
    color: 'var(--iob-text)',
    fontWeight: 500,
  },
  remarks: {
    color: 'var(--iob-muted)',
    fontSize: 12,
  },
  amount: {
    fontWeight: 700,
    fontSize: 14,
    whiteSpace: 'nowrap',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 600,
    border: '1px solid',
    borderRadius: 12,
    padding: '2px 10px',
    display: 'inline-block',
  },
}
