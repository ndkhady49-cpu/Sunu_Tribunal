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

  // Pas d'appel tant que le mot de passe temporaire n'est pas changé (le serveur refuserait)
  const actif = isAuth && !user?.doit_changer_mdp

  const rafraichirCompteurs = useCallback(() => {
    if (!actif) return
    statsAPI.badges().then(r => setCompteurs(r.data)).catch(() => {})
  }, [actif])

  // Nouvel utilisateur connecté → on repart de zéro
  usePolling(() => {
    if (!actif) { setCompteurs({}); return }
    rafraichirCompteurs()
  }, [actif, user?.id])

  return (
    <CompteursContext.Provider value={{ compteurs, rafraichirCompteurs }}>
      {children}
    </CompteursContext.Provider>
  )
}

export const useCompteurs = () => useContext(CompteursContext)
