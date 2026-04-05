import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import EnrollmentPage from './pages/EnrollmentPage'
import HackerPage from './pages/HackerPage'
import AuthPage from './pages/AuthPage'
import './App.css'

// ── Landing Page ─────────────────────────────────────────────────────────────
function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ backgroundColor: '#F4F6F9', minHeight: '100vh', fontFamily: 'Poppins, sans-serif' }}>
      {/* Header */}
      <div>
        <div
          style={{ backgroundColor: '#003087' }}
          className="flex items-center justify-between px-6 py-3"
        >
          <div className="flex items-center gap-4">
            <div>
              <div className="text-white font-bold text-2xl leading-none">IOB</div>
              <div className="text-white text-xs opacity-80">Indian Overseas Bank</div>
            </div>
            <div style={{ width: 1, height: 40, backgroundColor: '#FFD700', opacity: 0.8 }} />
            <div className="flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
                  fill="#C8102E"
                />
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span style={{ color: '#C8102E', fontWeight: 700, fontSize: 18 }}>DeepShield</span>
            </div>
          </div>
          <div style={{ color: '#FFD700', fontStyle: 'italic', fontSize: 13 }}>
            Good People to Grow With
          </div>
        </div>
        <div style={{ height: 3, backgroundColor: '#C8102E' }} />
      </div>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        {/* Shield */}
        <div className="flex justify-center mb-6">
          <div
            className="rounded-full flex items-center justify-center"
            style={{ width: 100, height: 100, backgroundColor: '#FEE2E2' }}
          >
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
                fill="#C8102E"
              />
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <h1
          className="text-4xl font-bold mb-4"
          style={{ color: '#003087' }}
        >
          DeepShield
        </h1>
        <p className="text-lg text-gray-500 mb-2">
          Real-time deepfake protection for digital banking
        </p>
        <p className="text-sm text-gray-400 mb-10">
          Powered by MediaPipe FaceMesh • Built for IOB • Hackathon Demo
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button
            onClick={() => navigate('/enroll')}
            className="px-8 py-4 text-white font-bold text-base rounded-xl transition-all hover:opacity-90 hover:scale-105"
            style={{ backgroundColor: '#C8102E', border: 'none', cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}
          >
            Try DeepShield Live Demo →
          </button>
          <button
            onClick={() => navigate('/hacker')}
            className="px-8 py-4 font-bold text-base rounded-xl transition-all hover:opacity-90 hover:scale-105"
            style={{
              backgroundColor: 'transparent',
              border: '2px solid #003087',
              color: '#003087',
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            ⚠ View Hacker Demo
          </button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          {[
            {
              icon: '🔬',
              title: '468-Point Mesh Analysis',
              desc: 'MediaPipe FaceMesh tracks all 468 facial landmarks in real-time to detect boundary jitter common in deepfakes.',
              color: '#EFF6FF',
              border: '#BFDBFE',
            },
            {
              icon: '⏱',
              title: 'Reaction Timing Biometrics',
              desc: 'DeepFaceLive introduces 50-80ms processing delay. DeepShield measures your response timing against enrolled baseline.',
              color: '#FEF3C7',
              border: '#FDE68A',
            },
            {
              icon: '📐',
              title: '3D Depth & Parallax Check',
              desc: 'Real faces have non-linear 3D depth. Deepfakes flatten the parallax — DeepShield catches this physics anomaly.',
              color: '#F0FDF4',
              border: '#BBF7D0',
            },
          ].map((card, i) => (
            <div
              key={i}
              className="rounded-xl p-5"
              style={{ backgroundColor: card.color, border: `1px solid ${card.border}` }}
            >
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className="font-bold text-gray-800 mb-2">{card.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Quick nav */}
        <div className="mt-16 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-3 text-white text-sm font-semibold rounded-lg"
            style={{ backgroundColor: '#003087', border: 'none', cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}
          >
            → Jump to Authentication
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-gray-400" style={{ borderTop: '1px solid #E5E7EB' }}>
        IOB DeepShield — Cybersecurity Hackathon Demo · Indian Overseas Bank · Good People to Grow With
      </div>
    </div>
  )
}

// ── Router wrapper ────────────────────────────────────────────────────────────
function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/enroll" element={<EnrollmentPage />} />
      <Route path="/hacker" element={<HackerPage />} />
      <Route path="/auth" element={<AuthPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}
