import { API_BASE, HEADERS_COMMUNS } from '../config.js'

// Le modèle peut mettre un peu de temps : on coupe au bout de 45 s
const DELAI_MAX_MS = 45000
// Taille de la mémoire de conversation envoyée au serveur
const MAX_HISTORIQUE = 10

// Message unique en cas de problème : jamais de détail technique affiché
export const MESSAGE_INDISPONIBLE = "L'assistant est momentanément indisponible. Réessayez dans quelques instants."

async function appelerBackend(chemin, corps, { avecToken = false } = {}) {
  const controller = new AbortController()
  const minuteur = setTimeout(() => controller.abort(), DELAI_MAX_MS)

  const headers = { 'Content-Type': 'application/json', ...HEADERS_COMMUNS }
  if (avecToken) {
    const token = localStorage.getItem('st_token')
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response, data
  try {
    response = await fetch(`${API_BASE}${chemin}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(corps),
      signal: controller.signal,
    })
    data = await response.json()
  } catch {
    // Réseau coupé, délai dépassé, réponse non JSON : même message neutre
    throw new Error(MESSAGE_INDISPONIBLE)
  } finally {
    clearTimeout(minuteur)
  }

  if (response.status === 429) throw new Error(data.detail || MESSAGE_INDISPONIBLE)
  if (response.status === 400 && data.error) throw new Error(data.error)
  if (!response.ok) throw new Error(MESSAGE_INDISPONIBLE)
  return data
}

/** Les 10 derniers échanges au format attendu par le serveur ({role, content}) */
export function versHistorique(messages) {
  return messages
    .filter(m => (m.role === 'user' || m.role === 'assistant') && !m.accueil && !m.erreur)
    .slice(-MAX_HISTORIQUE)
    .map(m => ({ role: m.role, content: m.content }))
}

// Assistant juridique des citoyens (accessible sans connexion)
export async function envoyerMessage(message, historique = []) {
  const data = await appelerBackend('/chatbot/ask/', { message, historique })
  return data.reply
}

// Assistant du greffe (personnel du tribunal : jeton requis)
export async function envoyerMessageGreffe(message, historique = []) {
  const data = await appelerBackend('/chatbot/admin/', { message, historique }, { avecToken: true })
  return data.reply
}

// Génération de courrier officiel (personnel du tribunal uniquement)
export async function genererDocument(destinataire, motif, decision) {
  const data = await appelerBackend(
    '/chatbot/generate-doc/',
    { destinataire, motif, decision },
    { avecToken: true },
  )
  return data.document
}
