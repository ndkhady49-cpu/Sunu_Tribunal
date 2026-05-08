import { useState } from 'react'
import { FiSearch, FiFilter, FiEye } from 'react-icons/fi'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'

const DOSSIERS = [
  { id:1, ref:'DOS-2025-00142', citoyen:'Cheikh Fall',      categorie:'Penal',      juge:'M. Badji',  ouverture:'01/05', status:'urgent',   phases:['Depot','Instruction en cours'] },
  { id:2, ref:'DOS-2025-00141', citoyen:'Aissatou Niang',   categorie:'Civil',       juge:'Mme Sarr',  ouverture:'30/04', status:'progress', phases:['Depot','Enregistre','Instruction'] },
  { id:3, ref:'DOS-2025-00138', citoyen:'Ousmane Faye',     categorie:'Commercial',  juge:'M. Ly',     ouverture:'28/04', status:'progress', phases:['Depot','Analyse preliminaire'] },
  { id:4, ref:'DOS-2025-00134', citoyen:'Rokhaya Sy',       categorie:'Penal',       juge:'M. Badji',  ouverture:'24/04', status:'done',     phases:['Depot','Instruction','Decision rendue'] },
  { id:5, ref:'DOS-2025-00129', citoyen:'Lamine Traore',    categorie:'Civil',       juge:'Mme Sarr',  ouverture:'20/04', status:'done',     phases:['Depot','Instruction','Cloture'] },
  { id:6, ref:'DOS-2025-00125', citoyen:'Mariama Kouyate',  categorie:'Etat civil',  juge:'M. Diouf',  ouverture:'18/04', status:'done',     phases:['Depot','Traite'] },
  { id:7, ref:'DOS-2025-00118', citoyen:'Pape Diallo',      categorie:'Commercial',  juge:'M. Ly',     ouverture:'14/04', status:'rejected', phases:['Depot','Rejete — pieces insuffisantes'] },
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

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-700">Suivi des dossiers</h1>
        <p className="text-gray-500 text-sm mt-1">{DOSSIERS.length} dossiers au total</p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { num: DOSSIERS.filter(d => d.status !== 'done' && d.status !== 'rejected').length, label:'Actifs' },
          { num: DOSSIERS.filter(d => d.status === 'urgent').length,   label:'Urgents',  color:'text-red-600' },
          { num: DOSSIERS.filter(d => d.status === 'done').length,     label:'Clotures' },
          { num: DOSSIERS.filter(d => d.status === 'rejected').length, label:'Rejetes'  },
        ].map(s => (
          <div key={s.label} className="kpi-box">
            <div className={`kpi-num ${s.color || ''}`}>{s.num}</div>
            <div className="kpi-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input className="form-input pl-10" placeholder="Rechercher par nom ou reference..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                catFilter === c ? 'bg-navy-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}>
              {c === 'all' ? 'Tous' : c}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden overflow-x-auto">
        <table className="data-table min-w-full">
          <thead><tr>
            <th>N° Dossier</th>
            <th>Citoyen</th>
            <th>Categorie</th>
            <th>Juge assigne</th>
            <th>Ouverture</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id}>
                <td className="font-mono text-xs font-bold text-navy-700">{d.ref}</td>
                <td className="font-medium">{d.citoyen}</td>
                <td>
                  <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    {d.categorie}
                  </span>
                </td>
                <td className="text-gray-600 text-sm">{d.juge}</td>
                <td className="text-gray-500 text-xs">{d.ouverture}</td>
                <td><Badge status={d.status} /></td>
                <td>
                  <button onClick={() => setDetail(d)}
                    className="flex items-center gap-1 text-xs font-semibold text-navy-700 bg-navy-50 px-3 py-1.5 rounded-lg hover:bg-navy-100 transition-colors">
                    <FiEye className="w-3.5 h-3.5" /> Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <FiFilter className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Aucun dossier ne correspond a votre recherche</p>
          </div>
        )}
      </div>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={`Dossier ${detail?.ref}`} size="lg">
        {detail && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><label className="form-label">Citoyen</label><p className="font-semibold">{detail.citoyen}</p></div>
              <div><label className="form-label">Categorie</label><p className="font-semibold">{detail.categorie}</p></div>
              <div><label className="form-label">Juge assigne</label><p className="font-semibold">{detail.juge}</p></div>
              <div><label className="form-label">Ouverture</label><p>{detail.ouverture}/2025</p></div>
              <div><label className="form-label">Statut</label><Badge status={detail.status} /></div>
            </div>
            <div>
              <label className="form-label">Historique</label>
              <div className="space-y-2 mt-2">
                {detail.phases.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                      i === detail.phases.length - 1 ? 'bg-gold-400' : 'bg-justice-400'
                    }`}>{i + 1}</div>
                    <p className="text-sm text-gray-700">{p}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn-primary flex-1">Assigner un juge</button>
              <button className="btn-ghost flex-1">Archiver</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
