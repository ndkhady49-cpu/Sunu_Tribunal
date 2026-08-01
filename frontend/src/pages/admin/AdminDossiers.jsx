import { useState } from 'react'
import { FiSearch, FiFilter, FiEye, FiCalendar, FiUser, FiTag } from 'react-icons/fi'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'

const CAT_COLORS = {
  Civil:        { bg: '#e8f0fb', color: '#0d1f3c', border: '#c5d4f2' },
  Penal:        { bg: '#fff1f2', color: '#c8272d', border: '#fecdd3' },
  Commercial:   { bg: '#fef9ec', color: '#a0811a', border: '#fde68a' },
  'Etat civil': { bg: '#ecfdf5', color: '#0a7048', border: '#bbf7d0' },
}

const DOSSIERS = [
  { id:1, ref:'DOS-2025-00142', citoyen:'Cheikh Fall',      initials:'CF', color:'#c8272d', categorie:'Penal',       juge:'M. Badji',  ouverture:'01/05', status:'urgent',   phases:['Dépôt','Instruction en cours'] },
  { id:2, ref:'DOS-2025-00141', citoyen:'Aissatou Niang',   initials:'AN', color:'#0d1f3c', categorie:'Civil',        juge:'Mme Sarr',  ouverture:'30/04', status:'progress', phases:['Dépôt','Enregistré','Instruction'] },
  { id:3, ref:'DOS-2025-00138', citoyen:'Ousmane Faye',     initials:'OF', color:'#c9a227', categorie:'Commercial',   juge:'M. Ly',     ouverture:'28/04', status:'progress', phases:['Dépôt','Analyse préliminaire'] },
  { id:4, ref:'DOS-2025-00134', citoyen:'Rokhaya Sy',       initials:'RS', color:'#0a7048', categorie:'Penal',        juge:'M. Badji',  ouverture:'24/04', status:'done',     phases:['Dépôt','Instruction','Décision rendue'] },
  { id:5, ref:'DOS-2025-00129', citoyen:'Lamine Traore',    initials:'LT', color:'#0d1f3c', categorie:'Civil',        juge:'Mme Sarr',  ouverture:'20/04', status:'done',     phases:['Dépôt','Instruction','Clôture'] },
  { id:6, ref:'DOS-2025-00125', citoyen:'Mariama Kouyate',  initials:'MK', color:'#0a7048', categorie:'Etat civil',   juge:'M. Diouf',  ouverture:'18/04', status:'done',     phases:['Dépôt','Traité'] },
  { id:7, ref:'DOS-2025-00118', citoyen:'Pape Diallo',      initials:'PD', color:'#9ca3af', categorie:'Commercial',   juge:'M. Ly',     ouverture:'14/04', status:'rejected', phases:['Dépôt','Rejeté — pièces insuffisantes'] },
]

