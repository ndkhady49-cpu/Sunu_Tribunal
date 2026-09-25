import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiMessageSquare, FiChevronDown, FiChevronUp, FiAlertCircle, FiSend, FiFileText } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge.jsx'
import { plainteAPI, rdvAPI, messageErreur } from '../../services/api.js'
import usePolling from '../../hooks/usePolling.js'
import { fmtDate, fmtDateHeure } from '../../utils/format.js'

const BADGE_PLAINTE = {
  pending:  { status: 'pending',  label: 'En attente' },
  progress: { status: 'progress', label: 'En instruction' },
  urgent:   { status: 'urgent',   label: 'Prioritaire' },
  done:     { status: 'done',     label: 'Traite' },
  rejected: { status: 'rejected', label: 'Rejete' },
  archived: { status: 'done',     label: 'Archive' },
}
const BADGE_RDV = {
  pending:   { status: 'pending',  label: 'En attente' },
  confirmed: { status: 'progress', label: 'Confirme' },
  done:      { status: 'done',     label: 'Effectue' },
  rejected:  { status: 'rejected', label: 'Rejete' },
  cancelled: { status: 'rejected', label: 'Annule' },
}

// Étapes d'une plainte, construites à partir de son historique réel
function etapesPlainte(p) {
  const evts = p.evenements.filter(e => e.type !== 'message')
  const quand = (type) => evts.filter(e => e.type === type).pop()
  const depot = quand('depot') || { created_at: p.created_at }
  const assign = quand('assignation')
  const instr = quand('instruction') || quand('urgent')
  const fin = quand('traite') || quand('rejet')
  const steps = [
    { title: 'Depot recu', sub: fmtDateHeure(depot.created_at), done: true },
    { title: 'Enregistre par le greffe', sub: `${p.tribunal_nom}`, done: true },
    assign
      ? { title: `Confie au juge ${p.juge_nom}`, sub: fmtDateHeure(assign.created_at), done: true }
      : { title: 'Attribution a un juge', sub: fin ? 'Non requise' : 'En attente', done: !!fin, active: !fin && p.statut === 'pending' },
    instr
      ? { title: p.statut === 'urgent' ? 'En instruction — prioritaire' : 'En instruction', sub: fmtDateHeure(instr.created_at),
          done: !!fin, active: !fin }
      : { title: 'Instruction', sub: fin ? '—' : 'En attente', done: false, active: false },
  ]
  if (fin) {
    steps.push({ title: fin.type === 'rejet' ? 'Plainte rejetee' : 'Decision rendue — dossier traite',
                 sub: fmtDateHeure(fin.created_at), done: true })
  } else {
    steps.push({ title: 'Decision rendue', sub: 'En attente', done: false })
  }
  return steps
}

// Étapes d'un RDV, déduites de son statut et de ses dates
function etapesRdv(r) {
  const creneau = `${fmtDate(r.date + 'T00:00')} ${r.heure?.slice(0, 5).replace(':', 'h')}`
  const steps = [{ title: 'Demande envoyee', sub: fmtDateHeure(r.created_at), done: true }]
  if (r.statut === 'pending') {
    steps.push({ title: 'Validation par le service d\'accueil', sub: 'En attente', active: true })
    steps.push({ title: 'Rendez-vous', sub: creneau, done: false })
  } else if (r.statut === 'rejected') {
    steps.push({ title: 'Demande rejetee', sub: fmtDateHeure(r.updated_at), done: true })
  } else if (r.statut === 'cancelled') {
    steps.push({ title: 'Annule par vous', sub: fmtDateHeure(r.updated_at), done: true })
  } else {
    steps.push({ title: 'Valide par le greffe', sub: r.statut === 'confirmed' ? fmtDateHeure(r.updated_at) : '', done: true })
    steps.push(r.statut === 'done'
      ? { title: 'RDV effectue', sub: creneau, done: true }
      : { title: 'Rendez-vous', sub: creneau, active: true })
  }
  return steps
}

