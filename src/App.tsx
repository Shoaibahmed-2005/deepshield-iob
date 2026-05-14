import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import EnrollmentPage from './pages/EnrollmentPage'
import HackerPage from './pages/HackerPage'
import AuthPage from './pages/AuthPage'

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