export default function AdminDossiers() {
  const [search, setSearch] = useState('')
  const [catFilter, setCat] = useState('all')
  const [detail, setDetail] = useState(null)

  const cats = ['all','Civil','Penal','Commercial','Etat civil']

  const filtered = DOSSIERS.filter(d =>
    (catFilter === 'all' || d.categorie === catFilter) &&
    (d.citoyen.toLowerCase().includes(search.toLowerCase()) ||
     d.ref.toLowerCase().includes(search.toLowerCase()))
  )

  const stats = [
    { num: DOSSIERS.filter(d => d.status !== 'done' && d.status !== 'rejected').length, label:'Actifs',   gradient:'linear-gradient(135deg, #0d1f3c, #1a3a6e)', shadow:'rgba(13,31,60,0.3)' },
    { num: DOSSIERS.filter(d => d.status === 'urgent').length,   label:'Urgents',   gradient:'linear-gradient(135deg, #c8272d, #e8484e)', shadow:'rgba(232,72,78,0.3)' },
    { num: DOSSIERS.filter(d => d.status === 'done').length,     label:'Clôturés',  gradient:'linear-gradient(135deg, #0a7048, #0f8a58)', shadow:'rgba(10,112,72,0.3)' },
    { num: DOSSIERS.filter(d => d.status === 'rejected').length, label:'Rejetés',   gradient:'linear-gradient(135deg, #6b7280, #9ca3af)', shadow:'rgba(107,114,128,0.3)' },
  ]

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-700">Suivi des dossiers</h1>
        <p className="text-gray-400 text-sm mt-0.5">{DOSSIERS.length} dossiers au total · TGI Dakar</p>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          <input className="form-input pl-10" placeholder="Rechercher par nom ou référence..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`chip whitespace-nowrap flex-shrink-0 transition-all ${
                catFilter === c ? 'chip-navy' : 'chip-outline'
              }`}>
              {c === 'all' ? 'Tous' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden overflow-x-auto">
        <table className="data-table min-w-full">
          <thead>
            <tr>
              <th>N° Dossier</th><th>Citoyen</th><th>Catégorie</th><th>Juge assigné</th><th>Ouverture</th><th>Statut</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => {
              const cat = CAT_COLORS[d.categorie] || CAT_COLORS['Etat civil']
              return (
                <tr key={d.id}>
                  <td>
                    <span className="font-mono text-xs font-bold text-navy-700 bg-navy-50 px-2 py-1 rounded-lg">
                      {d.ref}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="avatar text-xs font-bold" style={{ background: d.color }}>{d.initials}</div>
                      <span className="font-semibold text-gray-700 text-sm">{d.citoyen}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full border"
                      style={{ background: cat.bg, color: cat.color, borderColor: cat.border }}>
                      {d.categorie}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                      <FiUser className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {d.juge}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <FiCalendar className="w-3 h-3" /> {d.ouverture}/25
                    </div>
                  </td>
                  <td><Badge status={d.status} /></td>
                  <td>
                    <button onClick={() => setDetail(d)}
                      className="flex items-center gap-1.5 text-xs font-bold text-navy-700 bg-navy-50 border border-navy-100 px-3 py-1.5 rounded-lg hover:bg-navy-100 transition-colors">
                      <FiEye className="w-3.5 h-3.5" /> Voir
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">
            <FiFilter />
            <p>Aucun dossier ne correspond à votre recherche</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={`Dossier ${detail?.ref}`} size="lg">
        {detail && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: FiUser,    label: 'Citoyen',     val: detail.citoyen,      bold: true },
                { icon: FiTag,     label: 'Catégorie',   val: detail.categorie,    bold: true },
                { icon: FiUser,    label: 'Juge assigné',val: detail.juge,         bold: true },
                { icon: FiCalendar,label: 'Ouverture',   val: `${detail.ouverture}/2025` },
              ].map(item => (
                <div key={item.label} className="bg-gray-50/80 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <item.icon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="form-label mb-0">{item.label}</span>
                  </div>
                  <p className={`text-sm ${item.bold ? 'font-semibold text-navy-700' : 'text-gray-600'}`}>{item.val}</p>
                </div>
              ))}
            </div>

            <div>
              <span className="form-label mb-1">Statut actuel</span>
              <Badge status={detail.status} />
            </div>

            {/* Timeline */}
            <div>
              <label className="form-label mb-3">Historique du dossier</label>
              <div className="space-y-3">
                {detail.phases.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{
                        background: i === detail.phases.length - 1
                          ? 'linear-gradient(135deg, #a0811a, #c9a227)'
                          : 'linear-gradient(135deg, #0a7048, #0f8a58)'
                      }}>
                      {i + 1}
                    </div>
                    <div className={`flex-1 text-sm py-2 px-3 rounded-xl ${
                      i === detail.phases.length - 1
                        ? 'bg-amber-50 text-amber-800 font-semibold border border-amber-200'
                        : 'bg-gray-50 text-gray-600 border border-gray-100'
                    }`}>
                      {p}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button className="btn-primary flex-1 flex items-center justify-center gap-2">
                <FiUser className="w-4 h-4" /> Assigner un juge
              </button>
              <button className="btn-ghost flex-1">Archiver</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
