import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend
} from 'recharts'
import { FiTrendingDown, FiTrendingUp, FiUsers, FiCheckCircle, FiClock, FiFolder } from 'react-icons/fi'

const MONTHLY = [
  { mois:'Jan', civil:45, penal:28, commercial:16 },
  { mois:'Fév', civil:52, penal:35, commercial:17 },
  { mois:'Mar', civil:48, penal:32, commercial:17 },
  { mois:'Avr', civil:62, penal:38, commercial:18 },
  { mois:'Mai', civil:22, penal:14, commercial:6  },
]

const PIE_DATA = [
  { name:'Agression',   value:38, color:'#c8272d' },
  { name:'Escroquerie', value:27, color:'#c9a227' },
  { name:'Foncier',     value:20, color:'#0d1f3c' },
  { name:'Cyber',       value:10, color:'#0a7048' },
  { name:'Autres',      value:5,  color:'#9ca3af' },
]

const DELAI = [
  { mois:'Jan', jours:3.8 },
  { mois:'Fév', jours:3.4 },
  { mois:'Mar', jours:3.1 },
  { mois:'Avr', jours:2.8 },
  { mois:'Mai', jours:2.4 },
]

const KPIs = [
  { num:'1 248', label:'Dossiers traités 2025', delta:'+18% vs 2024',   icon: FiFolder,      gradient:'linear-gradient(135deg, #0d1f3c, #1a3a6e)', shadow:'rgba(13,31,60,0.3)',    trend:'up' },
  { num:'94%',   label:'Taux de résolution',    delta:'+6 points',      icon: FiCheckCircle, gradient:'linear-gradient(135deg, #0a7048, #0f8a58)', shadow:'rgba(10,112,72,0.3)',   trend:'up' },
  { num:'2.4j',  label:'Délai moyen',           delta:'-1.1j amélioré', icon: FiClock,       gradient:'linear-gradient(135deg, #a0811a, #c9a227)', shadow:'rgba(201,162,39,0.3)', trend:'down' },
  { num:'1 847', label:'Citoyens inscrits',      delta:'+234 ce mois',   icon: FiUsers,       gradient:'linear-gradient(135deg, #c8272d, #e8484e)', shadow:'rgba(232,72,78,0.3)', trend:'up' },
]

