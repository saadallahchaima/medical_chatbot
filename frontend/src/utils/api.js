import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 min pour les requêtes longues
  headers: { 'Content-Type': 'application/json' },
})

// ── Intercepteurs ─────────────────────────────────────────────────────────

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const msg = error.response?.data?.detail || error.message || 'Erreur API'
    return Promise.reject(new Error(msg))
  }
)

// ── Endpoints ─────────────────────────────────────────────────────────────

export const queryAgent = async (payload) => {
  const { data } = await api.post('/query', payload)
  return data
}

export const uploadFile = async (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  })
  return data
}

export const checkHealth = async () => {
  const { data } = await api.get('/health')
  return data
}

export const searchRAG = async (query, k = 5) => {
  const { data } = await api.get('/rag/search', { params: { q: query, k } })
  return data
}

export const getRAGStats = async () => {
  const { data } = await api.get('/rag/stats')
  return data
}

export default api
