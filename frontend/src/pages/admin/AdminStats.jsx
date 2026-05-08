import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'

const MONTHLY = [
  { mois:'Jan', civil:45, penal:28, commercial:16 },
  { mois:'Fev', civil:52, penal:35, commercial:17 },
  { mois:'Mar', civil:48, penal:32, commercial:17 },
  { mois:'Avr', civil:62, penal:38, commercial:18 },
  { mois:'Mai', civil:22, penal:14, commercial:6  },
]

const PIE_DATA = [
  { name:'Agression',    value:38, color:'#e8484e' },
  { name:'Escroquerie',  value:27, color:'#e08800' },
  { name:'Foncier',      value:20, color:'#0d1f3c' },
  { name:'Cyber',        value:10, color:'#0f8a58' },
  { name:'Autres',       value:5,  color:'#9ca3af' },
]

const DELAI = [
  { mois:'Jan', jours:3.8 },
  { mois:'Fev', jours:3.4 },
  { mois:'Mar', jours:3.1 },
  { mois:'Avr', jours:2.8 },
  { mois:'Mai', jours:2.4 },
]

const KPIs = [
  { num:'1 248', label:'Dossiers traites 2025', delta:'+18% vs 2024',   color:'border-t-navy-700'    },
  { num:'94%',   label:'Taux de resolution',    delta:'+6 points',      color:'border-t-justice-400' },
  { num:'2.4j',  label:'Delai moyen',           delta:'-1.1j ameliore', color:'border-t-gold-400'    },
  { num:'1 847', label:'Citoyens inscrits',      delta:'+234 ce mois',   color:'border-t-blue-500'    },
]

const PERF = [
  { service:'Civil',      ouverts:312, traites:289, taux:'93%', delai:'2.1j' },
  { service:'Penal',      ouverts:187, traites:168, taux:'90%', delai:'3.2j' },
  { service:'Commercial', ouverts:98,  traites:95,  taux:'97%', delai:'1.8j' },
  { service:'Etat civil', ouverts:74,  traites:74,  taux:'100%',delai:'0.5j' },
  { service:'Cyber',      ouverts:43,  traites:35,  taux:'81%', delai:'5.4j' },
]

export default function AdminStats() {
  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-700">Statistiques</h1>
        <p className="text-gray-500 text-sm mt-1">Tableau de bord analytique 2025</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPIs.map(k => (
          <div key={k.label} className={`kpi-box border-t-4 ${k.color}`}>
            <div className="kpi-num">{k.num}</div>
            <div className="kpi-label">{k.label}</div>
            <div className="text-xs text-justice-500 font-semibold mt-1">{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold text-navy-700 text-sm uppercase tracking-wide mb-4">
          Dossiers par mois et categorie 2025
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={MONTHLY} margin={{ left:-15 }}>
            <XAxis dataKey="mois" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius:12, border:'none', fontSize:12 }} />
            <Legend wrapperStyle={{ fontSize:12 }} />
            <Bar dataKey="civil"      name="Civil"      fill="#0d1f3c" radius={[4,4,0,0]} />
            <Bar dataKey="penal"      name="Penal"      fill="#e8484e" radius={[4,4,0,0]} />
            <Bar dataKey="commercial" name="Commercial" fill="#c9a227" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-semibold text-navy-700 text-sm uppercase tracking-wide mb-4">
            Repartition des plaintes
          </h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                  dataKey="value" paddingAngle={3}>
                  {PIE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:10, fontSize:12, border:'none' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {PIE_DATA.map(e => (
                <div key={e.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:e.color }} />
                  <span className="text-xs text-gray-600 flex-1">{e.name}</span>
                  <span className="text-xs font-bold text-navy-700">{e.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-navy-700 text-sm uppercase tracking-wide mb-4">
            Delai moyen de traitement (jours)
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={DELAI} margin={{ left:-20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} domain={[1,5]} />
              <Tooltip contentStyle={{ borderRadius:10, fontSize:12, border:'none' }} />
              <Line type="monotone" dataKey="jours" name="Jours" stroke="#0f8a58"
                strokeWidth={3} dot={{ fill:'#0f8a58', r:5 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-justice-500 font-semibold text-center mt-2">
            Delai reduit de 37% depuis janvier
          </p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-navy-700 text-sm uppercase tracking-wide">Performance par service</h3>
        </div>
        <table className="data-table">
          <thead><tr>
            <th>Service</th><th>Ouverts</th><th>Traites</th><th>Taux</th><th>Delai moy.</th>
          </tr></thead>
          <tbody>
            {PERF.map(r => (
              <tr key={r.service}>
                <td className="font-semibold">{r.service}</td>
                <td>{r.ouverts}</td>
                <td>{r.traites}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-20">
                      <div className="h-full bg-justice-400 rounded-full" style={{ width: r.taux }} />
                    </div>
                    <span className="font-bold text-justice-500 text-xs">{r.taux}</span>
                  </div>
                </td>
                <td className="font-semibold text-navy-700">{r.delai}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