function Tracker({ steps }) {
  return (
    <div className="mt-4 space-y-0">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
              s.done ? 'bg-justice-400' : s.active ? 'bg-gold-400' : 'bg-gray-300'
            }`}>
              {s.done ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-0.5 flex-1 min-h-4 my-1 ${s.done ? 'bg-justice-300' : 'bg-gray-200'}`} />
            )}
          </div>
          <div className="pb-4">
            <p className={`text-sm font-semibold ${s.done || s.active ? 'text-navy-700' : 'text-gray-400'}`}>
              {s.title}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SuiviPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [dossiers, setDossiers] = useState([])
  const [chargement, setChargement] = useState(true)
  const [open, setOpen] = useState({})
  const [reponses, setReponses] = useState({})
  const [envoi, setEnvoi] = useState(null)

  const charger = (auto = false) =>
    Promise.all([plainteAPI.myList(), rdvAPI.myList()])
      .then(([p, r]) => {
        const liste = [
          ...p.data.map(x => ({ ...x, type: 'Plainte' })),
          ...r.data.map(x => ({ ...x, type: 'Rendez-vous' })),
        ].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        setDossiers(liste)
        setOpen(o => (Object.keys(o).length || !liste.length ? o : { [liste[0].reference]: true }))
      })
      .catch(err => { if (!auto) toast.error(messageErreur(err, 'Impossible de charger vos dossiers.')) })
      .finally(() => setChargement(false))

  usePolling(charger)

  // Ouverture directe depuis une notification : /citoyen/suivi?ref=...
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (!ref || !dossiers.length) return
    setOpen(o => ({ ...o, [ref]: true }))
    setSearchParams({}, { replace: true })
    setTimeout(() => document.getElementById(`dossier-${ref}`)?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [dossiers, searchParams, setSearchParams])

  const repondre = async (d) => {
    const texte = (reponses[d.id] || '').trim()
    if (!texte) return
    setEnvoi(d.id)
    try {
      await plainteAPI.message(d.id, texte)
      setReponses(r => ({ ...r, [d.id]: '' }))
      toast.success('Message envoye au tribunal')
      charger(true)
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setEnvoi(null)
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-700">Mes dossiers</h1>
        <p className="text-gray-500 text-sm mt-1">Suivi en temps reel de vos procedures</p>
      </div>

      {chargement && (
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-navy-100 border-t-navy-700 rounded-full animate-spin" />
        </div>
      )}

      {!chargement && dossiers.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <FiFileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Aucun dossier pour le moment</p>
          <div className="flex gap-3 justify-center mt-4">
            <button className="btn-primary" onClick={() => navigate('/citoyen/plainte')}>Deposer une plainte</button>
            <button className="btn-ghost" onClick={() => navigate('/citoyen/rdv')}>Prendre un RDV</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {dossiers.map(d => {
          const estPlainte = d.type === 'Plainte'
          const badge = (estPlainte ? BADGE_PLAINTE : BADGE_RDV)[d.statut] || BADGE_PLAINTE.pending
          const ouvert = !!open[d.reference]
          const messagesTribunal = estPlainte ? d.messages : []
          return (
            <div key={d.reference} id={`dossier-${d.reference}`} className="card">
              <div className="flex items-start justify-between cursor-pointer"
                onClick={() => setOpen(o => ({...o, [d.reference]: !o[d.reference]}))}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-navy-700">{d.reference}</span>
                    <Badge {...badge} />
                  </div>
                  <p className="text-sm text-gray-600">
                    {estPlainte ? d.nature_label : d.service_label} · {d.tribunal_nom}
                  </p>
                  {d.juge_nom && <p className="text-xs text-gray-400 mt-0.5">Juge : {d.juge_nom}</p>}
                </div>
                {ouvert
                  ? <FiChevronUp className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  : <FiChevronDown className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                }
              </div>

              {ouvert && (
                <>
                  <Tracker steps={estPlainte ? etapesPlainte(d) : etapesRdv(d)} />

                  {d.statut === 'rejected' && d.motif_rejet && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <FiAlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-bold text-red-600 uppercase tracking-wide">
                          Motif du rejet
                        </span>
                      </div>
                      <p className="text-sm text-red-700 leading-relaxed">{d.motif_rejet}</p>
                    </div>
                  )}

                  {!estPlainte && d.orientation && (
                    <div className="bg-justice-50 border border-justice-100 rounded-xl p-3 mt-2 text-sm text-justice-600">
                      Presentez-vous au : <strong>{d.orientation.bureau}</strong> ({d.orientation.localisation})
                    </div>
                  )}

                  {messagesTribunal.map(m => (
                    <div key={m.id} className={`rounded-xl p-3 mt-2 border ${
                      m.est_tribunal ? 'bg-navy-50 border-navy-100' : 'bg-gray-50 border-gray-100 ml-6'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <FiMessageSquare className="w-4 h-4 text-navy-500" />
                        <span className="text-xs font-bold text-navy-600 uppercase tracking-wide">
                          {m.est_tribunal ? 'Message du tribunal' : 'Votre message'}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto">{fmtDateHeure(m.created_at)}</span>
                      </div>
                      <p className="text-sm text-navy-700 leading-relaxed whitespace-pre-wrap">{m.contenu}</p>
                    </div>
                  ))}

                  {estPlainte && !['done', 'rejected', 'archived'].includes(d.statut) && (
                    <div className="flex gap-2 mt-3">
                      <input className="form-input flex-1" placeholder="Ecrire au tribunal au sujet de ce dossier..."
                        value={reponses[d.id] || ''}
                        onChange={e => setReponses(r => ({ ...r, [d.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') repondre(d) }} />
                      <button onClick={() => repondre(d)} disabled={envoi === d.id || !(reponses[d.id] || '').trim()}
                        className="btn-justice flex items-center gap-1.5">
                        <FiSend className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
