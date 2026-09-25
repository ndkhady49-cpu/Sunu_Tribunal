import { useState, useEffect } from 'react'
import { FiAlertTriangle, FiMapPin, FiCheckCircle, FiPhone } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge.jsx'
import { sosAPI, messageErreur } from '../../services/api.js'
import usePolling from '../../hooks/usePolling.js'
import { ilYa } from '../../utils/format.js'

const ALERT_TYPES = [
  { key:"agression", label:"Agression",   emoji:'🚨' },
  { key:"vol",       label:"Vol / Braquage", emoji:'💰' },
  { key:'danger',    label:'Danger immédiat', emoji:'⚠️' },
  { key:'autre',     label:'Autre urgence',  emoji:'🆘' },
]

const STATUT_ALERTE = {
  active:   { status: 'urgent',   label: 'Transmise' },
  progress: { status: 'progress', label: 'Prise en charge' },
  resolved: { status: 'done',     label: 'Résolue' },
  archived: { status: 'done',     label: 'Archivée' },
}

// 14.6928, -17.4467 → « 14.6928°N, 17.4467°O »
const fmtPosition = (c) => c
  ? `${Math.abs(c.lat).toFixed(4)}°${c.lat >= 0 ? 'N' : 'S'}, ${Math.abs(c.lng).toFixed(4)}°${c.lng >= 0 ? 'E' : 'O'}`
  : null

function MesAlertes({ alertes }) {
  if (!alertes.length) return null
  return (
    <div className="card mt-6 text-left">
      <p className="form-label mb-3">Mes alertes</p>
      <div className="space-y-3">
        {alertes.map(a => (
          <div key={a.id} className="flex items-start justify-between gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
            <div className="min-w-0">
              <p className="font-mono text-sm font-bold text-navy-700">{a.reference}</p>
              <p className="text-xs text-gray-500">{a.type_label} · {ilYa(a.created_at)}</p>
              {a.pris_en_charge_par_nom && (
                <p className="text-xs text-justice-600 mt-0.5">Pris en charge par {a.pris_en_charge_par_nom}</p>
              )}
            </div>
            <Badge {...(STATUT_ALERTE[a.statut] || STATUT_ALERTE.active)} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SOSPage() {
  const [alertType, setAlertType] = useState('agression')
  const [sent,      setSent]      = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [coords,    setCoords]    = useState(null)
  const [gps,       setGps]       = useState('recherche')   // recherche | ok | indisponible
  const [desc,      setDesc]      = useState('')
  const [alertes,   setAlertes]   = useState([])

  useEffect(() => {
    if (!navigator.geolocation) { setGps('indisponible'); return }
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGps('ok') },
      () => setGps('indisponible'),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }, [])

  // Statut de mes alertes, mis à jour toutes les 15 s
  usePolling(() => { sosAPI.list().then(r => setAlertes(r.data)).catch(() => {}) })

  const send = async () => {
    setLoading(true)
    try {
      const res = await sosAPI.create({
        type_alerte: alertType,
        description: desc.trim(),
        latitude:  coords ? coords.lat.toFixed(6) : null,
        longitude: coords ? coords.lng.toFixed(6) : null,
      })
      setSent(res.data.reference)
      setAlertes(a => [res.data, ...a])
      setDesc('')
      toast.success('Alerte transmise au tribunal !')
    } catch (err) {
      toast.error(messageErreur(err, "L'alerte n'a pas pu être envoyée. Appelez le 17."))
    } finally {
      setLoading(false)
    }
  }

  const position = fmtPosition(coords)

  if (sent) return (
    <div className="p-4 lg:p-6 max-w-lg mx-auto">
      <div className="card text-center py-10">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiCheckCircle className="w-10 h-10 text-justice-500" />
        </div>
        <h2 className="font-display text-2xl font-bold text-navy-700 mb-2">Alerte transmise !</h2>
        <p className="text-gray-500 mb-2">Le personnel du tribunal a été notifié</p>
        <p className="font-mono text-navy-700 font-bold bg-gray-50 px-4 py-2 rounded-xl inline-block mb-6">
          {sent}
        </p>
        <div className="bg-justice-50 rounded-2xl p-4 text-sm text-justice-600 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-justice-400 animate-blink" />
            {position ? 'Alerte transmise · GPS transmis' : 'Alerte transmise · position non disponible'}
          </div>
          {position && <p className="text-xs text-gray-500">Position : {position}</p>}
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
        <MesAlertes alertes={alertes} />
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
            <p className="font-semibold text-navy-700">
              {gps === 'ok' ? 'GPS actif' : gps === 'recherche' ? 'Recherche de votre position…' : 'Position indisponible'}
            </p>
            <p className="text-xs text-gray-500">
              {position || (gps === 'indisponible' ? "Autorisez la localisation ou décrivez le lieu ci-dessous" : '…')}
            </p>
          </div>
          <div className={`ml-auto w-2 h-2 rounded-full ${gps === 'ok' ? 'bg-justice-400 animate-blink' : 'bg-gray-300'}`} />
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

      <MesAlertes alertes={alertes} />
    </div>
  )
}
