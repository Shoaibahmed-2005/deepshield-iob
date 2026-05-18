import React, { createContext, useContext, useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { setToken, clearToken, authApi } from './api'

import Landing from './pages/Landing'
import Login from './pages/Login'
import OTP from './pages/OTP'
import Dashboard from './pages/Dashboard'
import Transfer from './pages/Transfer'
import VidLive from './pages/VidLive'
import Result from './pages/Result'
import Enroll from './pages/Enroll'

// ── Auth Context ──────────────────────────────────────────────────────────────

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [loginState, setLoginState] = useState(null) // { customer_id, phone_hint }

  const login = useCallback((customer_id, phone_hint) => {
    setLoginState({ customer_id, phone_hint })
  }, [])

  const authenticate = useCallback(async (token) => {
    setToken(token)
    const res = await authApi.getMe()
    setCustomer(res.data)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setCustomer(null)
    setLoginState(null)
  }, [])

  const refreshCustomer = useCallback(async () => {
    const res = await authApi.getMe()
    setCustomer(res.data)
  }, [])

  return (
    <AuthContext.Provider
      value={{ customer, loginState, login, authenticate, logout, refreshCustomer }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ── Transaction Context ────────────────────────────────────────────────────────

const TxnContext = createContext(null)

export function useTxn() {
  return useContext(TxnContext)
}

function TxnProvider({ children }) {
  const [pendingTxn, setPendingTxn] = useState(null)
  const [vidliveResult, setVidliveResult] = useState(null)

  return (
    <TxnContext.Provider value={{ pendingTxn, setPendingTxn, vidliveResult, setVidliveResult }}>
      {children}
    </TxnContext.Provider>
  )
}

// ── Protected Route ───────────────────────────────────────────────────────────

function ProtectedRoute({ children }) {
  const { customer } = useAuth()
  if (!customer) return <Navigate to="/login" replace />
  return children
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TxnProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/otp" element={<OTP />} />
            <Route
              path="/dashboard"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
            />
            <Route
              path="/transfer"
              element={<ProtectedRoute><Transfer /></ProtectedRoute>}
            />
            <Route
              path="/vidlive"
              element={<ProtectedRoute><VidLive /></ProtectedRoute>}
            />
            <Route
              path="/result"
              element={<ProtectedRoute><Result /></ProtectedRoute>}
            />
            <Route
              path="/enroll"
              element={<ProtectedRoute><Enroll /></ProtectedRoute>}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TxnProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
