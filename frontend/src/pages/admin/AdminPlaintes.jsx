import { useState } from 'react'
import { FiCheck, FiX, FiMessageSquare, FiEye, FiSend } from 'react-icons/fi'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import toast from 'react-hot-toast'

const INIT_PLAINTES = [
  { id:1, ref:'PLT-2025-09345', citoyen:'Cheikh Fall',      nature:'Agression',          preuves:3, status:'urgent',   date:'01/05/2025', desc:'Agression physique subie le 30 avril.' },
  { id:2, ref:'PLT-2025-09343', citoyen:'Aissatou Niang',   nature:'Escroquerie',         preuves:5, status:'progress', date:'30/04/2025', desc:'Escroquerie de 2 500 000 FCFA via vente frauduleuse.' },
  { id:3, ref:'PLT-2025-09341', citoyen:'Abdoulaye Diallo', nature:'Litige foncier',      preuves:2, status:'pending',  date:'30/04/2025', desc:'Litige sur parcelle de 200m2 a Pikine.' },
  { id:4, ref:'PLT-2025-09338', citoyen:'Ousmane Faye',     nature:'Cybercrimi nalite',   preuves:7, status:'progress', date:'28/04/2025', desc:'Usurpation identite et fraude bancaire en ligne.' },
  { id:5, ref:'PLT-2025-09330', citoyen:'Rokhaya Sy',       nature:'Violence domestique', preuves:4, status:'done',     date:'24/04/2025', desc:'Dossier cloture - decision rendue le 01/05/2025.' },
]

export default function AdminPlaintes() {
  const [plaintes, setPlaintes] = useState(INIT_PLAINTES)
  const [filter, setFilter] = useState('all')
  const [detail, setDetail] = useState(null)
  const [msgModal, setMsgModal] = useState(null)
  const [msg, setMsg] = useState('')

  const instruire = (id) => {
    setPlaintes(p => p.map(x => x.id === id ? {...x, status: 'progress'} : x))
    toast.success('Dossier pris en instruction')
  }
  const rejeter = (id) => {
    setPlaintes(p => p.map(x => x.id === id ? {...x, status: 'rejected'} : x))
    toast.error('Plainte rejetee')
  }
  const sendMsg = () => {
    toast.success('Message envoye - notifie sur app citoyen')
    setMsgModal(null)
    setMsg('')
  }

  const filters = [
    { key:'all',      label:'Toutes'     },
    { key:'urgent',   label:'Urgentes'   },
    { key:'pending',  label:'En attente' },
    { key:'progress', label:'En cours'   },
    { key:'done',     label:'Traitees'   },
  ]

  const filtered = plaintes.filter(p => filter === 'all' || p.status === filter)

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-700">Gestion des plaintes</h1>
        <p className="text-gray-500 text-sm mt-1">{plaintes.length} plaintes enregistrees</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { num: plaintes.length,                                    label:'Total'         },
          { num: plaintes.filter(p=>p.status==="urgent").length,     label:'Urgentes', color:'text-red-600' },
          { num: plaintes.filter(p=>p.status==="progress").length,   label:'En cours'      },
          { num: plaintes.filter(p=>p.status==="pending").length,    label:'Nouvelles', color:'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="kpi-box">
            <div className={`kpi-num ${s.color||""}`}>{s.num}</div>
            <div className="kpi-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f.key ? 'bg-navy-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden overflow-x-auto">
        <table className="data-table min-w-full">
          <thead><tr>
            <th>Reference</th><th>Plaignant</th><th>Nature</th><th>Pieces</th><th>Date</th><th>Statut</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td className="font-mono text-xs font-bold text-navy-700">{p.ref}</td>
                <td className="font-medium">{p.citoyen}</td>
                <td className="text-gray-600 text-xs">{p.nature}</td>
                <td className="text-center">
                  <span className="text-xs font-semibold text-navy-500 bg-navy-50 px-2 py-1 rounded-full">
                    {p.preuves} fichier{p.preuves > 1 ? 's' : ''}
                  </span>
                </td>
                <td className="text-gray-500 text-xs">{p.date}</td>
                <td><Badge status={p.status} /></td>
                <td>
                  <div className="flex gap-1.5">
                    <button onClick={() => setDetail(p)}
                      className="p-1.5 bg-navy-50 text-navy-700 rounded-lg hover:bg-navy-100 transition-colors">
                      <FiEye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setMsgModal(p)}
                      className="p-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                      <FiMessageSquare className="w-3.5 h-3.5" />
                    </button>
                    {p.status === 'pending' && (
                      <>
                        <button onClick={() => instruire(p.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-justice-500 text-white text-xs font-semibold rounded-lg hover:bg-justice-400">
                          <FiCheck className="w-3 h-3" /> Instruire
                        </button>
                        <button onClick={() => rejeter(p.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-500">
                          <FiX className="w-3 h-3" /> Rejeter
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={detail ? "Dossier " + detail.ref : ""} size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="form-label">Plaignant</span><p className="font-semibold">{detail.citoyen}</p></div>
              <div><span className="form-label">Nature</span><p className="font-semibold">{detail.nature}</p></div>
              <div><span className="form-label">Date de depot</span><p>{detail.date}</p></div>
              <div><span className="form-label">Statut</span><Badge status={detail.status} /></div>
            </div>
            <div>
              <span className="form-label">Description des faits</span>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">{detail.desc}</p>
            </div>
            <div>
              <span className="form-label">Pieces jointes ({detail.preuves})</span>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {Array.from({length: detail.preuves}).map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 text-center text-xs text-gray-500 border border-gray-200">
                    Piece_{i+1}.pdf
                  </div>
                ))}
              </div>
            </div>
            {detail.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <button onClick={() => { instruire(detail.id); setDetail(null) }}
                  className="btn-justice flex-1">Prendre en instruction</button>
                <button onClick={() => { rejeter(detail.id); setDetail(null) }}
                  className="btn-danger flex-1">Rejeter</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={!!msgModal} onClose={() => setMsgModal(null)} title={msgModal ? "Message a " + msgModal.citoyen : ""}>
        {msgModal && (
          <div className="space-y-4">
            <div className="bg-navy-50 rounded-xl p-3 text-sm text-navy-600">
              Ce message sera envoye en notification push sur application du citoyen
            </div>
            <div>
              <label className="form-label">Votre message</label>
              <textarea className="form-input" rows={5}
                placeholder={"Concernant votre dossier " + msgModal.ref + "..."}
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
