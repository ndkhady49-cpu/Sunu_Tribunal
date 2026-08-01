import { useState, useEffect } from 'react'
import { FiAlertTriangle, FiMapPin, FiCheckCircle, FiPhone } from 'react-icons/fi'
import toast from 'react-hot-toast'

const ALERT_TYPES = [
  { key:"agression", label:"Agression",   emoji:'🚨' },
  { key:"vol",       label:"Vol / Braquage", emoji:'💰' },
  { key:'danger',    label:'Danger immédiat', emoji:'⚠️' },
  { key:'autre',     label:'Autre urgence',  emoji:'🆘' },
]

export default function SOSPage() {
  const [alertType, setAlertType] = useState('agression')
  const [sent,      setSent]      = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [coords,    setCoords]    = useState({ lat: '14.6928', lng: '17.4467' })
  const [desc,      setDesc]      = useState('')

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setCoords({
          lat: pos.coords.latitude.toFixed(4),
          lng: pos.coords.longitude.toFixed(4),
        })
      })
    }
  }, [])

  const send = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    const ref = 'SOS-2025-0' + Math.floor(700 + Math.random() * 100)
    setSent(ref)
    setLoading(false)
    toast.success('Alerte transmise aux autorités !')
  }

  if (sent) return (
    <div className="p-4 lg:p-6 max-w-lg mx-auto">
      <div className="card text-center py-10">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiCheckCircle className="w-10 h-10 text-justice-500" />
        </div>
        <h2 className="font-display text-2xl font-bold text-navy-700 mb-2">Alerte transmise !</h2>
        <p className="text-gray-500 mb-2">Les autorités ont été notifiées</p>
        <p className="font-mono text-navy-700 font-bold bg-gray-50 px-4 py-2 rounded-xl inline-block mb-6">
          {sent}
        </p>
        <div className="bg-justice-50 rounded-2xl p-4 text-sm text-justice-600 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-justice-400 animate-blink" />
            Secours en route · GPS transmis
          </div>
          <p className="text-xs text-gray-500">
            Position : {coords.lat}°N, {coords.lng}°O — Dakar, Sénégal
          </p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-semibold text-red-700 mb-2">Numéros d'urgence</p>
          <a href="tel:17" className="flex items-center gap-3 text-sm text-red-700 font-medium">
            <FiPhone className="w-4 h-4" /> Police Nationale : <strong>17</strong>
          </a>
          <a href="tel:18" className="flex items-center gap-3 text-sm text-red-700 font-medium">
            <FiPhone className="w-4 h-4" /> Sapeurs-Pompiers : <strong>18</strong>
          </a>
          <a href="tel:15" className="flex items-center gap-3 text-sm text-red-700 font-medium">
            <FiPhone className="w-4 h-4" /> SAMU : <strong>15</strong>
          </a>
        </div>
        <button onClick={() => setSent(false)}
          className="btn-ghost w-full mt-4">
          Envoyer une autre alerte
        </button>
      </div>
    </div>
  )

  return (
    <div className="p-4 lg:p-6 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h1 className="font-display text-2xl font-bold text-red-700 mb-1">Alerte SOS</h1>
        <p className="text-gray-500 text-sm">Votre position GPS sera transmise automatiquement</p>
      </div>

      {/* Big SOS button */}
      <div className="flex justify-center mb-8">
        <button onClick={send} disabled={loading}
          className="w-36 h-36 rounded-full bg-red-600 text-white flex flex-col items-center justify-center gap-1 shadow-2xl active:scale-95 transition-transform"
          style={{ animation: 'pulse-sos 2s infinite' }}>
          {loading
            ? <span className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            : <>
                <FiAlertTriangle className="w-10 h-10" />
                <span className="font-display font-black text-xl">SOS</span>
              </>
          }
        </button>
      </div>

      {/* Alert type */}
      <div className="card mb-4">
        <p className="form-label mb-3">Type d'urgence</p>
        <div className="grid grid-cols-2 gap-2">
          {ALERT_TYPES.map(a => (
            <button key={a.key} onClick={() => setAlertType(a.key)}
              className={`p-3 rounded-xl text-left transition-all border ${
                alertType === a.key
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
              <div className="text-xl mb-1">{a.emoji}</div>
              <div className="text-sm font-semibold text-navy-700">{a.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* GPS */}
      <div className="card mb-4">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 bg-justice-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiMapPin className="w-4 h-4 text-justice-500" />
          </div>
          <div>
            <p className="font-semibold text-navy-700">GPS actif</p>
            <p className="text-xs text-gray-500">{coords.lat}°N, {coords.lng}°O · Dakar, Sénégal</p>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-justice-400 animate-blink" />
        </div>
      </div>

      {/* Description */}
      <div className="card mb-6">
        <label className="form-label">Description (optionnel)</label>
        <textarea className="form-input" rows={3} placeholder="Décrivez brièvement la situation…"
          value={desc} onChange={e => setDesc(e.target.value)} />
      </div>

      <button onClick={send} disabled={loading}
        className="btn-danger w-full py-4 text-base font-bold">
        Envoyer l'alerte d'urgence
      </button>

      <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
        ⚠️ Cet outil est complémentaire. En urgence vitale :<br />
        <strong className="text-gray-600">Police 17 · Pompiers 18 · SAMU 15</strong>
      </p>
    </div>
  )
}
