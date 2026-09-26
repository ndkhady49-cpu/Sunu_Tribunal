import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge.jsx'
import { FiArrowRight, FiAlertTriangle } from 'react-icons/fi'
import { statsAPI, messageErreur } from '../../services/api.js'
import { CHARTE, COULEUR_SERVICE, AXE, INFOBULLE } from '../../utils/couleurs.js'
import usePolling from '../../hooks/usePolling.js'
import { aujourdhuiLong } from '../../utils/format.js'

export default function AdminHome() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)

  usePolling((auto) => {
    statsAPI.dashboard()
      .then(r => setData(r.data))
      .catch(err => { if (!auto) toast.error(messageErreur(err, 'Impossible de charger le tableau de bord.')) })
  })

  const k = data?.kpis || {}
  const KPIs = [
    { num: k.dossiers_actifs ?? '—',    label:'Dossiers actifs',    delta:`+${k.nouveaux_mois ?? 0} ce mois`,   color:'border-t-navy-700',    to:'/admin/plaintes' },
    { num: k.rdv_jour ?? '—',           label:'RDV ce jour',        delta:`${k.rdv_en_attente ?? 0} en attente`, color:'border-t-justice-400', to:'/admin/rdv' },
    { num: k.plaintes_a_traiter ?? '—', label:'Plaintes a traiter', delta:`${k.plaintes_urgentes ?? 0} urgente${k.plaintes_urgentes > 1 ? 's' : ''}`, color:'border-t-navy-300', to:'/admin/plaintes' },
    { num: k.alertes_actives ?? '—',    label:'Alertes SOS',        delta: k.alertes_non_prises ? `${k.alertes_non_prises} a prendre en charge` : 'Actives',
      color:'border-t-red-500', urgent: k.alertes_actives > 0, to:'/admin/alertes' },
  ]
  const mensuel = data?.mensuel || []
  const moisCourant = mensuel.length - 1

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-700">Vue generale</h1>
        <p className="text-gray-500 text-sm mt-1">{aujourdhuiLong()}{data ? ` · ${data.tribunal}` : ''}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPIs.map(kpi => (
          <div key={kpi.label} className={`kpi-box border-t-2 ${kpi.color} cursor-pointer`} onClick={() => navigate(kpi.to)}>
            <div className={`kpi-num ${kpi.urgent ? 'text-red-600' : ''}`}>{kpi.num}</div>
            <div className="kpi-label">{kpi.label}</div>
            <div className={`text-xs font-semibold mt-1 ${kpi.urgent ? 'text-red-500' : 'text-gray-400'}`}>
              {kpi.urgent && '⚠ '}{kpi.delta}
            </div>
          </div>
        ))}
      </div>

      {k.alertes_actives > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 mb-6 cursor-pointer hover:bg-red-100 transition-colors"
          onClick={() => navigate('/admin/alertes')}>
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiAlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-700 text-sm">
              {k.alertes_actives} alerte{k.alertes_actives > 1 ? 's' : ''} SOS active{k.alertes_actives > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              {k.alertes_non_prises
                ? `${k.alertes_non_prises} en attente - Confirmer la prise en charge`
                : 'Toutes prises en charge - Cloturer une fois resolues'}
            </p>
          </div>
          <FiArrowRight className="w-5 h-5 text-red-400" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-semibold text-navy-700 text-sm uppercase tracking-wide mb-4">
            Dossiers par mois {new Date().getFullYear()}
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={mensuel} margin={{ top:0, right:0, bottom:0, left:-20 }}>
              <XAxis dataKey="mois" tick={AXE} axisLine={false} tickLine={false} />
              <YAxis tick={AXE} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={INFOBULLE} cursor={{ fill: CHARTE.ivoire }} formatter={v => [v, 'Dossiers']} />
              <Bar dataKey="val" radius={[6,6,0,0]}>
                {mensuel.map((e, i) => <Cell key={i} fill={i === moisCourant ? CHARTE.or : CHARTE.encre} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-navy-700 text-sm uppercase tracking-wide mb-4">
            Activite par service
          </h3>
          <div className="space-y-4 pt-2">
            {(data?.activite || []).map(b => (
              <div key={b.service} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-20 flex-shrink-0">{b.service}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: b.pct + '%', background: COULEUR_SERVICE[b.service] || CHARTE.encre }} />
                </div>
                <span className="text-xs font-bold text-navy-700 w-8 text-right">{b.pct}%</span>
              </div>
            ))}
            {data && !k.dossiers_actifs && <p className="text-xs text-gray-400">Aucun dossier en cours</p>}
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
            {data && data.recents.length === 0 && (
              <tr><td colSpan={4} className="text-center py-6 text-gray-400 text-sm">Aucune demande pour le moment</td></tr>
            )}
            {(data?.recents || []).map(r => (
              <tr key={r.ref} className="cursor-pointer" onClick={() => navigate(r.lien)}>
                <td className="font-mono font-semibold text-navy-700 text-xs">{r.ref}</td>
                <td className="font-medium">{r.citoyen}</td>
                <td className="text-gray-500">{r.type}</td>
                <td><Badge status={r.status} label={r.label} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
