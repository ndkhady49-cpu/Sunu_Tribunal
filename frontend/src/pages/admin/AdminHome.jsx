import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { FiArrowRight, FiAlertTriangle, FiCalendar, FiFileText, FiFolder, FiUsers, FiTrendingUp, FiZap } from 'react-icons/fi'
import Badge from '../../components/common/Badge.jsx'

const KPIs = [
  {
    num:'142', label:'Dossiers actifs', delta:'+12 ce mois',
    icon: FiFolder,
    gradient: 'linear-gradient(135deg, #0d1f3c 0%, #1a3a6e 100%)',
    shadow: '0 8px 24px rgba(13,31,60,0.35)',
    iconBg: 'rgba(255,255,255,0.18)',
  },
  {
    num:'34', label:"RDV aujourd'hui", delta:'8 en attente',
    icon: FiCalendar,
    gradient: 'linear-gradient(135deg, #0a7048 0%, #0f8a58 100%)',
    shadow: '0 8px 24px rgba(10,112,72,0.35)',
    iconBg: 'rgba(255,255,255,0.18)',
  },
  {
    num:'27', label:'Plaintes à traiter', delta:'5 urgentes',
    icon: FiFileText,
    gradient: 'linear-gradient(135deg, #a0811a 0%, #c9a227 100%)',
    shadow: '0 8px 24px rgba(201,162,39,0.35)',
    iconBg: 'rgba(255,255,255,0.18)',
  },
  {
    num:'3', label:'Alertes SOS', delta:'Actives maintenant',
    icon: FiAlertTriangle,
    gradient: 'linear-gradient(135deg, #c8272d 0%, #e8484e 100%)',
    shadow: '0 8px 24px rgba(232,72,78,0.35)',
    iconBg: 'rgba(255,255,255,0.18)',
    urgent: true,
  },
]

const MONTHLY = [
  { mois:'Jan', val:89  },
  { mois:'Fév', val:104 },
  { mois:'Mar', val:97  },
  { mois:'Avr', val:118 },
  { mois:'Mai', val:142 },
]

const RECENT = [
  { ref:'RDV-2025-04820', citoyen:'Aminata Ba',      initials:'AB', color:'#0d1f3c', type:'RDV',     status:'pending'  },
  { ref:'PLT-2025-09345', citoyen:'Cheikh Fall',      initials:'CF', color:'#c8272d', type:'Plainte', status:'urgent'   },
  { ref:'RDV-2025-04817', citoyen:'Abdoulaye Diallo', initials:'AD', color:'#0a7048', type:'RDV',     status:'progress' },
  { ref:'PLT-2025-09340', citoyen:'Rokhaya Sy',       initials:'RS', color:'#c9a227', type:'Plainte', status:'done'     },
]

const ACTIVITY = [
  { service:'Civil',      pct:72, color:'#0d1f3c' },
  { service:'Pénal',      pct:55, color:'#c8272d' },
  { service:'Commercial', pct:38, color:'#c9a227' },
  { service:'État civil', pct:20, color:'#0f8a58' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'rgba(13,31,60,0.92)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12, padding: '8px 14px',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 2 }}>{label}</p>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{payload[0].value} dossiers</p>
      </div>
    )
  }
  return null
}

