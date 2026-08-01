import { useState } from 'react'
import { FiCheck, FiX, FiMessageSquare, FiEye, FiSend, FiShield, FiAlertCircle } from 'react-icons/fi'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import toast from 'react-hot-toast'

const NATURE_CONFIG = {
  'Agression':           { bg:'#fff1f2', color:'#c8272d', border:'#fecdd3', icon:'⚔️' },
  'Escroquerie':         { bg:'#fef9ec', color:'#a0811a', border:'#fde68a', icon:'💰' },
  'Litige foncier':      { bg:'#e8f0fb', color:'#0d1f3c', border:'#c5d4f2', icon:'🏠' },
  'Cybercrimi nalite':   { bg:'#ecfdf5', color:'#0a7048', border:'#bbf7d0', icon:'💻' },
  'Violence domestique': { bg:'#fff7ed', color:'#c2410c', border:'#fed7aa', icon:'🚨' },
}

const INIT_PLAINTES = [
  { id:1, ref:'PLT-2025-09345', initials:'CF', color:'#c8272d', citoyen:'Cheikh Fall',      nature:'Agression',          preuves:3, status:'urgent',   date:'01/05/2025', desc:'Agression physique subie le 30 avril au marché Sandaga.' },
  { id:2, ref:'PLT-2025-09343', initials:'AN', color:'#0d1f3c', citoyen:'Aissatou Niang',   nature:'Escroquerie',         preuves:5, status:'progress', date:'30/04/2025', desc:'Escroquerie de 2 500 000 FCFA via vente frauduleuse de terrain.' },
  { id:3, ref:'PLT-2025-09341', initials:'AD', color:'#0a7048', citoyen:'Abdoulaye Diallo', nature:'Litige foncier',      preuves:2, status:'pending',  date:'30/04/2025', desc:'Litige sur parcelle de 200m² à Pikine Technopole.' },
  { id:4, ref:'PLT-2025-09338', initials:'OF', color:'#c9a227', citoyen:'Ousmane Faye',     nature:'Cybercrimi nalite',   preuves:7, status:'progress', date:'28/04/2025', desc:"Usurpation d'identité et fraude bancaire en ligne." },
  { id:5, ref:'PLT-2025-09330', initials:'RS', color:'#0a7048', citoyen:'Rokhaya Sy',       nature:'Violence domestique', preuves:4, status:'done',     date:'24/04/2025', desc:'Dossier clôturé - décision rendue le 01/05/2025.' },
]

