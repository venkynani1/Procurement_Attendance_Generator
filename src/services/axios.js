// javascript
// src/services/axios.js
import axios from 'axios'
import { getToken, logout } from './auth'

const api = axios.create({
  baseURL: '/', // adjust if your API lives under a different base path
  // timeout: 10000
})

api.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, err => Promise.reject(err))

api.interceptors.response.use(res => res, err => {
  // optional: handle unauthorized globally
  if (err.response && err.response.status === 401) {
    logout()
    // optional: redirect to login using router if available
  }
  return Promise.reject(err)
})

export default api
