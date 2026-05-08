import { useState } from 'react'
import { FiAlertTriangle, FiMapPin, FiCheck, FiPhone } from 'react-icons/fi'
import Badge from '../../components/common/Badge.jsx'
import toast from 'react-hot-toast'

const INIT_SOS = [
  { id:1, ref:'SOS-2025-00734', citoyen:'Ibrahima Sow',   type:'Agression', lat:'14.6972', lng:'17.4434', status:'urgent',   time:'Il y a 12 min', zone:'Dakar Plateau' },
  { id:2, ref:'SOS-2025-00733', citoyen:'Fatou Ndiaye',   type:'Vol',       lat:'14.6845', lng:'17.4521', status:'pending',  time:'Il y a 1h',     zone:'Medina'        },
  { id:3, ref:'SOS-2025-00732', citoyen:'Moussa Diop',    type:'Danger',    lat:'14.7520', lng:'17.3890', status:'progress', time:'Il y a 2h',     zone:'Pikine'        },
  { id:4, ref:'SOS-2025-00728', citoyen:'Coumba Thiaw',   type:'Vol',       lat:'14.6903', lng:'17.4410', status:'done',     time:'Hier 09:15',    zone:'Dakar Plateau' },
]

const typeColor = {
  Agression: 'bg-red-100 text-red-700',
  Vol:       'bg-amber-100 text-amber-700',
  Danger:    'bg-orange-100 text-orange-700',
}

export default function AdminAlertes() {
  const [alertes, setAlertes] = useState(INIT_SOS)

  const prendre = (id) => {
    setAlertes(a => a.map(x => x.id === id ? {...x, status: 'progress'} : x))
    toast.success('Alerte prise en charge')
  }
  const cloturer = (id) => {
    setAlertes(a => a.map(x => x.id === id ? {...x, status: 'done'} : x))
    toast.success('Alerte cloturee')
  }

  const actives   = alertes.filter(a => a.status !== 'done')
  const archivees = alertes.filter(a => a.status === 'done')

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
            <p className="text-sm text-red-500 mt-0.5">Les autorites ont ete notifiees automatiquement.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { num: actives.filter(a => a.status === 'urgent').length,   label:'Urgentes',  color:'text-red-600'    },
          { num: actives.filter(a => a.status === 'pending').length,  label:'En attente',color:'text-amber-600'  },
          { num: actives.filter(a => a.status === 'progress').length, label:'En cours',  color:'text-navy-700'   },
          { num: archivees.length,                                    label:'Resolues',  color:'text-justice-500'},
        ].map(s => (
          <div key={s.label} className="kpi-box">
            <div className={`kpi-num ${s.color}`}>{s.num}</div>
            <div className="kpi-label">{s.label}</div>
          </div>
        ))}
      </div>

      {actives.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-navy-700 mb-3 text-sm uppercase tracking-wide">Alertes actives</h2>
          <div className="space-y-3">
            {actives.map(a => (
              <div key={a.id} className={`card border-l-4 ${
                a.status === 'urgent' ? 'border-l-red-500' :
                a.status === 'pending' ? 'border-l-amber-400' : 'border-l-navy-500'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-navy-700">{a.ref}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeColor[a.type] || 'bg-gray-100 text-gray-700'}`}>
                        {a.type}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{a.citoyen}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FiMapPin className="w-3 h-3" />
                        {a.zone} — {a.lat}N {a.lng}O
                      </span>
                      <span>{a.time}</span>
                    </div>
                  </div>
                  <Badge status={a.status} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <a href={"https://maps.google.com/?q=" + a.lat + ",-" + a.lng}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-navy-700 bg-navy-50 px-3 py-2 rounded-xl hover:bg-navy-100 transition-colors">
                    <FiMapPin className="w-3.5 h-3.5" /> Voir carte
                  </a>
                  <a href="tel:17"
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 px-3 py-2 rounded-xl hover:bg-red-100 transition-colors">
                    <FiPhone className="w-3.5 h-3.5" /> Police 17
                  </a>
                  {a.status !== 'progress' && (
                    <button onClick={() => prendre(a.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-navy-700 px-3 py-2 rounded-xl hover:bg-navy-600 transition-colors">
                      <FiCheck className="w-3.5 h-3.5" /> Prendre en charge
                    </button>
                  )}
                  {a.status === 'progress' && (
                    <button onClick={() => cloturer(a.id)}
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
        <div className="card p-0 overflow-hidden">
          <table className="data-table">
            <thead><tr>
              <th>Reference</th><th>Citoyen</th><th>Type</th><th>Zone</th><th>Statut</th>
            </tr></thead>
            <tbody>
              {archivees.map(a => (
                <tr key={a.id} className="opacity-70">
                  <td className="font-mono text-xs font-semibold text-navy-700">{a.ref}</td>
                  <td className="font-medium">{a.citoyen}</td>
                  <td><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor[a.type] || ""}`}>{a.type}</span></td>
                  <td className="text-gray-500 text-xs">{a.zone}</td>
                  <td><Badge status="done" label="Resolu" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
