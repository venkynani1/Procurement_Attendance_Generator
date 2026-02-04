import axios from "axios"

const TOKEN_KEY = "auth_token"
const USER_KEY = "auth_user"

/* ------------------------
   Token & User storage
------------------------ */

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
  window.dispatchEvent(new Event("auth-change"))
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function setUser(userObj) {
  if (userObj) {
    localStorage.setItem(USER_KEY, JSON.stringify(userObj))
  } else {
    localStorage.removeItem(USER_KEY)
  }
  window.dispatchEvent(new Event("auth-change"))
}

/* ------------------------
   Auth helpers
------------------------ */

export function isAuthenticated() {
  return !!getToken()
}

/* ------------------------
   API calls
------------------------ */

export async function login(email, password) {
  const res = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/auth/login`,
    { email, password }
  )

  const token = res.data?.token
  if (!token) throw new Error("No token returned from login")

  setToken(token)

  if (res.data?.user) {
    setUser(res.data.user)
  } else {
    const payload = parseJwt(token)
    setUser(
      payload
        ? { id: payload.id, email: payload.email, role: payload.role }
        : null
    )
  }

  return res.data
}

export async function signup(payload) {
  const res = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/auth/signup`,
    payload
  )

  const token = res.data?.token
  if (!token) throw new Error("No token returned from signup")

  setToken(token)
  if (res.data?.user) setUser(res.data.user)

  return res.data
}

export function logout() {
  setToken(null)
  setUser(null)
}

/* ------------------------
   JWT decoder (safe helper)
------------------------ */

function parseJwt(token) {
  try {
    const base64 = token.split(".")[1]
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}