const PERF = [
  { service:'Civil',      ouverts:312, traites:289, taux:'93%', taux_num:93, delai:'2.1j', color:'#0d1f3c' },
  { service:'Pénal',      ouverts:187, traites:168, taux:'90%', taux_num:90, delai:'3.2j', color:'#c8272d' },
  { service:'Commercial', ouverts:98,  traites:95,  taux:'97%', taux_num:97, delai:'1.8j', color:'#c9a227' },
  { service:'État civil', ouverts:74,  traites:74,  taux:'100%',taux_num:100,delai:'0.5j', color:'#0a7048' },
  { service:'Cyber',      ouverts:43,  traites:35,  taux:'81%', taux_num:81, delai:'5.4j', color:'#6b7280' },
]

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background:'rgba(13,31,60,0.92)', backdropFilter:'blur(12px)',
        border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'8px 14px',
      }}>
        <p style={{ color:'rgba(255,255,255,0.6)', fontSize:11, marginBottom:4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || '#fff', fontWeight:700, fontSize:12 }}>
            {p.name}: <span style={{ color:'#fff' }}>{p.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AdminStats() {
  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-700">Statistiques</h1>
        <p className="text-gray-400 text-sm mt-0.5">Tableau de bord analytique 2025 · TGI Dakar</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPIs.map((k, i) => (
          <div key={k.label}
            className="kpi-box-gradient animate-fade-up"
            style={{ background: k.gradient, boxShadow: `0 6px 24px ${k.shadow}`, animationDelay:`${i*80}ms`, animationFillMode:'forwards', opacity:0 }}>
            <div className="flex items-center justify-between mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'rgba(255,255,255,0.18)' }}>
                <k.icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                {k.trend === 'up'
                  ? <FiTrendingUp className="w-3 h-3" />
                  : <FiTrendingDown className="w-3 h-3" />
                }
              </div>
            </div>
            <div className="kpi-num text-white">{k.num}</div>
            <div className="kpi-label text-white/65">{k.label}</div>
            <div className="kpi-delta text-white/80">{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Stacked Bar Chart */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-navy-700 text-sm">Dossiers par mois et catégorie</h3>
            <p className="text-xs text-gray-400 mt-0.5">Répartition 2025</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"
            style={{ background: 'rgba(15,138,88,0.1)', color: '#0a7048', border: '1px solid rgba(15,138,88,0.2)' }}>
            <FiTrendingUp className="w-3 h-3" /> +18% ce mois
          </span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={MONTHLY} margin={{ left:-15 }}>
            <XAxis dataKey="mois" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill:'rgba(0,0,0,0.03)', radius:8 }} />
            <Legend wrapperStyle={{ fontSize:12, paddingTop:8 }} />
            <Bar dataKey="civil"      name="Civil"      fill="#0d1f3c" radius={[4,4,0,0]} stackId="a" />
            <Bar dataKey="penal"      name="Pénal"      fill="#c8272d" radius={[0,0,0,0]} stackId="a" />
            <Bar dataKey="commercial" name="Commercial" fill="#c9a227" radius={[4,4,0,0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie + Area */}
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Pie Chart */}
        <div className="card">
          <div className="mb-4">
            <h3 className="font-bold text-navy-700 text-sm">Répartition des plaintes</h3>
            <p className="text-xs text-gray-400 mt-0.5">Par nature · 2025</p>
          </div>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                  dataKey="value" paddingAngle={3}>
                  {PIE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:10, fontSize:12, border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.12)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2.5">
              {PIE_DATA.map(e => (
                <div key={e.name} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:e.color }} />
                  <span className="text-xs text-gray-600 flex-1">{e.name}</span>
                  <span className="text-xs font-bold text-navy-700">{e.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Area Chart */}
        <div className="card">
          <div className="mb-4">
            <h3 className="font-bold text-navy-700 text-sm">Délai moyen de traitement</h3>
            <p className="text-xs text-gray-400 mt-0.5">En jours · Évolution 2025</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={DELAI} margin={{ left:-20 }}>
              <defs>
                <linearGradient id="delaiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f8a58" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#0f8a58" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mois" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} domain={[1,5]} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="jours" name="Jours" stroke="#0a7048" strokeWidth={2.5}
                fill="url(#delaiGrad)" dot={{ fill:'#0a7048', r:4, strokeWidth:2, stroke:'#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-2 mt-3 rounded-xl px-4 py-2.5"
            style={{ background: 'rgba(10,112,72,0.08)', border: '1px solid rgba(15,138,88,0.2)' }}>
            <FiTrendingDown className="w-4 h-4" style={{ color: '#0a7048' }} />
            <p className="text-xs font-bold" style={{ color: '#0a7048' }}>Délai réduit de 37% depuis janvier</p>
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <h3 className="font-bold text-navy-700 text-sm">Performance par service</h3>
          <p className="text-xs text-gray-400 mt-0.5">Taux de résolution et délais moyens</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Service</th><th>Ouverts</th><th>Traités</th><th>Taux de résolution</th><th>Délai moy.</th>
            </tr>
          </thead>
          <tbody>
            {PERF.map(r => (
              <tr key={r.service}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: r.color }} />
                    <span className="font-semibold text-navy-700">{r.service}</span>
                  </div>
                </td>
                <td><span className="text-gray-600">{r.ouverts}</span></td>
                <td><span className="font-semibold text-gray-700">{r.traites}</span></td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 progress-bar h-2 max-w-28">
                      <div className="progress-fill h-2" style={{ width: r.taux, background: r.color }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: r.color, minWidth:32 }}>{r.taux}</span>
                  </div>
                </td>
                <td>
                  <span className="font-bold text-navy-700 text-sm bg-navy-50 px-2.5 py-1 rounded-lg border border-navy-100">
                    {r.delai}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
