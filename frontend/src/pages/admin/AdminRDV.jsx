import { useState } from 'react'
import { FiCheck, FiX, FiClock, FiCalendar } from 'react-icons/fi'
import Badge from '../../components/common/Badge.jsx'
import toast from 'react-hot-toast'

const SLOTS_TODAY = [
  { time:'08h00', citoyen:'Amadou Koné',    status:'done',     type:'Dossier civil'  },
  { time:'09h00', citoyen:'Ndeye Touré',    status:'progress', type:'Consultation'   },
  { time:'10h00', citoyen:null,             status:'free',     type:null             },
  { time:'11h00', citoyen:'Alioune Mbaye',  status:'pending',  type:'État civil'     },
  { time:'14h00', citoyen:null,             status:'free',     type:null             },
  { time:'15h00', citoyen:'Mariama Diallo', status:'done',     type:'Consultation'   },
]

const INIT_RDV = [
  { id:1, ref:'RDV-2025-04820', initials:'AB', color:'#0d1f3c', citoyen:'Aminata Ba',   service:'Dossier civil',    date:'05/05/2025', heure:'10h00', status:'pending'  },
  { id:2, ref:'RDV-2025-04821', initials:'SG', color:'#0a7048', citoyen:'Serigne Gaye', service:'Consultation',      date:'06/05/2025', heure:'09h00', status:'pending'  },
  { id:3, ref:'RDV-2025-04822', initials:'BS', color:'#c9a227', citoyen:'Binta Sall',   service:'État civil',        date:'07/05/2025', heure:'14h00', status:'pending'  },
  { id:4, ref:'RDV-2025-04819', initials:'OC', color:'#c8272d', citoyen:'Omar Cissé',   service:'Litige commercial', date:'08/05/2025', heure:'11h00', status:'progress' },
]

const slotConfig = {
  free:     { bg:'#ecfdf5', border:'#bbf7d0', textColor:'#0a7048', label: 'Disponible' },
  done:     { bg:'#f9fafb', border:'#e5e7eb', textColor:'#6b7280', label: 'Terminé'    },
  pending:  { bg:'#fef9ec', border:'#fde68a', textColor:'#92400e', label: 'En attente' },
  progress: { bg:'#e8f0fb', border:'#c5d4f2', textColor:'#0d1f3c', label: 'En cours'  },
}

