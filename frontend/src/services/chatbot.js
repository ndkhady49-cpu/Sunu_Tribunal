import { API_BASE, HEADERS_COMMUNS } from '../config.js'

// Groq peut mettre un peu de temps : on coupe au bout de 45 s
const DELAI_MAX_MS = 45000

async function appelerBackend(chemin, corps, { avecToken = false } = {}) {
  const controller = new AbortController()
  const minuteur = setTimeout(() => controller.abort(), DELAI_MAX_MS)

  const headers = { 'Content-Type': 'application/json', ...HEADERS_COMMUNS }
  if (avecToken) {
    const token = localStorage.getItem('st_token')
    if (token) headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE}${chemin}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(corps),
      signal: controller.signal,
    })

    // ngrok hors ligne ou page HTML au lieu de JSON
    const type = response.headers.get('content-type') || ''
    if (!type.includes('application/json')) {
      throw new Error('Serveur injoignable. Verifiez que le backend et ngrok sont lances.')
    }

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || data.detail || 'Erreur serveur')
    }
    return data
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error("L'assistant met trop de temps a repondre. Reessayez.")
    }
    if (err instanceof TypeError) {
      // fetch échoue (pas de réseau, mauvaise URL, CORS)
      throw new Error('Connexion impossible au serveur. Verifiez votre connexion internet.')
    }
    throw err
  } finally {
    clearTimeout(minuteur)
  }
}

// Assistant juridique (citoyen) et assistant admin : même endpoint public
export async function envoyerMessage(message) {
  const data = await appelerBackend('/chatbot/ask/', { message })
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
