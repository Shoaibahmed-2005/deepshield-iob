import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'

export default function Header({ showLogout = false }) {
  const navigate = useNavigate()
  const auth = useAuth()

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <div style={styles.logoBlock} onClick={() => navigate('/')} role="button">
          <div style={styles.logoText}>
            <span style={styles.logoMain}>Indian Overseas Bank</span>
            <span style={styles.logoHindi}>इंडियन ओवरसीज़ बैंक</span>
          </div>
          <span style={styles.tagline}>Good people to grow with</span>
        </div>

        {showLogout && auth?.customer && (
          <div style={styles.rightBlock}>
            <span style={styles.welcomeText}>
              Welcome,&nbsp;
              <strong>{auth.customer.full_name.split(' ')[0]}</strong>
            </span>
            <button
              style={styles.logoutBtn}
              onClick={() => {
                auth.logout()
                navigate('/')
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
      <div style={styles.goldLine} />
    </header>
  )
}

const styles = {
  header: {
    backgroundColor: 'var(--iob-blue-dark)',
    width: '100%',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  inner: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoBlock: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  logoText: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
  },
  logoMain: {
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: 22,
    letterSpacing: 0.5,
  },
  logoHindi: {
    color: 'var(--iob-gold)',
    fontSize: 13,
    fontWeight: 500,
  },
  tagline: {
    color: '#A8C8F0',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  rightBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  welcomeText: {
    color: '#C8DCF0',
    fontSize: 14,
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid var(--iob-gold)',
    color: 'var(--iob-gold)',
    padding: '6px 16px',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  goldLine: {
    height: 2,
    backgroundColor: 'var(--iob-gold)',
    width: '100%',
  },
}
