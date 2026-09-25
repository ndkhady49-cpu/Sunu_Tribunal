import { createContext, useCallback, useContext, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { statsAPI } from '../services/api.js'
import usePolling from '../hooks/usePolling.js'

/**
 * Compteurs des menus (plaintes, courriers, alertes, notifications…),
 * relus toutes les 15 s depuis /api/stats/badges/.
 * Les pages appellent rafraichirCompteurs() après une action pour une mise à jour immédiate.
 */
const CompteursContext = createContext({ compteurs: {}, rafraichirCompteurs: () => {} })

export function CompteursProvider({ children }) {
  const { isAuth, user } = useAuth()
  const [compteurs, setCompteurs] = useState({})

  const rafraichirCompteurs = useCallback(() => {
    if (!isAuth) return
    statsAPI.badges().then(r => setCompteurs(r.data)).catch(() => {})
  }, [isAuth])

  // Nouvel utilisateur connecté → on repart de zéro
  usePolling(() => {
    if (!isAuth) { setCompteurs({}); return }
    rafraichirCompteurs()
  }, [isAuth, user?.id])

  return (
    <CompteursContext.Provider value={{ compteurs, rafraichirCompteurs }}>
      {children}
    </CompteursContext.Provider>
  )
}

export const useCompteurs = () => useContext(CompteursContext)
