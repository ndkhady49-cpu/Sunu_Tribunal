import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiCheck, FiX, FiMessageSquare, FiEye, FiSend, FiAlertTriangle, FiUserCheck, FiFile } from 'react-icons/fi'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import toast from 'react-hot-toast'
import { plainteAPI, messageErreur } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCompteurs } from '../../context/CompteursContext.jsx'
import usePolling from '../../hooks/usePolling.js'
import { fmtDate, fmtDateHeure } from '../../utils/format.js'

const BADGE = {
  pending:  { status: 'pending',  label: 'En attente' },
  progress: { status: 'progress', label: 'En instruction' },
  urgent:   { status: 'urgent',   label: 'Urgent' },
  done:     { status: 'done',     label: 'Traite' },
  rejected: { status: 'rejected', label: 'Rejete' },
  archived: { status: 'done',     label: 'Archive' },
}
const StatutBadge = ({ statut }) => <Badge {...(BADGE[statut] || BADGE.pending)} />

export default function AdminPlaintes() {
  const { user } = useAuth()
  const { rafraichirCompteurs } = useCompteurs()
  const [searchParams, setSearchParams] = useSearchParams()
  const estJuge   = user?.role === 'juge'
  const estGreffe = ['admin', 'greffier'].includes(user?.role)

  const [plaintes, setPlaintes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [juges, setJuges] = useState([])
  const [filter, setFilter] = useState('all')
  const [detailId, setDetailId] = useState(null)
  const [msgModal, setMsgModal] = useState(null)
  const [msg, setMsg] = useState('')
  const [rejetModal, setRejetModal] = useState(null)
  const [motif, setMotif] = useState('')
  const [jugeChoisi, setJugeChoisi] = useState('')
  const [enCours, setEnCours] = useState(null)

  const detail = plaintes.find(p => p.id === detailId) || null

  const charger = (auto = false) =>
    plainteAPI.list()
      .then(r => setPlaintes(r.data))
      .catch(err => { if (!auto) toast.error(messageErreur(err, 'Impossible de charger les plaintes.')) })
      .finally(() => setChargement(false))

  usePolling(charger)

  useEffect(() => {
    if (estGreffe) plainteAPI.juges().then(r => setJuges(r.data)).catch(() => {})
  }, [estGreffe])

  // Ouverture directe depuis une notification : /admin/plaintes?ref=PLT-...
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (!ref || !plaintes.length) return
    const cible = plaintes.find(p => p.reference === ref)
    if (cible) setDetailId(cible.id)
    setSearchParams({}, { replace: true })
  }, [plaintes, searchParams, setSearchParams])

  useEffect(() => { setJugeChoisi(detail?.juge ? String(detail.juge) : '') }, [detail?.id, detail?.juge])

  // Toute décision renvoie la plainte à jour : on la remplace dans la liste
  const agir = async (id, appel, succes) => {
    setEnCours(id)
    try {
      const res = await appel()
      setPlaintes(ps => ps.map(p => p.id === id ? res.data : p))
      toast.success(succes)
      rafraichirCompteurs()
      return true
    } catch (err) {
      toast.error(messageErreur(err))
      return false
    } finally {
      setEnCours(null)
    }
  }

  const instruire = (id) => agir(id, () => plainteAPI.instruire(id), 'Dossier pris en instruction — citoyen notifie')
  const urgent    = (id) => agir(id, () => plainteAPI.urgent(id), 'Dossier marque urgent — citoyen notifie')
  const traiter   = (id) => agir(id, () => plainteAPI.traiter(id), 'Dossier traite — citoyen notifie')
  const assigner  = (id) => {
    if (!jugeChoisi) { toast.error('Choisissez un juge'); return }
    agir(id, () => plainteAPI.assigner(id, jugeChoisi), 'Dossier assigne — juge et citoyen notifies')
  }
  const rejeter = async () => {
    if (!motif.trim()) { toast.error('Le motif du rejet est obligatoire'); return }
    if (await agir(rejetModal.id, () => plainteAPI.rejeter(rejetModal.id, motif.trim()), 'Plainte rejetee — motif envoye au citoyen')) {
      setRejetModal(null)
      setMotif('')
    }
  }
  const sendMsg = async () => {
    setEnCours(msgModal.id)
    try {
      await plainteAPI.message(msgModal.id, msg.trim())
      toast.success('Message envoye — notifie sur l\'application du citoyen')
      setMsgModal(null)
      setMsg('')
      charger(true)
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setEnCours(null)
    }
  }

  const filters = [
    { key:'all',      label:'Toutes'     },
    { key:'urgent',   label:'Urgentes'   },
    { key:'pending',  label:'En attente' },
    { key:'progress', label:'En cours'   },
    { key:'done',     label:'Traitees'   },
    { key:'rejected', label:'Rejetees'   },
  ]

  const filtered = plaintes.filter(p => filter === 'all' || p.statut === filter)
  const ouverte = (p) => ['pending', 'progress', 'urgent'].includes(p.statut)

  const boutonsDecision = (p, dansModale = false) => {
    const cls = dansModale ? 'flex-1' : ''
    const occupe = enCours === p.id
    return (
      <>
        {['pending', 'urgent'].includes(p.statut) && (
          <button onClick={() => instruire(p.id)} disabled={occupe}
            className={dansModale ? `btn-justice ${cls}` : 'flex items-center gap-1 px-2.5 py-1.5 bg-justice-500 text-white text-xs font-semibold rounded-lg hover:bg-justice-400'}>
            <FiCheck className="w-3 h-3 inline" /> Instruire
          </button>
        )}
        {['pending', 'progress'].includes(p.statut) && dansModale && (
          <button onClick={() => urgent(p.id)} disabled={occupe}
            className={`flex items-center justify-center gap-1 px-3 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-400 ${cls}`}>
            <FiAlertTriangle className="w-4 h-4" /> Urgent
          </button>
        )}
        {['progress', 'urgent'].includes(p.statut) && (
          <button onClick={() => traiter(p.id)} disabled={occupe}
            className={dansModale ? `btn-primary ${cls}` : 'flex items-center gap-1 px-2.5 py-1.5 bg-navy-700 text-white text-xs font-semibold rounded-lg hover:bg-navy-600'}>
            <FiCheck className="w-3 h-3 inline" /> Traite
          </button>
        )}
        {ouverte(p) && (
          <button onClick={() => { setRejetModal(p); setMotif('') }} disabled={occupe}
            className={dansModale ? `btn-danger ${cls}` : 'flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-500'}>
            <FiX className="w-3 h-3 inline" /> Rejeter
          </button>
        )}
      </>
    )
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-700">
          {estJuge ? 'Mes dossiers' : 'Gestion des plaintes'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {estJuge
            ? `${plaintes.length} plainte${plaintes.length > 1 ? 's' : ''} qui vous ${plaintes.length > 1 ? 'sont assignees' : 'est assignee'}`
            : `${plaintes.length} plainte${plaintes.length > 1 ? 's' : ''} enregistree${plaintes.length > 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { num: plaintes.length,                                    label:'Total'         },
          { num: plaintes.filter(p=>p.statut==="urgent").length,     label:'Urgentes', color:'text-red-600' },
          { num: plaintes.filter(p=>p.statut==="progress").length,   label:'En cours'      },
          { num: plaintes.filter(p=>p.statut==="pending").length,    label:'Nouvelles', color:'text-amber-600' },
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
            <th>Reference</th><th>Plaignant</th><th>Nature</th><th>Pieces</th><th>Juge</th><th>Date</th><th>Statut</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {chargement && (
              <tr><td colSpan={8} className="text-center py-8">
                <span className="inline-block w-6 h-6 border-2 border-navy-100 border-t-navy-700 rounded-full animate-spin" />
              </td></tr>
            )}
            {!chargement && filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400 text-sm">Aucune plainte</td></tr>
            )}
            {filtered.map(p => (
              <tr key={p.id}>
                <td className="font-mono text-xs font-bold text-navy-700">{p.reference}</td>
                <td className="font-medium">{p.plaignant_nom}</td>
                <td className="text-gray-600 text-xs">{p.nature_label}</td>
                <td className="text-center">
                  <span className="text-xs font-semibold text-navy-500 bg-navy-50 px-2 py-1 rounded-full">
                    {p.nb_pieces} fichier{p.nb_pieces > 1 ? 's' : ''}
                  </span>
                </td>
                <td className="text-xs text-gray-600">{p.juge_nom || <span className="text-amber-600 font-semibold">A assigner</span>}</td>
                <td className="text-gray-500 text-xs">{fmtDate(p.created_at)}</td>
                <td><StatutBadge statut={p.statut} /></td>
                <td>
                  <div className="flex gap-1.5">
                    <button onClick={() => setDetailId(p.id)} title="Voir le dossier"
                      className="p-1.5 bg-navy-50 text-navy-700 rounded-lg hover:bg-navy-100 transition-colors">
                      <FiEye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setMsgModal(p)} title="Message au citoyen"
                      className="p-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                      <FiMessageSquare className="w-3.5 h-3.5" />
                    </button>
                    {p.statut === 'pending' && boutonsDecision(p)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!detail} onClose={() => setDetailId(null)} title={detail ? "Dossier " + detail.reference : ""} size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="form-label">Plaignant</span><p className="font-semibold">{detail.plaignant_nom}</p>
                {detail.plaignant_telephone && <p className="text-xs text-gray-500">{detail.plaignant_telephone}</p>}</div>
              <div><span className="form-label">Nature</span><p className="font-semibold">{detail.nature_label}</p></div>
              <div><span className="form-label">Date de depot</span><p>{fmtDateHeure(detail.created_at)}</p></div>
              <div><span className="form-label">Statut</span><StatutBadge statut={detail.statut} /></div>
              <div><span className="form-label">Tribunal</span><p>{detail.tribunal_nom}</p></div>
              <div><span className="form-label">Juge en charge</span><p className="font-semibold">{detail.juge_nom || '—'}</p></div>
            </div>

            {estGreffe && ouverte(detail) && (
              <div className="bg-navy-50 rounded-xl p-3 flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-40">
                  <label className="form-label">{detail.juge ? 'Reassigner a un juge' : 'Assigner a un juge'}</label>
                  <select className="form-select" value={jugeChoisi} onChange={e => setJugeChoisi(e.target.value)}>
                    <option value="">Choisir un juge...</option>
                    {juges.map(j => <option key={j.id} value={j.id}>{j.nom}</option>)}
                  </select>
                </div>
                <button onClick={() => assigner(detail.id)} disabled={enCours === detail.id || !jugeChoisi || String(detail.juge) === jugeChoisi}
                  className="btn-primary flex items-center gap-2">
                  <FiUserCheck className="w-4 h-4" /> Assigner
                </button>
                {juges.length === 0 && <p className="text-xs text-gray-500 w-full">Aucun juge dans ce tribunal (a creer dans Personnel).</p>}
              </div>
            )}

            <div>
              <span className="form-label">Description des faits</span>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">{detail.description}</p>
            </div>
            {detail.statut === 'rejected' && detail.motif_rejet && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                <span className="font-bold">Motif du rejet : </span>{detail.motif_rejet}
              </div>
            )}
            <div>
              <span className="form-label">Pieces jointes ({detail.nb_pieces})</span>
              {detail.pieces.length === 0 && <p className="text-xs text-gray-400">Aucune piece jointe</p>}
              <div className="grid grid-cols-3 gap-2 mt-1">
                {detail.pieces.map(pc => (
                  <a key={pc.id} href={pc.fichier} target="_blank" rel="noreferrer"
                    className="bg-gray-50 rounded-xl p-3 text-center text-xs text-navy-700 border border-gray-200 hover:bg-navy-50 truncate">
                    <FiFile className="w-4 h-4 mx-auto mb-1 text-navy-500" />
                    {pc.nom}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <span className="form-label">Historique</span>
              <ul className="text-xs space-y-1.5 bg-gray-50 rounded-xl p-3">
                {detail.evenements.filter(e => e.type !== 'message').map(e => (
                  <li key={e.id} className="flex justify-between gap-3">
                    <span className="text-gray-700"><strong>{e.type_label}</strong>{e.detail && ` — ${e.detail}`}
                      {e.auteur_nom && <span className="text-gray-400"> · {e.auteur_nom}</span>}</span>
                    <span className="text-gray-400 flex-shrink-0">{fmtDateHeure(e.created_at)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {detail.messages.length > 0 && (
              <div>
                <span className="form-label">Messages</span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {detail.messages.map(m => (
                    <div key={m.id} className={`rounded-xl p-3 text-sm ${m.est_tribunal ? 'bg-navy-50 ml-6' : 'bg-gray-50 mr-6'}`}>
                      <p className="text-xs font-semibold text-gray-500 mb-1">{m.auteur_nom} · {fmtDateHeure(m.created_at)}</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{m.contenu}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {boutonsDecision(detail, true)}
              <button onClick={() => setMsgModal(detail)} className="btn-ghost flex-1 flex items-center justify-center gap-2">
                <FiMessageSquare className="w-4 h-4" /> Message
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!msgModal} onClose={() => setMsgModal(null)} title={msgModal ? "Message a " + msgModal.plaignant_nom : ""}>
        {msgModal && (
          <div className="space-y-4">
            <div className="bg-navy-50 rounded-xl p-3 text-sm text-navy-600">
              Ce message apparait dans le suivi du dossier et en notification sur l'application du citoyen
            </div>
            <div>
              <label className="form-label">Votre message</label>
              <textarea className="form-input" rows={5}
                placeholder={"Concernant votre dossier " + msgModal.reference + "..."}
                value={msg} onChange={e => setMsg(e.target.value)} />
            </div>
            <button onClick={sendMsg} disabled={!msg.trim() || enCours === msgModal.id}
              className="btn-primary w-full flex items-center justify-center gap-2">
              <FiSend className="w-4 h-4" /> Envoyer le message
            </button>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!rejetModal} onClose={() => setRejetModal(null)} title={rejetModal ? "Rejeter " + rejetModal.reference : ""}>
        {rejetModal && (
          <div className="space-y-4">
            <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700">
              Le motif sera affiche au citoyen dans le suivi de son dossier.
            </div>
            <div>
              <label className="form-label">Motif du rejet *</label>
              <textarea className="form-input" rows={4} placeholder="Ex : faits prescrits, tribunal incompetent..."
                value={motif} onChange={e => setMotif(e.target.value)} />
            </div>
            <button onClick={rejeter} disabled={!motif.trim() || enCours === rejetModal.id} className="btn-danger w-full">
              Confirmer le rejet
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
