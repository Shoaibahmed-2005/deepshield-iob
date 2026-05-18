import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../App'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: '⊞' },
  { label: 'Fund Transfer', path: '/transfer', icon: '↗' },
  { label: 'Statement', path: '/dashboard', icon: '☰' },
  { label: 'Profile', path: '/dashboard', icon: '◎' },
  { label: 'Security', path: '/enroll', icon: '⚿' },
]

function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { customer } = useAuth()

  if (!customer) return null

  return (
    <aside style={styles.sidebar}>
      {/* Avatar */}
      <div style={styles.avatarBlock}>
        <div style={styles.avatar}>{getInitials(customer.full_name)}</div>
        <div style={styles.customerName}>{customer.full_name}</div>
        <div style={styles.customerId}>{customer.customer_id}</div>

        {/* Enrollment badge */}
        {customer.is_face_enrolled ? (
          <span style={styles.enrolledBadge}>✓ VID-LIVE Enrolled</span>
        ) : (
          <span style={styles.notEnrolledBadge}>⚠ Not Enrolled</span>
        )}
      </div>

      <hr style={styles.divider} />

      {/* Navigation */}
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path
          return (
            <button
              key={item.label}
              style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}
              onClick={() => navigate(item.path)}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

const styles = {
  sidebar: {
    width: 240,
    minWidth: 240,
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid var(--iob-border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0',
    minHeight: '100%',
  },
  avatarBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 16px 16px',
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    backgroundColor: 'var(--iob-blue)',
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    border: '3px solid var(--iob-blue-light)',
  },
  customerName: {
    fontWeight: 700,
    fontSize: 15,
    color: 'var(--iob-text)',
    textAlign: 'center',
  },
  customerId: {
    fontSize: 12,
    color: 'var(--iob-muted)',
  },
  enrolledBadge: {
    marginTop: 6,
    backgroundColor: '#E8F5E9',
    color: 'var(--iob-success)',
    border: '1px solid #A5D6A7',
    borderRadius: 12,
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 600,
  },
  notEnrolledBadge: {
    marginTop: 6,
    backgroundColor: '#FFF8E1',
    color: '#8B6914',
    border: '1px solid var(--iob-gold)',
    borderRadius: 12,
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 600,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid var(--iob-border)',
    margin: '0 16px 16px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '0 8px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    color: 'var(--iob-text)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s',
  },
  navItemActive: {
    backgroundColor: 'var(--iob-blue-light)',
    color: 'var(--iob-blue)',
    fontWeight: 700,
  },
  navIcon: {
    fontSize: 16,
    width: 20,
    textAlign: 'center',
  },
}
