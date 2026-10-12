import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://recruitsense-gdox.onrender.com/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
})

let activeRequestsCount = 0

function emitLoadingState() {
  const isLoading = activeRequestsCount > 0
  window.dispatchEvent(
    new CustomEvent('recruitsense-api-loading', {
      detail: { loading: isLoading, count: activeRequestsCount }
    })
  )
}

// Automatically add token to every request and track loading
api.interceptors.request.use(
  (config) => {
    activeRequestsCount++
    emitLoadingState()
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    activeRequestsCount = Math.max(0, activeRequestsCount - 1)
    emitLoadingState()
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    activeRequestsCount = Math.max(0, activeRequestsCount - 1)
    emitLoadingState()
    return response
  },
  (error) => {
    activeRequestsCount = Math.max(0, activeRequestsCount - 1)
    emitLoadingState()
    return Promise.reject(error)
  }
)

export default api