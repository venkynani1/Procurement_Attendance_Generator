// javascript
// src/services/auth.js (modify your existing file)
const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

import axios from "axios"
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new Event('auth-change'))
}

export function setUser(userObj) {
  if (userObj) localStorage.setItem(USER_KEY, JSON.stringify(userObj))
  else localStorage.removeItem(USER_KEY)
  window.dispatchEvent(new Event('auth-change'))
}
export function getUser() {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export async function login(email, password) {
  const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { email, password })
  const token = res.data?.token
  if (!token) throw new Error('No token returned from login')
  setToken(token)

  // Prefer server returned user object
  if (res.data?.user) {
    setUser(res.data.user)
  } else {
    // fallback: decode token to extract user payload (role) if server only returned token
    const payload = parseJwt(token)
    setUser(payload ? { id: payload.id, email: payload.email, role: payload.role } : null)
  }

  return res.data
}

export function logout() {
  setToken(null)
  setUser(null)
}

export function isAuthenticated() {
  // simple presence check; for better checks, decode JWT and verify exp
  return !!getToken()
}