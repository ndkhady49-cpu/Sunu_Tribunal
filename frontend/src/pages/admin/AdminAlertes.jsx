import { useState } from 'react'
import { FiAlertTriangle, FiMapPin, FiCheck, FiPhone, FiClock, FiZap, FiShield } from 'react-icons/fi'
import Badge from '../../components/common/Badge.jsx'
import toast from 'react-hot-toast'

const INIT_SOS = [
  { id:1, ref:'SOS-2025-00734', initials:'IS', color:'#c8272d', citoyen:'Ibrahima Sow',  type:'Agression', lat:'14.6972', lng:'17.4434', status:'urgent',   time:'Il y a 12 min', zone:'Dakar Plateau' },
  { id:2, ref:'SOS-2025-00733', initials:'FN', color:'#c9a227', citoyen:'Fatou Ndiaye',  type:'Vol',       lat:'14.6845', lng:'17.4521', status:'pending',  time:'Il y a 1h',     zone:'Médina'        },
  { id:3, ref:'SOS-2025-00732', initials:'MD', color:'#0d1f3c', citoyen:'Moussa Diop',   type:'Danger',    lat:'14.7520', lng:'17.3890', status:'progress', time:'Il y a 2h',     zone:'Pikine'        },
  { id:4, ref:'SOS-2025-00728', initials:'CT', color:'#0a7048', citoyen:'Coumba Thiaw',  type:'Vol',       lat:'14.6903', lng:'17.4410', status:'done',     time:'Hier 09:15',    zone:'Dakar Plateau' },
]

const TYPE_CONFIG = {
  Agression: { bg:'#fff1f2', color:'#c8272d', border:'#fecdd3', icon:'⚔️' },
  Vol:       { bg:'#fef9ec', color:'#a0811a', border:'#fde68a', icon:'🔓' },
  Danger:    { bg:'#fff7ed', color:'#c2410c', border:'#fed7aa', icon:'⚠️' },
}

