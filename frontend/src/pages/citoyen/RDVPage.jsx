import { useState } from 'react'
import { FiCalendar, FiClock, FiCheckCircle, FiMapPin } from 'react-icons/fi'
import toast from 'react-hot-toast'

const TRIBUNAUX = [
  { id:1, nom:'TGI Dakar Plateau',         adresse:'Av. Leopold Sedar Senghor, Dakar' },
  { id:2, nom:'Tribunal de Commerce',       adresse:'Rue Carnot, Dakar'                },
  { id:3, nom:'Tribunal Regional de Pikine',adresse:'Route de Pikine, Dakar'           },
  { id:4, nom:'Tribunal de Thies',          adresse:'Centre-ville, Thies'              },
]

const SERVICES = [
  'Depot de dossier civil', 'Consultation juridique',
  'Audience correctionnelle', 'Etat civil / Casier judiciaire',
  'Litige commercial', 'Autre',
]

const ALL_SLOTS = ['08h00','09h00','10h00','11h00','14h00','15h00','16h00']
const TAKEN     = ['08h00','09h00','16h00']

export default function RDVPage() {
  const [form, setForm]       = useState({ tribunal: '', service: '', date: '', motif: '' })
  const [slot, setSlot]       = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!slot) { toast.error('Veuillez choisir un creneau horaire'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    const ref = 'RDV-2025-0' + Math.floor(4800 + Math.random() * 100)
    setSuccess({ ref, slot, ...form })
    setLoading(false)
    toast.success('Rendez-vous soumis avec succes!')
  }

  if (success) return (
    <div className="p-4 lg:p-6 max-w-lg mx-auto">
      <div className="card text-center py-8">
        <div className="w-16 h-16 bg-justice-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiCheckCircle className="w-8 h-8 text-justice-500" />
        </div>
        <h2 className="font-display text-2xl font-bold text-navy-700 mb-2">Demande envoyee!</h2>
        <p className="text-gray-500 mb-4">En attente de validation par le tribunal</p>
        <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Reference</span>
            <span className="font-bold text-navy-700 font-mono">{success.ref}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date et heure</span>
            <span className="font-semibold">{success.date} · {success.slot}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Service</span>
            <span className="font-semibold">{success.service}</span>
          </div>
        </div>
        <div className="bg-justice-50 rounded-xl p-3 flex items-center gap-2 text-sm text-justice-600 mb-4">
          <span className="w-2 h-2 rounded-full bg-justice-400 animate-blink" />
          Vous serez notifie des validation par le greffe
        </div>
        <button className="btn-ghost w-full" onClick={() => setSuccess(null)}>
          Nouveau rendez-vous
        </button>
      </div>
    </div>
  )

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-700">Prendre un rendez-vous</h1>
        <p className="text-gray-500 text-sm mt-1">Reservez en ligne, sans file</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card">
          <h3 className="font-semibold text-navy-700 mb-4 flex items-center gap-2">
            <FiMapPin className="w-4 h-4 text-justice-400" /> Choisir le tribunal
          </h3>
          <div className="grid gap-2">
            {TRIBUNAUX.map(t => (
              <button key={t.id} type="button"
                onClick={() => set('tribunal', t.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  form.tribunal === t.id
                    ? 'border-justice-400 bg-justice-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                <p className="font-semibold text-sm text-navy-700">{t.nom}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.adresse}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-navy-700 mb-4">Details de la demande</h3>
          <div className="space-y-4">
            <div>
              <label className="form-label">Type de service</label>
              <select className="form-select" value={form.service} onChange={e => set('service', e.target.value)} required>
                <option value="">Selectionner...</option>
                {SERVICES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Date souhaitee</label>
              <input type="date" className="form-input" value={form.date}
                onChange={e => set('date', e.target.value)} required
                min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="form-label">Motif (optionnel)</label>
              <input type="text" className="form-input" placeholder="Ex: Depot de plainte pour litige foncier"
                value={form.motif} onChange={e => set('motif', e.target.value)} />
            </div>
          </div>
        </div>

        {form.date && (
          <div className="card">
            <h3 className="font-semibold text-navy-700 mb-4 flex items-center gap-2">
              <FiClock className="w-4 h-4 text-justice-400" /> Creneaux disponibles
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {ALL_SLOTS.map(s => {
                const taken = TAKEN.includes(s)
                return (
                  <button key={s} type="button" disabled={taken}
                    onClick={() => setSlot(s)}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      taken      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                      slot === s ? 'bg-justice-500 text-white shadow-sm' :
                                   'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}>
                    {s}
                  </button>
                )
              })}
            </div>
            {slot && (
              <div className="mt-3 bg-justice-50 rounded-xl p-3 text-sm text-justice-600 flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4" />
                Creneau {slot} selectionne
              </div>
            )}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="btn-justice w-full py-3 text-base font-bold">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Envoi en cours...
            </span>
          ) : 'Confirmer la demande de RDV'}
        </button>
      </form>
    </div>
  )
}
