import { useState } from 'react'
import { FiCheck, FiX, FiClock } from 'react-icons/fi'
import Badge from '../../components/common/Badge.jsx'
import toast from 'react-hot-toast'

const SLOTS_TODAY = [
  { time:'08h00', citoyen:'Amadou Kone',   status:'done',     type:'Dossier civil'  },
  { time:'09h00', citoyen:'Ndeye Toure',   status:'progress', type:'Consultation'   },
  { time:'10h00', citoyen:null,             status:'free',     type:null             },
  { time:'11h00', citoyen:'Alioune Mbaye', status:'pending',  type:'Etat civil'     },
  { time:'14h00', citoyen:null,             status:'free',     type:null             },
  { time:'15h00', citoyen:'Mariama Diallo',status:'done',     type:'Consultation'   },
]

const INIT_RDV = [
  { id:1, ref:'RDV-2025-04820', citoyen:'Aminata Ba',    service:'Dossier civil',    date:'05/05/2025', heure:'10h00', status:'pending'  },
  { id:2, ref:'RDV-2025-04821', citoyen:'Serigne Gaye',  service:'Consultation',      date:'06/05/2025', heure:'09h00', status:'pending'  },
  { id:3, ref:'RDV-2025-04822', citoyen:'Binta Sall',    service:'Etat civil',        date:'07/05/2025', heure:'14h00', status:'pending'  },
  { id:4, ref:'RDV-2025-04819', citoyen:'Omar Cisse',    service:'Litige commercial', date:'08/05/2025', heure:'11h00', status:'progress' },
]

export default function AdminRDV() {
  const [rdvs, setRdvs] = useState(INIT_RDV)

  const valider = (id) => {
    setRdvs(r => r.map(x => x.id === id ? {...x, status: 'done'} : x))
    toast.success('RDV confirme — citoyen notifie')
  }
  const rejeter = (id) => {
    setRdvs(r => r.map(x => x.id === id ? {...x, status: 'rejected'} : x))
    toast.error('RDV rejete')
  }

  const pending = rdvs.filter(r => r.status === 'pending')

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-700">Gestion des rendez-vous</h1>
        <p className="text-gray-500 text-sm mt-1">Vendredi 2 mai 2025</p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { num:'34', label:'Ce jour'      },
          { num: pending.length, label:'En attente', color:'text-amber-600' },
          { num:'18', label:'Confirmes'    },
          { num:'8',  label:'Disponibles'  },
        ].map(s => (
          <div key={s.label} className="kpi-box text-center">
            <div className={`kpi-num ${s.color || ''}`}>{s.num}</div>
            <div className="kpi-label text-center">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold text-navy-700 mb-4 flex items-center gap-2">
          <FiClock className="w-4 h-4 text-justice-400" /> Creneaux du jour
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {SLOTS_TODAY.map(s => (
            <div key={s.time} className={`rounded-xl p-3 border ${
              s.status === 'free' ? 'border-justice-200 bg-justice-50' :
              s.status === 'done' ? 'bg-gray-50 border-gray-200' :
              s.status === 'pending' ? 'border-amber-200 bg-amber-50' :
              'border-navy-100 bg-navy-50'
            }`}>
              <p className={`font-bold text-sm ${
                s.status === 'free' ? 'text-justice-500' :
                s.status === 'pending' ? 'text-amber-700' : 'text-navy-700'
              }`}>{s.time}</p>
              {s.citoyen ? (
                <>
                  <p className="text-xs text-gray-700 font-medium mt-0.5">{s.citoyen}</p>
                  <Badge status={s.status} className="mt-1.5 text-xs" />
                </>
              ) : (
                <p className="text-xs text-justice-500 font-semibold mt-1">Disponible</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {pending.length > 0 && (
        <div className="card p-0 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-50 bg-amber-50">
            <h3 className="font-semibold text-amber-700 text-sm uppercase tracking-wide">
              En attente de validation ({pending.length})
            </h3>
          </div>
          <table className="data-table">
            <thead><tr><th>Reference</th><th>Citoyen</th><th>Service</th><th>Date</th><th>Heure</th><th>Actions</th></tr></thead>
            <tbody>
              {pending.map(r => (
                <tr key={r.id}>
                  <td className="font-mono text-xs font-semibold text-navy-700">{r.ref}</td>
                  <td className="font-medium">{r.citoyen}</td>
                  <td className="text-gray-500 text-xs">{r.service}</td>
                  <td className="text-gray-500 text-xs">{r.date}</td>
                  <td className="font-semibold text-xs">{r.heure}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => valider(r.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-justice-500 text-white text-xs font-semibold rounded-lg hover:bg-justice-400 transition-colors">
                        <FiCheck className="w-3 h-3" /> Valider
                      </button>
                      <button onClick={() => rejeter(r.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-500 transition-colors">
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

      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-navy-700 text-sm uppercase tracking-wide">Tous les rendez-vous</h3>
        </div>
        <table className="data-table">
          <thead><tr><th>Reference</th><th>Citoyen</th><th>Service</th><th>Date</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            {rdvs.map(r => (
              <tr key={r.id}>
                <td className="font-mono text-xs font-semibold text-navy-700">{r.ref}</td>
                <td className="font-medium">{r.citoyen}</td>
                <td className="text-gray-500 text-xs">{r.service}</td>
                <td className="text-gray-500 text-xs">{r.date}</td>
                <td><Badge status={r.status} /></td>
                <td>
                  {r.status === 'pending' ? (
                    <div className="flex gap-1">
                      <button onClick={() => valider(r.id)} className="px-2 py-1 bg-justice-500 text-white text-xs rounded-lg"><FiCheck className="w-3 h-3" /></button>
                      <button onClick={() => rejeter(r.id)} className="px-2 py-1 bg-red-600 text-white text-xs rounded-lg"><FiX className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
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