export default function AdminRDV() {
  const [rdvs, setRdvs]             = useState(INIT_RDV)
  const [motifModal, setMotifModal] = useState(null)
  const [motifTexte, setMotifTexte] = useState('')

  const valider = (id) => {
    setRdvs(r => r.map(x => x.id === id ? {...x, status: 'done'} : x))
    toast.success('RDV confirmé — citoyen notifié ✓')
  }
  const rejeter = (id) => setMotifModal(id)
  const confirmerRejet = () => {
    setRdvs(r => r.map(x => x.id === motifModal
      ? {...x, status: 'rejected', motifRejet: motifTexte} : x
    ))
    toast.error('RDV rejeté — citoyen notifié')
    setMotifModal(null)
    setMotifTexte('')
  }

  const pending = rdvs.filter(r => r.status === 'pending')

  const stats = [
    { num:'34', label:'Ce jour',      gradient:'linear-gradient(135deg, #0d1f3c, #1a3a6e)', shadow:'rgba(13,31,60,0.3)' },
    { num: pending.length, label:'En attente', gradient:'linear-gradient(135deg, #a0811a, #c9a227)', shadow:'rgba(201,162,39,0.3)' },
    { num:'18', label:'Confirmés',    gradient:'linear-gradient(135deg, #0a7048, #0f8a58)', shadow:'rgba(10,112,72,0.3)' },
    { num:'8',  label:'Disponibles',  gradient:'linear-gradient(135deg, #0d1f3c, #1a3a6e)', shadow:'rgba(13,31,60,0.2)' },
  ]

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-700">Rendez-vous</h1>
        <p className="text-gray-400 text-sm mt-0.5">Vendredi 2 mai 2025 · TGI Dakar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={s.label}
            className="kpi-box-gradient animate-fade-up"
            style={{ background: s.gradient, boxShadow: `0 6px 20px ${s.shadow}`, animationDelay:`${i*70}ms`, animationFillMode:'forwards', opacity:0 }}>
            <div className="kpi-num text-white">{s.num}</div>
            <div className="kpi-label text-white/70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Créneaux du jour */}
      <div className="card mb-6">
        <h3 className="font-bold text-navy-700 mb-4 flex items-center gap-2 text-sm">
          <div className="icon-box-sm" style={{ background: 'linear-gradient(135deg, #0a7048, #0f8a58)' }}>
            <FiClock className="w-3.5 h-3.5 text-white" />
          </div>
          Créneaux du jour
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SLOTS_TODAY.map(s => {
            const cfg = slotConfig[s.status] || slotConfig.free
            return (
              <div key={s.time}
                className="rounded-xl p-3 border transition-all hover:scale-[1.02]"
                style={{ background: cfg.bg, borderColor: cfg.border }}>
                <p className="font-bold text-sm mb-1" style={{ color: cfg.textColor }}>
                  {s.time}
                </p>
                {s.citoyen ? (
                  <>
                    <p className="text-xs text-gray-700 font-semibold truncate">{s.citoyen}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{s.type}</p>
                    <div className="mt-1.5"><Badge status={s.status} /></div>
                  </>
                ) : (
                  <p className="text-xs font-bold mt-0.5" style={{ color: cfg.textColor }}>Disponible</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* En attente de validation */}
      {pending.length > 0 && (
        <div className="card p-0 overflow-hidden mb-5">
          <div className="px-5 py-4 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #fef9ec, #fef3c7)', borderBottom: '1px solid #fde68a' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#c9a227' }} />
            <h3 className="font-bold text-sm" style={{ color: '#92400e' }}>
              En attente de validation ({pending.length})
            </h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Référence</th><th>Citoyen</th><th>Service</th><th>Date</th><th>Heure</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map(r => (
                <tr key={r.id}>
                  <td>
                    <span className="font-mono text-xs font-bold text-navy-700 bg-navy-50 px-2 py-1 rounded-lg">{r.ref}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar text-xs font-bold" style={{ background: r.color }}>{r.initials}</div>
                      <span className="font-semibold text-sm text-gray-700">{r.citoyen}</span>
                    </div>
                  </td>
                  <td><span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{r.service}</span></td>
                  <td>
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <FiCalendar className="w-3 h-3" /> {r.date}
                    </div>
                  </td>
                  <td><span className="font-bold text-xs text-navy-700">{r.heure}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => valider(r.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-white transition-all hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #0a7048, #0f8a58)', boxShadow: '0 2px 8px rgba(10,112,72,0.3)' }}>
                        <FiCheck className="w-3 h-3" /> Valider
                      </button>
                      <button onClick={() => rejeter(r.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-white transition-all hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #c8272d, #e8484e)', boxShadow: '0 2px 8px rgba(232,72,78,0.3)' }}>
                        <FiX className="w-3 h-3" /> Rejeter
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal rejet */}
      {motifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMotifModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="icon-box" style={{ background: 'linear-gradient(135deg, #c8272d, #e8484e)' }}>
                <FiX className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-700">Motif du rejet</h3>
                <p className="text-xs text-gray-400">Ce message sera envoyé au citoyen</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
              ℹ️ Le citoyen recevra une notification avec votre message explicatif.
            </div>
            <textarea
              className="form-input w-full"
              rows={4}
              placeholder="Ex: Créneau indisponible, veuillez choisir une autre date..."
              value={motifTexte}
              onChange={e => setMotifTexte(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setMotifModal(null)} className="btn-ghost flex-1">Annuler</button>
              <button onClick={confirmerRejet} disabled={!motifTexte.trim()} className="btn-danger flex-1">
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tous les RDV */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <h3 className="font-bold text-navy-700 text-sm">Tous les rendez-vous</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Référence</th><th>Citoyen</th><th>Service</th><th>Date</th><th>Statut</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rdvs.map(r => (
              <tr key={r.id}>
                <td>
                  <span className="font-mono text-xs font-bold text-navy-700 bg-navy-50 px-2 py-1 rounded-lg">{r.ref}</span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="avatar text-xs font-bold" style={{ background: r.color }}>{r.initials}</div>
                    <span className="font-semibold text-sm text-gray-700">{r.citoyen}</span>
                  </div>
                </td>
                <td><span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{r.service}</span></td>
                <td><span className="text-xs text-gray-400">{r.date}</span></td>
                <td><Badge status={r.status} /></td>
                <td>
                  {r.status === 'pending' ? (
                    <div className="flex gap-1.5">
                      <button onClick={() => valider(r.id)}
                        className="p-1.5 rounded-lg text-white transition-all hover:scale-110"
                        style={{ background: 'linear-gradient(135deg, #0a7048, #0f8a58)' }}>
                        <FiCheck className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => rejeter(r.id)}
                        className="p-1.5 rounded-lg text-white transition-all hover:scale-110"
                        style={{ background: 'linear-gradient(135deg, #c8272d, #e8484e)' }}>
                        <FiX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
