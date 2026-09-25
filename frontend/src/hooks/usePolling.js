import { useEffect, useRef } from 'react'

/** Intervalle de rafraîchissement automatique des listes et compteurs */
export const DELAI_RAFRAICHISSEMENT = 15000

/**
 * Appelle `fn` tout de suite, puis toutes les 15 s, sans recharger la page.
 * Le rafraîchissement est suspendu quand l'onglet est caché et reprend
 * (avec un appel immédiat) quand l'utilisateur revient.
 * `fn` reçoit `true` pour les appels automatiques (pour ne pas afficher d'erreur à chaque tentative).
 */
export default function usePolling(fn, deps = [], delai = DELAI_RAFRAICHISSEMENT) {
  const ref = useRef(fn)
  ref.current = fn

  useEffect(() => {
    let id = null
    const tick = () => ref.current(true)
    const demarrer = () => { if (id === null) id = setInterval(tick, delai) }
    const arreter  = () => { clearInterval(id); id = null }
    const onVisibilite = () => {
      if (document.visibilityState === 'visible') { tick(); demarrer() } else arreter()
    }

    ref.current(false)
    if (document.visibilityState !== 'hidden') demarrer()
    document.addEventListener('visibilitychange', onVisibilite)
    return () => { arreter(); document.removeEventListener('visibilitychange', onVisibilite) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delai, ...deps])
}