export default function AdminHome() {
  const navigate = useNavigate()
  const today = new Date().toLocaleDateString('fr-SN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  return (
    <div className="p-5 lg:p-7 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1 capitalize">{today}</p>
          <h1 className="text-2xl font-bold text-navy-700 leading-tight">Vue générale</h1>
          <p className="text-gray-400 text-sm mt-0.5">TGI Dakar — Plateau</p>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 border border-gray-100"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="w-2 h-2 rounded-full bg-justice-400 animate-pulse" />
            <FiUsers className="w-4 h-4 text-navy-700" />
            <span className="text-sm font-semibold text-navy-700">47 agents actifs</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIs.map((k, i) => (
          <div key={k.label}
            className="kpi-box-gradient animate-fade-up"
            style={{
              background: k.gradient,
              boxShadow: k.shadow,
              animationDelay: `${i * 80}ms`,
              animationFillMode: 'forwards',
              opacity: 0,
            }}>
            <div className="flex items-center justify-between mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: k.iconBg }}>
                <k.icon className="w-5 h-5 text-white" />
              </div>
              {k.urgent && (
                <span className="flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <div className="kpi-num text-white">{k.num}</div>
            <div className="kpi-label text-white/65">{k.label}</div>
            <div className="kpi-delta text-white/75 flex items-center gap-1">
              {k.urgent ? '⚠ ' : <FiTrendingUp className="w-3 h-3" />}
              {k.delta}
            </div>
          </div>
        ))}
      </div>

      {/* SOS Alert Banner */}
      <div
        className="rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all hover:scale-[1.01] animate-fade-up"
        style={{
          background: 'linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%)',
          border: '1px solid #fca5a5',
          boxShadow: '0 4px 24px rgba(232,72,78,0.12)',
          animationDelay: '350ms', animationFillMode: 'forwards', opacity: 0
        }}
        onClick={() => navigate('/admin/alertes')}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse-sos"
          style={{ background: 'linear-gradient(135deg, #c8272d, #e8484e)' }}>
          <FiAlertTriangle className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-red-700 text-sm flex items-center gap-2">
            <FiZap className="w-4 h-4" /> 3 alertes SOS actives
          </p>
          <p className="text-xs text-red-500 mt-0.5">Les autorités ont été notifiées — Confirmer la prise en charge</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-red-700 transition-colors">
          Voir <FiArrowRight className="w-3 h-3" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Area Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-navy-700 text-sm">Dossiers par mois</h3>
              <p className="text-xs text-gray-400 mt-0.5">Évolution 2025</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"
              style={{ background: 'rgba(15,138,88,0.1)', color: '#0a7048', border: '1px solid rgba(15,138,88,0.2)' }}>
              <FiTrendingUp className="w-3 h-3" /> +18% ce mois
            </span>
          </div>
          <ResponsiveContainer width="100%" height={175}>
            <AreaChart data={MONTHLY} margin={{ top:4, right:4, bottom:0, left:-24 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d1f3c" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#0d1f3c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mois" tick={{ fontSize:11, fill:'#9ca3af', fontFamily:'DM Sans' }}
                axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#9ca3af', fontFamily:'DM Sans' }}
                axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Area type="monotone" dataKey="val" stroke="#0d1f3c" strokeWidth={2.5}
                fill="url(#areaGrad)" dot={{ fill:'#0d1f3c', r:4, strokeWidth:2, stroke:'#fff' }}
                activeDot={{ r:6, fill:'#0d1f3c', stroke:'#fff', strokeWidth:2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Activity by service */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-navy-700 text-sm">Activité par service</h3>
              <p className="text-xs text-gray-400 mt-0.5">Volume relatif · ce mois</p>
            </div>
          </div>
          <div className="space-y-4 pt-1">
            {ACTIVITY.map((b, i) => (
              <div key={b.service} className="animate-fade-up"
                style={{ animationDelay: `${i * 100}ms`, animationFillMode:'forwards', opacity:0 }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: b.color }} />
                    <span className="text-xs font-semibold text-gray-600">{b.service}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: b.color }}>{b.pct}%</span>
                </div>
                <div className="progress-bar h-2.5 rounded-full">
                  <div className="progress-fill rounded-full" style={{ width: b.pct + '%', background: b.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent requests table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <h3 className="font-bold text-navy-700 text-sm">Dernières demandes</h3>
            <p className="text-xs text-gray-400 mt-0.5">4 nouvelles aujourd'hui</p>
          </div>
          <button onClick={() => navigate('/admin/rdv')}
            className="flex items-center gap-1.5 text-xs font-semibold text-navy-700 bg-navy-50 border border-navy-100
              hover:bg-navy-100 px-3 py-1.5 rounded-lg transition-colors">
            Voir tout <FiArrowRight className="w-3 h-3" />
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Citoyen</th>
              <th>Type</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {RECENT.map(r => (
              <tr key={r.ref} className="cursor-pointer" onClick={() => navigate('/admin/rdv')}>
                <td>
                  <span className="font-mono font-bold text-navy-700 text-xs tracking-tight bg-navy-50 px-2 py-1 rounded-lg">
                    {r.ref}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="avatar text-xs" style={{ background: r.color }}>{r.initials}</div>
                    <span className="font-medium text-gray-700 text-sm">{r.citoyen}</span>
                  </div>
                </td>
                <td>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">{r.type}</span>
                </td>
                <td><Badge status={r.status} /></td>
                <td>
                  <FiArrowRight className="w-4 h-4 text-gray-300" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
