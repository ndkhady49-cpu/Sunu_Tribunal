import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export const ROLES = { CITOYEN: 'citoyen', ADMIN: 'admin', JUGE: 'juge' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('st_user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('st_token'))

  const login = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('st_user', JSON.stringify(userData))
    localStorage.setItem('st_token', authToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('st_user')
    localStorage.removeItem('st_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuth: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
