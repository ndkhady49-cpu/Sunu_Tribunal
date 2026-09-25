import { useState } from 'react'
import { FiAlertTriangle, FiMapPin, FiCheck, FiPhone } from 'react-icons/fi'
import Badge from '../../components/common/Badge.jsx'
import toast from 'react-hot-toast'
import { sosAPI, messageErreur } from '../../services/api.js'
import { useCompteurs } from '../../context/CompteursContext.jsx'
import usePolling from '../../hooks/usePolling.js'
import { ilYa, fmtDateHeure } from '../../utils/format.js'

const typeColor = {
  agression: 'bg-red-100 text-red-700',
  vol:       'bg-amber-100 text-amber-700',
  danger:    'bg-orange-100 text-orange-700',
}

// Statuts du modèle AlerteSOS → apparence du composant Badge
const STATUT = {
  active:   { status: 'urgent',   label: 'Active' },
  progress: { status: 'progress', label: 'Prise en charge' },
  resolved: { status: 'done',     label: 'Resolue' },
  archived: { status: 'done',     label: 'Archivee' },
}

const aPosition = (a) => a.latitude !== null && a.longitude !== null
const position  = (a) => {
  if (!aPosition(a)) return 'Position GPS indisponible'
  const lat = Number(a.latitude), lng = Number(a.longitude)
  return `${Math.abs(lat).toFixed(4)}${lat >= 0 ? 'N' : 'S'} ${Math.abs(lng).toFixed(4)}${lng >= 0 ? 'E' : 'O'}`
}

export default function AdminAlertes() {
  const { rafraichirCompteurs } = useCompteurs()
  const [alertes, setAlertes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [enCours, setEnCours] = useState(null)

  usePolling((auto) => {
    sosAPI.list()
      .then(r => setAlertes(r.data))
      .catch(err => { if (!auto) toast.error(messageErreur(err, 'Impossible de charger les alertes.')) })
      .finally(() => setChargement(false))
  })

  const agir = async (id, appel, succes) => {
    setEnCours(id)
    try {
      const res = await appel()
      setAlertes(a => a.map(x => x.id === id ? res.data : x))
      toast.success(succes)
      rafraichirCompteurs()
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setEnCours(null)
    }
  }
  const prendre  = (id) => agir(id, () => sosAPI.prendreEnCharge(id), 'Alerte prise en charge — citoyen notifie')
  const cloturer = (id) => agir(id, () => sosAPI.cloturer(id), 'Alerte cloturee — citoyen notifie')

  const actives   = alertes.filter(a => ['active', 'progress'].includes(a.statut))
  const archivees = alertes.filter(a => !['active', 'progress'].includes(a.statut))
  const enAttente = actives.filter(a => a.statut === 'active').length

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-700">Alertes SOS</h1>
        <p className="text-gray-500 text-sm mt-1">Gestion des urgences citoyennes</p>
      </div>

      {actives.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
            <FiAlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-bold text-red-700">{actives.length} alerte{actives.length > 1 ? 's' : ''} active{actives.length > 1 ? 's' : ''}</p>
            <p className="text-sm text-red-500 mt-0.5">
              {enAttente} en attente de prise en charge — le citoyen voit le statut en direct.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { num: actives.filter(a => ['agression', 'danger'].includes(a.type_alerte)).length, label:'Urgentes', color:'text-red-600' },
          { num: enAttente,                                           label:'En attente',color:'text-amber-600'  },
          { num: actives.filter(a => a.statut === 'progress').length, label:'En cours',  color:'text-navy-700'   },
          { num: archivees.length,                                    label:'Resolues',  color:'text-justice-500'},
        ].map(s => (
          <div key={s.label} className="kpi-box">
            <div className={`kpi-num ${s.color}`}>{s.num}</div>
            <div className="kpi-label">{s.label}</div>
          </div>
        ))}
      </div>

      {chargement && (
        <div className="flex justify-center py-8">
          <span className="w-6 h-6 border-2 border-navy-100 border-t-navy-700 rounded-full animate-spin" />
        </div>
      )}

      {actives.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-navy-700 mb-3 text-sm uppercase tracking-wide">Alertes actives</h2>
          <div className="space-y-3">
            {actives.map(a => (
              <div key={a.id} className={`card border-l-4 ${
                a.statut === 'active' ? 'border-l-red-500' : 'border-l-navy-500'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-navy-700">{a.reference}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeColor[a.type_alerte] || 'bg-gray-100 text-gray-700'}`}>
                        {a.type_label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      {a.citoyen_nom}
                      {a.citoyen_telephone && (
                        <a href={`tel:${a.citoyen_telephone}`} className="text-xs text-navy-500 font-normal ml-2">{a.citoyen_telephone}</a>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FiMapPin className="w-3 h-3" />
                        {a.adresse ? `${a.adresse} — ` : ''}{position(a)}
                      </span>
                      <span>{ilYa(a.created_at)}</span>
                      {a.pris_en_charge_par_nom && (
                        <span className="text-navy-600 font-semibold">Pris en charge par {a.pris_en_charge_par_nom}</span>
                      )}
                    </div>
                    {a.description && <p className="text-xs text-gray-600 mt-1 italic">« {a.description} »</p>}
                  </div>
                  <Badge {...(STATUT[a.statut] || STATUT.active)} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {aPosition(a) && (
                    <a href={`https://maps.google.com/?q=${a.latitude},${a.longitude}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold text-navy-700 bg-navy-50 px-3 py-2 rounded-xl hover:bg-navy-100 transition-colors">
                      <FiMapPin className="w-3.5 h-3.5" /> Voir carte
                    </a>
                  )}
                  <a href="tel:17"
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 px-3 py-2 rounded-xl hover:bg-red-100 transition-colors">
                    <FiPhone className="w-3.5 h-3.5" /> Police 17
                  </a>
                  {a.statut === 'active' && (
                    <button onClick={() => prendre(a.id)} disabled={enCours === a.id}
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-navy-700 px-3 py-2 rounded-xl hover:bg-navy-600 transition-colors">
                      <FiCheck className="w-3.5 h-3.5" /> Prendre en charge
                    </button>
                  )}
                  {a.statut === 'progress' && (
                    <button onClick={() => cloturer(a.id)} disabled={enCours === a.id}
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-justice-500 px-3 py-2 rounded-xl hover:bg-justice-400 transition-colors">
                      <FiCheck className="w-3.5 h-3.5" /> Cloturer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-navy-700 mb-3 text-sm uppercase tracking-wide">Alertes resolues</h2>
        <div className="card p-0 overflow-hidden overflow-x-auto">
          <table className="data-table">
            <thead><tr>
              <th>Reference</th><th>Citoyen</th><th>Type</th><th>Traitee par</th><th>Statut</th>
            </tr></thead>
            <tbody>
              {!chargement && archivees.length === 0 && (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400 text-sm">Aucune alerte resolue</td></tr>
              )}
              {archivees.map(a => (
                <tr key={a.id} className="opacity-70">
                  <td className="font-mono text-xs font-semibold text-navy-700">{a.reference}</td>
                  <td className="font-medium">{a.citoyen_nom}</td>
                  <td><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor[a.type_alerte] || ""}`}>{a.type_label}</span></td>
                  <td className="text-gray-500 text-xs">{a.pris_en_charge_par_nom || '—'} · {fmtDateHeure(a.updated_at)}</td>
                  <td><Badge {...(STATUT[a.statut] || STATUT.resolved)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
