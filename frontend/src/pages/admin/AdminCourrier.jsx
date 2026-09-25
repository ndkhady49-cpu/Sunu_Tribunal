import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiMail, FiSend, FiInbox, FiPaperclip, FiEdit, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { genererDocument } from '../../services/chatbot.js'
import { courrierAPI, messageErreur } from '../../services/api.js'
import { useCompteurs } from '../../context/CompteursContext.jsx'
import usePolling from '../../hooks/usePolling.js'
import { fmtDate, fmtHeure } from '../../utils/format.js'

const FORM_VIDE = { citoyen: null, sujet: '', message: '', dossier: '' }

export default function AdminCourrier() {
  const { rafraichirCompteurs } = useCompteurs()
  const [searchParams, setSearchParams] = useSearchParams()
  const [onglet, setOnglet]       = useState('recus')
  const [ouvert, setOuvert]       = useState(null)
  const [showForm, setShowForm]   = useState(false)
  const [replyTo, setReplyTo]     = useState(null)
  const [loading, setLoading]     = useState(false)
  const [loadingIA, setLoadingIA] = useState(false)
  const [chargement, setChargement] = useState(true)
  const [courriers, setCourriers] = useState([])
  const [fichiers, setFichiers]   = useState([])
  const [form, setForm]           = useState(FORM_VIDE)
  const [recherche, setRecherche] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [dossiers, setDossiers]   = useState([])

  const set = (k, v) => setForm(f => ({...f, [k]: v}))
  const nonLus = courriers.filter(c => c.sens === 'entrant' && !c.lu).length

  usePolling((auto) => {
    courrierAPI.list()
      .then(r => setCourriers(r.data))
      .catch(err => { if (!auto) toast.error(messageErreur(err, 'Impossible de charger les courriers.')) })
      .finally(() => setChargement(false))
  })

  // Recherche du citoyen destinataire (nom, email, CNI, téléphone)
  useEffect(() => {
    if (form.citoyen || recherche.trim().length < 2) { setSuggestions([]); return }
    const t = setTimeout(() => {
      courrierAPI.citoyens(recherche.trim()).then(r => setSuggestions(r.data)).catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [recherche, form.citoyen])

  // Dossiers (PLT / RDV) du citoyen choisi
  useEffect(() => {
    if (!form.citoyen) { setDossiers([]); return }
    courrierAPI.dossiers(form.citoyen.id).then(r => setDossiers(r.data)).catch(() => setDossiers([]))
  }, [form.citoyen])

  // Ouverture directe depuis une notification : /admin/courrier?id=12
  useEffect(() => {
    const id = Number(searchParams.get('id'))
    if (!id || !courriers.length) return
    const c = courriers.find(x => x.id === id)
    if (c) ouvrir(c, true)
    setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courriers, searchParams])

  const fermerForm = () => {
    setShowForm(false)
    setReplyTo(null)
    setForm(FORM_VIDE)
    setRecherche('')
    setFichiers([])
  }

  const envoyer = async (e) => {
    e.preventDefault()
    if (!form.citoyen) { toast.error('Choisissez le citoyen destinataire'); return }
    if (!form.sujet.trim() || !form.message.trim()) {
      toast.error('Remplissez le sujet et le message')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('sujet', form.sujet.trim())
      fd.append('message', form.message.trim())
      if (form.dossier) fd.append('dossier_ref', form.dossier)
      if (fichiers[0])  fd.append('piece_jointe', fichiers[0])
      let res
      if (replyTo) {
        res = await courrierAPI.repondre(replyTo.id, fd)
      } else {
        fd.append('citoyen', form.citoyen.id)
        res = await courrierAPI.create(fd)
      }
      setCourriers(c => [res.data, ...c.map(x => x.id === replyTo?.id ? {...x, lu: true} : x)])
      toast.success(`Courrier envoye — citoyen notifie (n° ${res.data.numero_registre})`)
      fermerForm()
      setOnglet('envoyes')
      rafraichirCompteurs()
    } catch (err) {
      toast.error(messageErreur(err, "L'envoi du courrier a echoue."))
    } finally {
      setLoading(false)
    }
  }

  const redigerAvecIA = async () => {
  if (!form.sujet) {
    toast.error('Remplissez le sujet d\'abord')
    return
  }
  setLoadingIA(true)
  try {
    const document = await genererDocument(
      form.citoyen?.nom || 'Citoyen',
      form.sujet,
      form.dossier || 'Non specifie'
    )
    set('message', document)
    toast.success('Courrier genere par IA !')
  } catch (err) {
    toast.error(err.message || 'Erreur IA. Reessayez.')
  } finally {
    setLoadingIA(false)
  }
}

  const ouvrir = (c, forcer = false) => {
    setOnglet(c.sens === 'entrant' ? 'recus' : 'envoyes')
    setOuvert(forcer || ouvert !== c.id ? c.id : null)
    if (c.sens === 'entrant' && !c.lu) {
      setCourriers(cs => cs.map(x => x.id === c.id ? {...x, lu: true} : x))
      courrierAPI.lu(c.id).then(rafraichirCompteurs).catch(() => {})
    }
  }

  const repondre = (c) => {
    setReplyTo(c)
    setForm({
      citoyen: { id: c.citoyen, nom: c.citoyen_nom, email: c.citoyen_email },
      sujet: c.sujet.startsWith('Re: ') ? c.sujet : 'Re: ' + c.sujet,
      message: '',
      dossier: c.dossier_ref,
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtres = courriers.filter(c =>
    onglet === 'recus' ? c.sens === 'entrant' : c.sens === 'sortant'
  )

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-700">Courriers</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion des echanges avec les citoyens</p>
        </div>
        <button onClick={() => { if (showForm) fermerForm(); else { setReplyTo(null); setShowForm(true) } }}
          className="btn-primary flex items-center gap-2">
          <FiEdit className="w-4 h-4" />
          Nouveau courrier
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="card mb-6 border-2 border-navy-100">
          <h3 className="font-semibold text-navy-700 mb-4 flex items-center gap-2">
            <FiMail className="w-4 h-4 text-navy-500" />
            {replyTo ? 'Repondre a ' + replyTo.citoyen_nom : 'Nouveau courrier'}
          </h3>
          <form onSubmit={envoyer} className="space-y-3">
            <div className="relative">
              <label className="form-label">Destinataire *</label>
              {form.citoyen ? (
                <div className="form-input flex items-center justify-between bg-gray-50">
                  <span>
                    <span className="font-semibold text-navy-700">{form.citoyen.nom}</span>
                    <span className="text-xs text-gray-500 ml-2">{form.citoyen.email}</span>
                  </span>
                  {!replyTo && (
                    <button type="button" onClick={() => { set('citoyen', null); set('dossier', ''); setRecherche('') }}>
                      <FiX className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <input className="form-input" placeholder="Rechercher un citoyen : nom, email, CNI ou telephone"
                    value={recherche} onChange={e => setRecherche(e.target.value)} />
                  {suggestions.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                      {suggestions.map(s => (
                        <button type="button" key={s.id}
                          onClick={() => { set('citoyen', s); setSuggestions([]) }}
                          className="w-full text-left px-3 py-2 hover:bg-navy-50 text-sm">
                          <span className="font-semibold text-navy-700">{s.nom}</span>
                          <span className="text-xs text-gray-500 ml-2">{s.email}{s.telephone ? ` · ${s.telephone}` : ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {recherche.trim().length >= 2 && suggestions.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">Aucun citoyen trouve</p>
                  )}
                </>
              )}
            </div>
            <div>
              <label className="form-label">Dossier concerne</label>
              <select className="form-select" value={form.dossier} disabled={!form.citoyen}
                onChange={e => set('dossier', e.target.value)}>
                <option value="">Aucun dossier specifique</option>
                {dossiers.map(d => <option key={d.ref} value={d.ref}>{d.ref} — {d.libelle}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Sujet *</label>
              <input className="form-input" placeholder="Objet du courrier..."
                value={form.sujet} onChange={e => set('sujet', e.target.value)} required />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
              <label className="form-label">Message *</label>
              <button type="button" onClick={redigerAvecIA} disabled={loadingIA}
                className="flex items-center gap-1.5 text-xs font-semibold text-navy-700 bg-navy-50 px-3 py-1.5 rounded-lg hover:bg-navy-100 transition-colors border border-navy-100">
                {loadingIA
                  ? <span className="w-3 h-3 border-2 border-navy-300 border-t-navy-700 rounded-full animate-spin" />
                  : '✨'
                }
                {loadingIA ? 'Generation...' : 'Rediger avec IA'}
              </button>
            </div>
              <textarea className="form-input" rows={6}
                placeholder="Redigez votre message officiel ici..."
                value={form.message} onChange={e => set('message', e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Piece jointe</label>
              <label className="flex items-center gap-2 border border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-navy-400 hover:bg-navy-50 transition-colors">
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={e => setFichiers(Array.from(e.target.files))} />
                <FiPaperclip className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {fichiers.length > 0 ? fichiers[0].name : 'Joindre un document officiel'}
                </span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={fermerForm}
                className="btn-ghost flex-1">
                Annuler
              </button>
              <button type="submit" disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <FiSend className="w-4 h-4" />
                }
                {loading ? 'Envoi...' : 'Envoyer au citoyen'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { num: courriers.filter(c => c.sens === 'entrant').length, label:'Recus',    color:'text-navy-700'    },
          { num: nonLus,                                              label:'Non lus',  color:'text-red-600'     },
          { num: courriers.filter(c => c.sens === 'sortant').length, label:'Envoyes',  color:'text-justice-500' },
        ].map(s => (
          <div key={s.label} className="kpi-box text-center">
            <div className={`kpi-num ${s.color}`}>{s.num}</div>
            <div className="kpi-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-4">
        <button onClick={() => setOnglet('recus')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            onglet === 'recus' ? 'bg-white text-navy-700 shadow-sm' : 'text-gray-500'
          }`}>
          <FiInbox className="w-4 h-4" />
          Recus
          {nonLus > 0 && (
            <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {nonLus}
            </span>
          )}
        </button>
        <button onClick={() => setOnglet('envoyes')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            onglet === 'envoyes' ? 'bg-white text-navy-700 shadow-sm' : 'text-gray-500'
          }`}>
          <FiSend className="w-4 h-4" />
          Envoyes
        </button>
      </div>

      {/* Liste */}
      {chargement ? (
        <div className="flex justify-center py-10">
          <span className="w-6 h-6 border-2 border-navy-100 border-t-navy-700 rounded-full animate-spin" />
        </div>
      ) : filtres.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <FiMail className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Aucun courrier</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtres.map(c => {
            const recu = c.sens === 'entrant'
            const nonLu = recu && !c.lu
            return (
              <div key={c.id}
                className={`card cursor-pointer hover:shadow-card-hover transition-all ${
                  nonLu ? 'border-l-4 border-l-navy-700' : ''
                }`}
                onClick={() => ouvrir(c)}>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      recu ? 'bg-navy-50' : 'bg-justice-50'
                    }`}>
                      {recu
                        ? <FiInbox className="w-4 h-4 text-navy-500" />
                        : <FiSend className="w-4 h-4 text-justice-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm truncate ${nonLu ? 'font-bold text-navy-700' : 'font-semibold text-gray-700'}`}>
                          {recu ? c.citoyen_nom : 'A : ' + c.citoyen_nom}
                        </p>
                        {nonLu && (
                          <span className="w-2 h-2 rounded-full bg-navy-700 flex-shrink-0" />
                        )}
                        {recu && (
                          <span className="text-xs text-gray-400 truncate">
                            → {c.juge_nom ? 'Juge ' + c.juge_nom : c.destinataire_label}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate ${nonLu ? 'font-semibold' : 'text-gray-600'}`}>
                        {c.sujet}
                      </p>
                      {c.dossier_ref && (
                        <span className="text-xs text-navy-500 font-mono bg-navy-50 px-2 py-0.5 rounded-full mt-1 inline-block mr-2">
                          {c.dossier_ref}
                        </span>
                      )}
                      {c.numero_registre && (
                        <span className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {c.numero_registre}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <p className="text-xs text-gray-400">{fmtDate(c.created_at)}</p>
                    <p className="text-xs text-gray-400">{fmtHeure(c.created_at)}</p>
                    {!recu && <p className="text-xs text-gray-400">{c.lu ? 'Lu' : 'Non lu'}</p>}
                    {ouvert === c.id
                      ? <FiChevronUp className="w-4 h-4 text-gray-400" />
                      : <FiChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                </div>

                {ouvert === c.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.message}</p>
                    {c.piece_jointe && (
                      <a href={c.piece_jointe} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                        className="flex items-center gap-2 mt-3 bg-gray-50 rounded-xl p-3 hover:bg-gray-100">
                        <FiPaperclip className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-600">{c.piece_nom}</span>
                      </a>
                    )}
                    {!recu && c.auteur_nom && <p className="text-xs text-gray-400 mt-3">Envoye par {c.auteur_nom}</p>}
                    {recu && (
                      <button
                        onClick={e => { e.stopPropagation(); repondre(c) }}
                        className="mt-3 flex items-center gap-2 text-xs font-semibold text-navy-700 bg-navy-50 px-3 py-2 rounded-xl hover:bg-navy-100 transition-colors">
                        <FiSend className="w-3.5 h-3.5" />
                        Repondre au citoyen
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
