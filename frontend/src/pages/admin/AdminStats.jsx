import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import toast from 'react-hot-toast'
import { statsAPI, messageErreur } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import usePolling from '../../hooks/usePolling.js'
import { CHARTE, PALETTE, AXE, INFOBULLE } from '../../utils/couleurs.js'

const Vide = ({ texte = 'Pas encore de donnees' }) => (
  <p className="text-xs text-gray-400 text-center py-10">{texte}</p>
)

export default function AdminStats() {
  const { user } = useAuth()
  const [data, setData] = useState(null)

  usePolling((auto) => {
    statsAPI.analytique()
      .then(r => setData(r.data))
      .catch(err => { if (!auto) toast.error(messageErreur(err, 'Impossible de charger les statistiques.')) })
  })

  const k = data?.kpis || {}
  const annee = data?.annee || new Date().getFullYear()
  const KPIs = [
    { num: k.traites ?? '—', label:`Dossiers traites ${annee}`, delta:`sur ${k.total ?? 0} ouverts`, color:'border-t-navy-700' },
    { num: k.taux_resolution != null ? `${k.taux_resolution}%` : '—', label:'Taux de resolution',
      delta:`${k.clos ?? 0} dossier${k.clos > 1 ? 's' : ''} clos`, color:'border-t-justice-400' },
    { num: k.delai_moyen != null ? `${k.delai_moyen}j` : '—', label:'Delai moyen', delta:'depot → decision', color:'border-t-navy-300' },
    { num: k.citoyens ?? '—', label:'Citoyens inscrits', delta:`+${k.citoyens_mois ?? 0} ce mois`, color:'border-t-navy-400' },
  ]
  const delai = data?.delai || []
  const evolution = delai.length >= 2 ? delai[delai.length - 1].jours - delai[0].jours : null

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-700">Statistiques</h1>
        <p className="text-gray-500 text-sm mt-1">
          Tableau de bord analytique {annee}{user?.role === 'juge' ? ' · vos dossiers' : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPIs.map(kpi => (
          <div key={kpi.label} className={`kpi-box border-t-2 ${kpi.color}`}>
            <div className="kpi-num">{kpi.num}</div>
            <div className="kpi-label">{kpi.label}</div>
            <div className="text-xs text-justice-500 font-semibold mt-1">{kpi.delta}</div>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold text-navy-700 text-sm uppercase tracking-wide mb-4">
          Dossiers par mois et categorie {annee}
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data?.mensuel || []} margin={{ left:-15 }}>
            <XAxis dataKey="mois" tick={AXE} axisLine={false} tickLine={false} />
            <YAxis tick={AXE} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={INFOBULLE} />
            <Legend wrapperStyle={{ fontSize:12 }} />
            <Bar dataKey="civil"      name="Civil"      fill={CHARTE.encre} radius={[4,4,0,0]} />
            <Bar dataKey="penal"      name="Penal"      fill={CHARTE.bordeaux} radius={[4,4,0,0]} />
            <Bar dataKey="commercial" name="Commercial" fill={CHARTE.or} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-semibold text-navy-700 text-sm uppercase tracking-wide mb-4">
            Repartition des plaintes
          </h3>
          {data && data.repartition.length === 0 ? <Vide texte="Aucune plainte cette annee" /> : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={data?.repartition || []} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                    dataKey="value" paddingAngle={3}>
                    {(data?.repartition || []).map((e, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={INFOBULLE}
                    formatter={(v, n, p) => [`${v}% (${p.payload.nombre})`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {(data?.repartition || []).map(e => (
                  <div key={e.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PALETTE[(data?.repartition || []).indexOf(e) % PALETTE.length] }} />
                    <span className="text-xs text-gray-600 flex-1">{e.name}</span>
                    <span className="text-xs font-bold text-navy-700">{e.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-navy-700 text-sm uppercase tracking-wide mb-4">
            Delai moyen de traitement (jours)
          </h3>
          {data && delai.length === 0 ? <Vide texte="Aucun dossier traite pour le moment" /> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={delai} margin={{ left:-20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHARTE.trait} />
                  <XAxis dataKey="mois" tick={AXE} axisLine={false} tickLine={false} />
                  <YAxis tick={AXE} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={INFOBULLE} />
                  <Line type="monotone" dataKey="jours" name="Jours" stroke={CHARTE.baobab}
                    strokeWidth={3} dot={{ fill: CHARTE.baobab, r:5 }} />
                </LineChart>
              </ResponsiveContainer>
              {evolution !== null && (
                <p className="text-xs text-justice-500 font-semibold text-center mt-2">
                  {evolution <= 0
                    ? `Delai reduit de ${Math.abs(evolution).toFixed(1)} j depuis ${delai[0].mois}`
                    : `Delai en hausse de ${evolution.toFixed(1)} j depuis ${delai[0].mois}`}
                </p>
              )}
            </>
          )}
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
            {data && data.performance.length === 0 && (
              <tr><td colSpan={5} className="text-center py-6 text-gray-400 text-sm">Aucun dossier cette annee</td></tr>
            )}
            {(data?.performance || []).map(r => (
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
