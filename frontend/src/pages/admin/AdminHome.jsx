import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Badge from '../../components/common/Badge.jsx'
import { FiArrowRight, FiAlertTriangle } from 'react-icons/fi'

const KPIs = [
  { num:'142', label:'Dossiers actifs',    delta:'+12 ce mois',  color:'border-t-navy-700'    },
  { num:'34',  label:'RDV ce jour',        delta:'8 en attente', color:'border-t-justice-400' },
  { num:'27',  label:'Plaintes a traiter', delta:'5 urgentes',   color:'border-t-amber-400'   },
  { num:'3',   label:'Alertes SOS',        delta:'Actives',      color:'border-t-red-500', urgent:true },
]

const MONTHLY = [
  { mois:'Jan', val:89  },
  { mois:'Fev', val:104 },
  { mois:'Mar', val:97  },
  { mois:'Avr', val:118 },
  { mois:'Mai', val:42  },
]

const RECENT = [
  { ref:'RDV-2025-04820', citoyen:'Aminata Ba',      type:'RDV',     status:'pending'  },
  { ref:'PLT-2025-09345', citoyen:'Cheikh Fall',      type:'Plainte', status:'urgent'   },
  { ref:'RDV-2025-04817', citoyen:'Abdoulaye Diallo', type:'RDV',     status:'progress' },
  { ref:'PLT-2025-09340', citoyen:'Rokhaya Sy',       type:'Plainte', status:'done'     },
]

const ACTIVITY = [
  { service:'Civil',      pct:72, color:'#0d1f3c' },
  { service:'Penal',      pct:55, color:'#e8484e' },
  { service:'Commercial', pct:38, color:'#e08800' },
  { service:'Etat civil', pct:20, color:'#0f8a58' },
]

export default function AdminHome() {
  const navigate = useNavigate()

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-700">Vue generale</h1>
        <p className="text-gray-500 text-sm mt-1">Vendredi 2 mai 2025 · TGI Dakar</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPIs.map(k => (
          <div key={k.label} className={`kpi-box border-t-4 ${k.color}`}>
            <div className={`kpi-num ${k.urgent ? 'text-red-600' : ''}`}>{k.num}</div>
            <div className="kpi-label">{k.label}</div>
            <div className={`text-xs font-semibold mt-1 ${k.urgent ? 'text-red-500' : 'text-gray-400'}`}>
              {k.urgent && '⚠ '}{k.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 mb-6 cursor-pointer hover:bg-red-100 transition-colors"
        onClick={() => navigate('/admin/alertes')}>
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-red-700 text-sm">3 alertes SOS actives</p>
          <p className="text-xs text-red-500 mt-0.5">Les autorites ont ete notifiees - Confirmer la prise en charge</p>
        </div>
        <FiArrowRight className="w-5 h-5 text-red-400" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-semibold text-navy-700 text-sm uppercase tracking-wide mb-4">
            Dossiers par mois 2025
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={MONTHLY} margin={{ top:0, right:0, bottom:0, left:-20 }}>
              <XAxis dataKey="mois" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius:12, border:'none', fontSize:12 }} />
              <Bar dataKey="val" radius={[6,6,0,0]}>
                {MONTHLY.map((e, i) => <Cell key={i} fill={i === 3 ? '#c9a227' : '#0d1f3c'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-navy-700 text-sm uppercase tracking-wide mb-4">
            Activite par service
          </h3>
          <div className="space-y-4 pt-2">
            {ACTIVITY.map(b => (
              <div key={b.service} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-20 flex-shrink-0">{b.service}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: b.pct + '%', background: b.color }} />
                </div>
                <span className="text-xs font-bold text-navy-700 w-8 text-right">{b.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-navy-700 text-sm uppercase tracking-wide">Dernieres demandes</h3>
          <button onClick={() => navigate('/admin/rdv')}
            className="text-xs text-justice-500 font-semibold hover:underline flex items-center gap-1">
            Voir tout <FiArrowRight className="w-3 h-3" />
          </button>
        </div>
        <table className="data-table">
          <thead><tr><th>Reference</th><th>Citoyen</th><th>Type</th><th>Statut</th></tr></thead>
          <tbody>
            {RECENT.map(r => (
              <tr key={r.ref} className="cursor-pointer" onClick={() => navigate('/admin/rdv')}>
                <td className="font-mono font-semibold text-navy-700 text-xs">{r.ref}</td>
                <td className="font-medium">{r.citoyen}</td>
                <td className="text-gray-500">{r.type}</td>
                <td><Badge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