export default function AdminAlertes() {
  const [alertes, setAlertes] = useState(INIT_SOS)

  const prendre = (id) => {
    setAlertes(a => a.map(x => x.id === id ? {...x, status: 'progress'} : x))
    toast.success('Alerte prise en charge')
  }
  const cloturer = (id) => {
    setAlertes(a => a.map(x => x.id === id ? {...x, status: 'done'} : x))
    toast.success('Alerte clôturée ✓')
  }

  const actives   = alertes.filter(a => a.status !== 'done')
  const archivees = alertes.filter(a => a.status === 'done')

  const statCards = [
    { num: actives.filter(a=>a.status==='urgent').length,   label:'Urgentes',  gradient:'linear-gradient(135deg, #c8272d, #e8484e)', shadow:'rgba(232,72,78,0.35)', pulse: true },
    { num: actives.filter(a=>a.status==='pending').length,  label:'En attente',gradient:'linear-gradient(135deg, #a0811a, #c9a227)', shadow:'rgba(201,162,39,0.3)' },
    { num: actives.filter(a=>a.status==='progress').length, label:'En cours',  gradient:'linear-gradient(135deg, #0d1f3c, #1a3a6e)', shadow:'rgba(13,31,60,0.3)' },
    { num: archivees.length,                                label:'Résolues',  gradient:'linear-gradient(135deg, #0a7048, #0f8a58)', shadow:'rgba(10,112,72,0.3)' },
  ]

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-700">Alertes SOS</h1>
        <p className="text-gray-400 text-sm mt-0.5">Gestion des urgences citoyennes en temps réel</p>
      </div>

      {/* Active SOS banner */}
      {actives.length > 0 && (
        <div className="rounded-2xl p-4 flex items-center gap-4 mb-6 animate-scale-in"
          style={{
            background: 'linear-gradient(135deg, #fff5f5, #fee2e2)',
            border: '1px solid #fca5a5',
            boxShadow: '0 4px 24px rgba(232,72,78,0.15)',
          }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse-sos"
            style={{ background: 'linear-gradient(135deg, #c8272d, #e8484e)' }}>
            <FiAlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-red-700 flex items-center gap-2">
              <FiZap className="w-4 h-4" />
              {actives.length} alerte{actives.length > 1 ? 's' : ''} active{actives.length > 1 ? 's' : ''}
            </p>
            <p className="text-sm text-red-500 mt-0.5">Les autorités ont été notifiées automatiquement.</p>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2 bg-red-100 border border-red-200 rounded-xl px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-700">Surveillance active</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((s, i) => (
          <div key={s.label}
            className="kpi-box-gradient animate-fade-up"
            style={{ background: s.gradient, boxShadow: `0 6px 20px ${s.shadow}`, animationDelay:`${i*70}ms`, animationFillMode:'forwards', opacity:0 }}>
            {s.pulse && <div className="w-2 h-2 rounded-full bg-white animate-pulse mb-1" />}
            <div className="kpi-num text-white">{s.num}</div>
            <div className="kpi-label text-white/70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Active alerts */}
      {actives.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="section-title">Alertes actives</h2>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#e8484e' }} />
          </div>
          <div className="space-y-3">
            {actives.map((a, idx) => {
              const typeCfg = TYPE_CONFIG[a.type] || {}
              const leftColor = a.status === 'urgent' ? '#e8484e' : a.status === 'pending' ? '#c9a227' : '#0d1f3c'
              return (
                <div key={a.id}
                  className="bg-white rounded-2xl p-5 border border-l-4 transition-all animate-fade-up"
                  style={{
                    borderColor: '#f3f4f6',
                    borderLeftColor: leftColor,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    animationDelay: `${idx * 80}ms`,
                  }}>
                  <div className="flex items-start gap-4">
                    <div className="avatar-lg flex-shrink-0" style={{ background: a.color }}>
                      {a.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-sm font-bold text-navy-700">{a.ref}</span>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full border"
                              style={{ background: typeCfg.bg, color: typeCfg.color, borderColor: typeCfg.border }}>
                              {typeCfg.icon} {a.type}
                            </span>
                          </div>
                          <p className="font-bold text-gray-800 text-sm">{a.citoyen}</p>
                          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <FiMapPin className="w-3 h-3 text-gray-400" />
                              <strong>{a.zone}</strong> · {a.lat}N {a.lng}O
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <FiClock className="w-3 h-3" /> {a.time}
                            </span>
                          </div>
                        </div>
                        <Badge status={a.status} />
                      </div>

                      <div className="flex gap-2 flex-wrap mt-3 pt-3" style={{ borderTop: '1px solid #f9fafb' }}>
                        <a href={`https://maps.google.com/?q=${a.lat},-${a.lng}`}
                          target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:scale-105 transition-all"
                          style={{ background: '#e8f0fb', color: '#0d1f3c', border: '1px solid #c5d4f2' }}>
                          <FiMapPin className="w-3.5 h-3.5" /> Voir carte
                        </a>
                        <a href="tel:17"
                          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:scale-105 transition-all"
                          style={{ background: '#fff1f2', color: '#c8272d', border: '1px solid #fecdd3' }}>
                          <FiPhone className="w-3.5 h-3.5" /> Police 17
                        </a>
                        {a.status !== 'progress' && (
                          <button onClick={() => prendre(a.id)}
                            className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-xl transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #0d1f3c, #1a3a6e)', boxShadow:'0 2px 8px rgba(13,31,60,0.3)' }}>
                            <FiShield className="w-3.5 h-3.5" /> Prendre en charge
                          </button>
                        )}
                        {a.status === 'progress' && (
                          <button onClick={() => cloturer(a.id)}
                            className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-xl transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #0a7048, #0f8a58)', boxShadow:'0 2px 8px rgba(10,112,72,0.3)' }}>
                            <FiCheck className="w-3.5 h-3.5" /> Clôturer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Archived */}
      <div>
        <h2 className="section-title mb-3">Alertes résolues</h2>
        <div className="card p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Référence</th><th>Citoyen</th><th>Type</th><th>Zone</th><th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {archivees.map(a => {
                const typeCfg = TYPE_CONFIG[a.type] || {}
                return (
                  <tr key={a.id} className="opacity-65">
                    <td><span className="font-mono text-xs font-bold text-navy-700 bg-navy-50 px-2 py-1 rounded-lg">{a.ref}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar text-xs font-bold" style={{ background: a.color }}>{a.initials}</div>
                        <span className="font-semibold text-sm text-gray-600">{a.citoyen}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full border"
                        style={{ background: typeCfg.bg, color: typeCfg.color, borderColor: typeCfg.border }}>
                        {typeCfg.icon} {a.type}
                      </span>
                    </td>
                    <td><span className="text-xs text-gray-400">{a.zone}</span></td>
                    <td><Badge status="done" label="Résolu" /></td>
                  </tr>
                )
              })}
              {archivees.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">Aucune alerte résolue</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
