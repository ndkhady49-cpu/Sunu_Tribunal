import { useState, useRef, useEffect } from 'react'
import { FiCpu, FiX, FiSend, FiMic, FiMicOff, FiCopy, FiCheck } from 'react-icons/fi'

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8000/api'
  : 'https://suffering-zestfully-treason.ngrok-free.dev/api'
  
async function envoyerMessageAdmin(message) {
  const token = localStorage.getItem('st_token')
  const response = await fetch(`${API_BASE}/chatbot/ask/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message })
  })
  if (!response.ok) throw new Error('Erreur serveur')
  const data = await response.json()
  return data.reply
}

const SUGGESTIONS_ADMIN = [
  "Redige une convocation pour une audience",
  "Redige un courrier de rejet de plainte",
  "Quelle procedure pour un litige foncier ?",
  "Redige une notification de decision rendue",
  "Redige un courrier de demande de pieces",
]

export default function AssistantAdmin() {
  const [ouvert, setOuvert]     = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Bonjour ! Je suis votre assistant judiciaire. Je peux rediger des courriers officiels, suggerer des procedures et repondre a vos questions juridiques."
    }
  ])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [ecoute, setEcoute]         = useState(false)
  const [microSupporte, setMicroSupporte] = useState(true)
  const [copie, setCopie]           = useState(null)
  const messagesEndRef  = useRef(null)
  const recognitionRef  = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setMicroSupporte(false)
    }
  }, [])

  const demarrerMicro = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.onstart  = () => setEcoute(true)
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join('')
      setInput(transcript)
    }
    recognition.onend   = () => setEcoute(false)
    recognition.onerror = () => setEcoute(false)
    recognitionRef.current = recognition
    recognition.start()
  }

  const arreterMicro = () => {
    recognitionRef.current?.stop()
    setEcoute(false)
  }

  const copierTexte = (texte, id) => {
    navigator.clipboard.writeText(texte)
    setCopie(id)
    setTimeout(() => setCopie(null), 2000)
  }

  const envoyer = async (texte) => {
    const question = texte || input.trim()
    if (!question || loading) return

    setMessages(m => [...m, { role: 'user', content: question }])
    setInput('')
    setLoading(true)

    try {
      const reponse = await envoyerMessageAdmin(question)
      setMessages(m => [...m, { role: 'assistant', content: reponse }])
    } catch {
      setMessages(m => [...m, {
        role: 'assistant',
        content: 'Erreur de connexion. Verifiez que le serveur Django est actif.'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Bouton flottant admin */}
      <button
        onClick={() => setOuvert(!ouvert)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-navy-700 text-white shadow-2xl flex items-center justify-center hover:bg-navy-600 transition-all active:scale-95"
        title="Assistant Judiciaire IA">
        {ouvert
          ? <FiX className="w-6 h-6" />
          : <FiCpu className="w-6 h-6" />
        }
      </button>

      {/* Fenetre chat */}
      {ouvert && (
        <div className="fixed bottom-24 right-6 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-slide-in"
          style={{ height: '520px' }}>

          {/* Header */}
          <div className="bg-navy-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gold-400/20 rounded-full flex items-center justify-center">
                <FiCpu className="w-4 h-4 text-gold-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Assistant Judiciaire</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-blink" />
                  <span className="text-white/60 text-xs">En ligne · Groq AI · Llama 3.3</span>
                </div>
              </div>
            </div>
            <button onClick={() => setOuvert(false)}>
              <FiX className="w-5 h-5 text-white/70 hover:text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white ${
                  m.role === 'user' ? 'bg-justice-500' : 'bg-navy-700'
                }`}>
                  {m.role === 'user' ? 'G' : 'IA'}
                </div>
                <div className={`max-w-64 ${m.role === 'user' ? '' : 'flex-1'}`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-justice-500 text-white rounded-tr-sm'
                      : 'bg-white text-gray-700 shadow-sm border border-gray-100 rounded-tl-sm'
                  }`}>
                    {m.content}
                  </div>
                  {/* Bouton copier pour les reponses IA */}
                  {m.role === 'assistant' && i > 0 && (
                    <button
                      onClick={() => copierTexte(m.content, i)}
                      className="flex items-center gap-1 mt-1 text-xs text-gray-400 hover:text-navy-700 transition-colors ml-1">
                      {copie === i
                        ? <><FiCheck className="w-3 h-3 text-justice-500" /><span className="text-justice-500">Copie !</span></>
                        : <><FiCopy className="w-3 h-3" /><span>Copier le texte</span></>
                      }
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Ecoute micro */}
            {ecoute && (
              <div className="flex justify-center">
                <div className="bg-red-50 border border-red-200 rounded-full px-4 py-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-blink" />
                  <span className="text-xs text-red-600 font-semibold">En ecoute...</span>
                </div>
              </div>
            )}

            {/* Chargement */}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-navy-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">IA</span>
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Actions rapides :</p>
              <div className="flex flex-col gap-1">
                {SUGGESTIONS_ADMIN.slice(0, 3).map(s => (
                  <button key={s} onClick={() => envoyer(s)}
                    className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:border-navy-400 hover:text-navy-700 transition-colors text-left">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-100">
            {ecoute && input && (
              <div className="bg-gray-50 rounded-xl px-3 py-2 mb-2 text-sm text-gray-600 italic border border-gray-200">
                {input}
              </div>
            )}
            <div className="flex gap-2 items-center">
              {microSupporte && (
                <button
                  onClick={ecoute ? arreterMicro : demarrerMicro}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                    ecoute
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {ecoute ? <FiMicOff className="w-4 h-4" /> : <FiMic className="w-4 h-4" />}
                </button>
              )}
              <input
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-navy-400 bg-gray-50"
                placeholder={ecoute ? "En ecoute..." : "Demandez quelque chose..."}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && envoyer()}
                disabled={loading || ecoute}
              />
              <button
                onClick={() => envoyer()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-navy-700 text-white flex items-center justify-center hover:bg-navy-600 transition-colors disabled:opacity-50 flex-shrink-0">
                <FiSend className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              Powered by Groq AI · Llama 3.3 70B
            </p>
          </div>
        </div>
      )}
    </>
  )
}