import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('st_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────
export const authAPI = {
  login:    (data) => api.post('/auth/login/', data),
  register: (data) => api.post('/auth/register/', data),
  logout:   ()     => api.post('/auth/logout/'),
  me:       ()     => api.get('/auth/me/'),
}

// ── Rendez-vous ───────────────────────────
export const rdvAPI = {
  list:     ()     => api.get('/rdv/'),
  create:   (data) => api.post('/rdv/', data),
  myList:   ()     => api.get('/rdv/my/'),
  update:   (id, data) => api.patch(`/rdv/${id}/`, data),
  valider:  (id)   => api.post(`/rdv/${id}/valider/`),
  rejeter:  (id)   => api.post(`/rdv/${id}/rejeter/`),
  slots:    (tribunalId, date) => api.get(`/rdv/slots/?tribunal=${tribunalId}&date=${date}`),
}

// ── Plaintes ──────────────────────────────
export const plainteAPI = {
  list:     ()     => api.get('/plaintes/'),
  create:   (data) => api.post('/plaintes/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  myList:   ()     => api.get('/plaintes/my/'),
  detail:   (id)   => api.get(`/plaintes/${id}/`),
  update:   (id, data) => api.patch(`/plaintes/${id}/`, data),
  instruire:(id)   => api.post(`/plaintes/${id}/instruire/`),
  message:  (id, msg) => api.post(`/plaintes/${id}/message/`, { message: msg }),
}

// ── Alertes SOS ──────────────────────────
export const sosAPI = {
  list:     ()     => api.get('/alertes/'),
  create:   (data) => api.post('/alertes/', data),
  prendreEnCharge: (id) => api.post(`/alertes/${id}/prendre/`),
  cloturer: (id)   => api.post(`/alertes/${id}/cloturer/`),
}

// ── Tribunaux ─────────────────────────────
export const tribunalAPI = {
  list:   () => api.get('/tribunaux/'),
  detail: (id) => api.get(`/tribunaux/${id}/`),
}

// ── Statistiques ──────────────────────────
export const statsAPI = {
  dashboard: () => api.get('/stats/dashboard/'),
  monthly:   () => api.get('/stats/monthly/'),
}

// ── Notifications ─────────────────────────
export const notifAPI = {
  list:    () => api.get('/notifications/'),
  markRead:(id) => api.post(`/notifications/${id}/read/`),
  markAll: () => api.post('/notifications/read-all/'),
}

export default api
