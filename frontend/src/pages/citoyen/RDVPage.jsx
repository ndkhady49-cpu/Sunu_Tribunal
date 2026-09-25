import { useState, useEffect } from 'react'
import {
  FiCalendar, FiClock, FiCheckCircle, FiMapPin, FiPhone, FiClipboard,
  FiNavigation, FiXCircle, FiAlertCircle,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge.jsx'
import { rdvAPI, tribunalAPI, authAPI, messageErreur } from '../../services/api.js'
import usePolling from '../../hooks/usePolling.js'
import { useAuth } from '../../context/AuthContext.jsx'

const STATUT_BADGE = {
  pending:   { status: 'pending',  label: 'En attente' },
  confirmed: { status: 'done',     label: 'Confirme'   },
  done:      { status: 'done',     label: 'Effectue'   },
  rejected:  { status: 'rejected', label: 'Non retenu' },
  cancelled: { status: 'rejected', label: 'Annule'     },
}

const fmtDate  = (d) => new Date(d + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
const fmtHeure = (h) => h?.slice(0, 5).replace(':', 'h')
const estWeekend = (iso) => { const j = new Date(iso + 'T00:00').getDay(); return j === 0 || j === 6 }

export default function RDVPage() {
  const { user, token, login } = useAuth()

  const [tribunaux, setTribunaux] = useState([])
  const [services, setServices]   = useState([])
  const [creneaux, setCreneaux]   = useState([])
  const [mesRdv, setMesRdv]       = useState([])

  const [form, setForm]       = useState({ tribunal: '', service: '', date: '', motif: '' })
  const [telephone, setTelephone] = useState(user?.telephone || '')
  const [slot, setSlot]       = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const serviceChoisi = services.find(s => s.value === form.service)

  const chargerMesRdv = () => rdvAPI.myList().then(r => setMesRdv(r.data)).catch(() => {})

  useEffect(() => {
    tribunalAPI.list()
      .then(r => setTribunaux(Array.isArray(r.data) ? r.data : r.data.results || []))
      .catch(err => toast.error(messageErreur(err, 'Impossible de charger les tribunaux.')))
  }, [])

  // Décisions du service d'accueil visibles sans recharger (toutes les 15 s)
  usePolling(() => { chargerMesRdv() })

  // Services + bureau d'orientation selon le tribunal choisi
  useEffect(() => {
    rdvAPI.services(form.tribunal).then(r => setServices(r.data)).catch(() => {})
  }, [form.tribunal])

  // Créneaux réellement disponibles
  useEffect(() => {
    setSlot(null)
    setCreneaux([])
    if (!form.tribunal || !form.date || estWeekend(form.date)) return
    rdvAPI.slots(form.tribunal, form.date)
      .then(r => setCreneaux(r.data))
      .catch(err => toast.error(messageErreur(err)))
  }, [form.tribunal, form.date])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.tribunal) { toast.error('Veuillez choisir un tribunal'); return }
    if (!slot) { toast.error('Veuillez choisir un creneau horaire'); return }
    if (!telephone.trim()) { toast.error('Indiquez un numero pour recevoir la confirmation par SMS'); return }
    setLoading(true)
    try {
      // Mise à jour du numéro si le citoyen l'a modifié
      if (telephone.trim() !== (user?.telephone || '')) {
        const maj = await authAPI.updateMe({ telephone: telephone.trim() })
        login(maj.data, token)
      }
      const res = await rdvAPI.create({
        tribunal: form.tribunal, service: form.service, date: form.date, heure: slot, motif: form.motif,
      })
      setSuccess(res.data)
      toast.success('Rendez-vous soumis avec succes!')
      setForm({ tribunal: form.tribunal, service: '', date: '', motif: '' })
      chargerMesRdv()
    } catch (err) {
      toast.error(messageErreur(err, "Erreur lors de l'envoi de la demande."))
      if (form.tribunal && form.date) rdvAPI.slots(form.tribunal, form.date).then(r => setCreneaux(r.data)).catch(() => {})
    } finally {
      setLoading(false)
    }
  }

  const annuler = async (rdv) => {
    if (!window.confirm(`Annuler le rendez-vous ${rdv.reference} ?`)) return
    try {
      await rdvAPI.annuler(rdv.id)
      toast.success('Rendez-vous annule')
      chargerMesRdv()
    } catch (err) {
      toast.error(messageErreur(err))
    }
  }

  if (success) return (
    <div className="p-4 lg:p-6 max-w-lg mx-auto">
      <div className="card text-center py-8">
        <div className="w-16 h-16 bg-justice-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiCheckCircle className="w-8 h-8 text-justice-500" />
        </div>
        <h2 className="font-display text-2xl font-bold text-navy-700 mb-2">Demande envoyee!</h2>
        <p className="text-gray-500 mb-4">En attente de validation par le service d'accueil</p>
        <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Reference</span>
            <span className="font-bold text-navy-700 font-mono">{success.reference}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date et heure</span>
            <span className="font-semibold">{fmtDate(success.date)} · {fmtHeure(success.heure)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Service</span>
            <span className="font-semibold">{success.service_label}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tribunal</span>
            <span className="font-semibold text-right">{success.tribunal_nom}</span>
          </div>
        </div>
        <div className="text-left bg-gold-50 border border-gold-100 rounded-2xl p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pieces a apporter</p>
          <ul className="space-y-1">
            {success.pieces_a_fournir.map(p => (
              <li key={p} className="text-sm text-navy-700 flex items-start gap-2">
                <FiCheckCircle className="w-4 h-4 text-justice-400 flex-shrink-0 mt-0.5" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-justice-50 rounded-xl p-3 flex items-center gap-2 text-sm text-justice-600 mb-4">
          <span className="w-2 h-2 rounded-full bg-justice-400 animate-blink" />
          Vous recevrez un SMS des que le greffe aura valide votre demande
        </div>
        <button className="btn-ghost w-full" onClick={() => setSuccess(null)}>
          Retour a mes rendez-vous
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
            {tribunaux.map(t => (
              <button key={t.id} type="button"
                onClick={() => set('tribunal', t.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  form.tribunal === t.id
                    ? 'border-justice-400 bg-justice-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                <p className="font-semibold text-sm text-navy-700">{t.nom}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.adresse} · {t.heures_ouverture}</p>
              </button>
            ))}
            {tribunaux.length === 0 && (
              <p className="text-sm text-gray-400">Aucun tribunal disponible pour le moment.</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-navy-700 mb-4">Details de la demande</h3>
          <div className="space-y-4">
            <div>
              <label className="form-label">Type de service</label>
              <select className="form-select" value={form.service} onChange={e => set('service', e.target.value)} required>
                <option value="">Selectionner...</option>
                {services.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {serviceChoisi && (
              <div className="bg-gold-50 border border-gold-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <FiClipboard className="w-3.5 h-3.5" /> Pieces a apporter le jour du rendez-vous
                </p>
                <ul className="space-y-1">
                  {serviceChoisi.pieces.map(p => (
                    <li key={p} className="text-sm text-navy-700 flex items-start gap-2">
                      <FiCheckCircle className="w-4 h-4 text-justice-400 flex-shrink-0 mt-0.5" /> {p}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
                  <FiNavigation className="w-3.5 h-3.5" /> Vous serez oriente vers : <strong className="text-navy-700">{serviceChoisi.bureau}</strong>
                </p>
              </div>
            )}

            <div>
              <label className="form-label">Date souhaitee</label>
              <input type="date" className="form-input" value={form.date}
                onChange={e => set('date', e.target.value)} required
                min={new Date().toISOString().split('T')[0]} />
              {form.date && estWeekend(form.date) && (
                <p className="text-xs text-red-600 mt-1">Le tribunal recoit du lundi au vendredi.</p>
              )}
            </div>
            <div>
              <label className="form-label">Motif (optionnel)</label>
              <input type="text" className="form-input" placeholder="Ex: Depot de plainte pour litige foncier"
                value={form.motif} onChange={e => set('motif', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Telephone pour le SMS de confirmation</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="tel" className="form-input pl-10" placeholder="77 123 45 67"
                  value={telephone} onChange={e => setTelephone(e.target.value)} required />
              </div>
            </div>
          </div>
        </div>

        {form.tribunal && form.date && !estWeekend(form.date) && (
          <div className="card">
            <h3 className="font-semibold text-navy-700 mb-4 flex items-center gap-2">
              <FiClock className="w-4 h-4 text-justice-400" /> Creneaux disponibles
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {creneaux.map(({ heure, disponible }) => (
                <button key={heure} type="button" disabled={!disponible}
                  onClick={() => setSlot(heure)}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    !disponible    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                    slot === heure ? 'bg-justice-500 text-white shadow-sm' :
                                     'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}>
                  {fmtHeure(heure)}
                </button>
              ))}
            </div>
            {creneaux.length > 0 && creneaux.every(c => !c.disponible) && (
              <p className="text-sm text-amber-700 mt-3">Plus aucun creneau ce jour-la. Choisissez une autre date.</p>
            )}
            {slot && (
              <div className="mt-3 bg-justice-50 rounded-xl p-3 text-sm text-justice-600 flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4" />
                Creneau {fmtHeure(slot)} selectionne
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

      {/* ── Mes rendez-vous + ticket d'orientation ── */}
      {mesRdv.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-xl font-bold text-navy-700 mb-4 flex items-center gap-2">
            <FiCalendar className="w-5 h-5 text-justice-400" /> Mes rendez-vous
          </h2>
          <div className="space-y-3">
            {mesRdv.map(r => (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold text-navy-700">{r.reference}</p>
                    <p className="font-semibold text-sm text-navy-700 mt-1">{r.service_label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{fmtDate(r.date)} · {fmtHeure(r.heure)}</p>
                    <p className="text-xs text-gray-400">{r.tribunal_nom}</p>
                  </div>
                  <Badge {...STATUT_BADGE[r.statut]} />
                </div>

                {r.statut === 'confirmed' && r.orientation && (
                  <div className="mt-4 border-2 border-dashed border-justice-100 bg-justice-50 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-justice-600 uppercase tracking-wide mb-2">
                      Ticket d'orientation — a presenter a l'accueil
                    </p>
                    <p className="font-mono text-2xl font-bold text-navy-700 tracking-wider">{r.reference}</p>
                    <p className="text-sm text-navy-700 mt-2 flex items-start gap-2">
                      <FiNavigation className="w-4 h-4 text-justice-500 flex-shrink-0 mt-0.5" />
                      <span><strong>{r.orientation.bureau}</strong>{r.orientation.localisation && ` — ${r.orientation.localisation}`}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">A apporter : {r.pieces_a_fournir.join(' · ')}</p>
                  </div>
                )}

                {r.statut === 'rejected' && r.motif_rejet && (
                  <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-sm text-red-700">
                    <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span><strong>Motif :</strong> {r.motif_rejet}</span>
                  </div>
                )}

                {['pending', 'confirmed'].includes(r.statut) && (
                  <button onClick={() => annuler(r)}
                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline">
                    <FiXCircle className="w-3.5 h-3.5" /> Annuler ce rendez-vous
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