export default function AdminPlaintes() {
  const [plaintes, setPlaintes] = useState(INIT_PLAINTES)
  const [filter, setFilter]     = useState('all')
  const [detail, setDetail]     = useState(null)
  const [msgModal, setMsgModal] = useState(null)
  const [msg, setMsg]           = useState('')

  const instruire = (id) => {
    setPlaintes(p => p.map(x => x.id === id ? {...x, status: 'progress'} : x))
    toast.success('Dossier pris en instruction')
  }
  const rejeter = (id) => {
    setPlaintes(p => p.map(x => x.id === id ? {...x, status: 'rejected'} : x))
    toast.error('Plainte rejetée')
  }
  const sendMsg = () => {
    toast.success('Message envoyé — notifié sur app citoyen')
    setMsgModal(null)
    setMsg('')
  }

  const FILTERS = [
    { key:'all',      label:'Toutes',     count: plaintes.length },
    { key:'urgent',   label:'Urgentes',   count: plaintes.filter(p=>p.status==='urgent').length },
    { key:'pending',  label:'En attente', count: plaintes.filter(p=>p.status==='pending').length },
    { key:'progress', label:'En cours',   count: plaintes.filter(p=>p.status==='progress').length },
    { key:'done',     label:'Traitées',   count: plaintes.filter(p=>p.status==='done').length },
  ]

  const filtered = plaintes.filter(p => filter === 'all' || p.status === filter)

  const stats = [
    { num: plaintes.length,                                    label:'Total',     gradient:'linear-gradient(135deg, #0d1f3c, #1a3a6e)', shadow:'rgba(13,31,60,0.3)' },
    { num: plaintes.filter(p=>p.status==='urgent').length,     label:'Urgentes',  gradient:'linear-gradient(135deg, #c8272d, #e8484e)', shadow:'rgba(232,72,78,0.3)' },
    { num: plaintes.filter(p=>p.status==='progress').length,   label:'En cours',  gradient:'linear-gradient(135deg, #0a7048, #0f8a58)', shadow:'rgba(10,112,72,0.3)' },
    { num: plaintes.filter(p=>p.status==='pending').length,    label:'Nouvelles', gradient:'linear-gradient(135deg, #a0811a, #c9a227)', shadow:'rgba(201,162,39,0.3)' },
  ]

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-700">Gestion des plaintes</h1>
        <p className="text-gray-400 text-sm mt-0.5">{plaintes.length} plaintes enregistrées · TGI Dakar</p>
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

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap mb-5">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`chip transition-all ${filter === f.key ? 'chip-navy' : 'chip-outline'}`}>
            {f.label}
            <span className={`ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full ${
              filter === f.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden overflow-x-auto">
        <table className="data-table min-w-full">
          <thead>
            <tr>
              <th>Référence</th><th>Plaignant</th><th>Nature</th><th>Pièces</th><th>Date</th><th>Statut</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const nat = NATURE_CONFIG[p.nature] || { bg:'#f9fafb', color:'#6b7280', border:'#e5e7eb', icon:'📄' }
              return (
                <tr key={p.id}>
                  <td>
                    <span className="font-mono text-xs font-bold text-navy-700 bg-navy-50 px-2 py-1 rounded-lg">{p.ref}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="avatar text-xs font-bold" style={{ background: p.color }}>{p.initials}</div>
                      <span className="font-semibold text-sm text-gray-700">{p.citoyen}</span>
                    </div>
                  </td>
                  <td>
                    <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap"
                      style={{ background: nat.bg, color: nat.color, borderColor: nat.border }}>
                      {nat.icon} {p.nature}
                    </span>
                  </td>
                  <td>
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border"
                      style={{ background: '#e8f0fb', color: '#0d1f3c', borderColor: '#c5d4f2' }}>
                      <FiShield className="w-3 h-3" /> {p.preuves} pièce{p.preuves > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td><span className="text-xs text-gray-400">{p.date}</span></td>
                  <td><Badge status={p.status} /></td>
                  <td>
                    <div className="flex gap-1.5">
                      <button onClick={() => setDetail(p)}
                        className="p-1.5 bg-navy-50 border border-navy-100 text-navy-700 rounded-lg hover:bg-navy-100 transition-all hover:scale-110">
                        <FiEye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setMsgModal(p)}
                        className="p-1.5 rounded-lg transition-all hover:scale-110"
                        style={{ background: '#e8f0fb', color: '#0d1f3c', border: '1px solid #c5d4f2' }}>
                        <FiMessageSquare className="w-3.5 h-3.5" />
                      </button>
                      {p.status === 'pending' && (
                        <>
                          <button onClick={() => instruire(p.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white rounded-lg transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #0a7048, #0f8a58)', boxShadow:'0 2px 8px rgba(10,112,72,0.3)' }}>
                            <FiCheck className="w-3 h-3" /> Instruire
                          </button>
                          <button onClick={() => rejeter(p.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white rounded-lg transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #c8272d, #e8484e)', boxShadow:'0 2px 8px rgba(232,72,78,0.3)' }}>
                            <FiX className="w-3 h-3" /> Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={detail ? 'Dossier ' + detail.ref : ''} size="lg">
        {detail && (() => {
          const nat = NATURE_CONFIG[detail.nature] || {}
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:'Plaignant',     val: detail.citoyen,  bold: true },
                  { label:'Nature',        val: detail.nature,   bold: true },
                  { label:'Date de dépôt', val: detail.date },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <span className="form-label mb-1">{item.label}</span>
                    <p className={`text-sm ${item.bold ? 'font-bold text-navy-700' : 'text-gray-600'}`}>{item.val}</p>
                  </div>
                ))}
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="form-label mb-1">Statut</span>
                  <Badge status={detail.status} />
                </div>
              </div>

              <div>
                <span className="form-label">Description des faits</span>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 leading-relaxed mt-2 border border-gray-100">
                  {detail.desc}
                </p>
              </div>

              <div>
                <span className="form-label">Pièces jointes ({detail.preuves})</span>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {Array.from({length: detail.preuves}).map((_, i) => (
                    <div key={i}
                      className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200 cursor-pointer hover:border-navy-300 hover:bg-navy-50 transition-all">
                      <div className="text-2xl mb-1">📄</div>
                      <p className="text-xs font-semibold text-gray-500">Piece_{i+1}.pdf</p>
                    </div>
                  ))}
                </div>
              </div>

              {detail.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { instruire(detail.id); setDetail(null) }}
                    className="btn-justice flex-1 flex items-center justify-center gap-2">
                    <FiCheck className="w-4 h-4" /> Prendre en instruction
                  </button>
                  <button onClick={() => { rejeter(detail.id); setDetail(null) }}
                    className="btn-danger flex-1 flex items-center justify-center gap-2">
                    <FiX className="w-4 h-4" /> Rejeter
                  </button>
                </div>
              )}
            </div>
          )
        })()}
      </Modal>

      {/* Message Modal */}
      <Modal isOpen={!!msgModal} onClose={() => setMsgModal(null)} title={msgModal ? 'Message à ' + msgModal.citoyen : ''}>
        {msgModal && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-navy-50 border border-navy-100 rounded-xl p-3 text-sm text-navy-700">
              <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Ce message sera envoyé en notification push sur l'application du citoyen.</span>
            </div>
            <div>
              <label className="form-label">Votre message</label>
              <textarea className="form-input" rows={5}
                placeholder={`Concernant votre dossier ${msgModal.ref}...`}
                value={msg} onChange={e => setMsg(e.target.value)} />
            </div>
            <button onClick={sendMsg} disabled={!msg.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2">
              <FiSend className="w-4 h-4" /> Envoyer le message
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
