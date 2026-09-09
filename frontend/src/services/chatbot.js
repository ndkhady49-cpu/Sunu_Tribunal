const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8000/api'
  : 'https://suffering-zestfully-treason.ngrok-free.dev/api'
  
export async function envoyerMessage(message) {
  const response = await fetch(`${API_BASE}/chatbot/ask/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message })
  })

  if (!response.ok) {
    throw new Error('Erreur serveur')
  }

  const data = await response.json()
  return data.reply
}

export async function genererDocument(destinataire, motif, decision) {
  const token = localStorage.getItem('st_token')
  const response = await fetch(`${API_BASE}/chatbot/generate-doc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ destinataire, motif, decision })
  })

  if (!response.ok) {
    throw new Error('Erreur generation document')
  }

  const data = await response.json()
  return data.document
}