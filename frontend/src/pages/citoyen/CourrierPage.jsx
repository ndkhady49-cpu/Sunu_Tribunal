import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiMail, FiSend, FiPaperclip, FiChevronDown, FiChevronUp, FiInbox, FiEdit } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { courrierAPI, tribunalAPI, liste, messageErreur } from '../../services/api.js'
import { useCompteurs } from '../../context/CompteursContext.jsx'
import usePolling from '../../hooks/usePolling.js'
import { fmtDate, fmtHeure } from '../../utils/format.js'

const DESTINATAIRES = [
  { value: 'greffe',         label: 'Greffe du tribunal' },
  { value: 'administration', label: 'Administration du tribunal' },
  { value: 'juge_dossier',   label: 'Juge en charge de mon dossier' },
]
const FORM_VIDE = { sujet: '', message: '', dossier: '', destinataire: 'greffe', tribunal: '', parent: null }

export default function CourrierPage() {
  const { rafraichirCompteurs } = useCompteurs()
  const [searchParams, setSearchParams] = useSearchParams()
  const [onglet, setOnglet]       = useState('recus')
  const [ouvert, setOuvert]       = useState(null)
  const [showForm, setShowForm]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [chargement, setChargement] = useState(true)
  const [fichiers, setFichiers]   = useState([])
  const [courriers, setCourriers] = useState([])
  const [dossiers, setDossiers]   = useState([])
  const [tribunaux, setTribunaux] = useState([])
  const [form, setForm] = useState(FORM_VIDE)

  const set = (k, v) => setForm(f => ({...f, [k]: v}))
  const dossierChoisi = dossiers.find(d => d.ref === form.dossier)
  const nonLus = courriers.filter(c => c.sens === 'sortant' && !c.lu).length

  usePolling((auto) => {
    courrierAPI.list()
      .then(r => setCourriers(r.data))
      .catch(err => { if (!auto) toast.error(messageErreur(err, 'Impossible de charger vos courriers.')) })
      .finally(() => setChargement(false))
  })

  useEffect(() => {
    courrierAPI.dossiers().then(r => setDossiers(r.data)).catch(() => {})
    tribunalAPI.list().then(r => setTribunaux(liste(r))).catch(() => {})
  }, [])

  // Ouverture directe depuis une notification : /citoyen/courrier?id=12
  useEffect(() => {
    const id = Number(searchParams.get('id'))
    if (!id || !courriers.length) return
    const c = courriers.find(x => x.id === id)
    if (c) ouvrir(c, true)
    setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courriers, searchParams])

  const envoyer = async (e) => {
    e.preventDefault()
    if (!form.sujet.trim() || !form.message.trim()) {
      toast.error('Remplissez le sujet et le message')
      return
    }
    if (form.destinataire === 'juge_dossier' && !dossierChoisi?.juge) {
      toast.error('Choisissez un dossier deja confie a un juge, ou ecrivez au greffe')
      return
    }
    if (!form.dossier && !form.parent && !form.tribunal) {
      toast.error('Choisissez le tribunal destinataire')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('sujet', form.sujet.trim())
      fd.append('message', form.message.trim())
      fd.append('destinataire_service', form.destinataire)
      if (form.dossier)  fd.append('dossier_ref', form.dossier)
      if (form.tribunal) fd.append('tribunal', form.tribunal)
      if (form.parent)   fd.append('parent', form.parent)
      if (fichiers[0])   fd.append('piece_jointe', fichiers[0])
      const res = await courrierAPI.create(fd)
      setCourriers(c => [res.data, ...c])
      toast.success(`Courrier envoye — enregistre sous le n° ${res.data.numero_registre}`)
      setShowForm(false)
      setForm(FORM_VIDE)
      setFichiers([])
      setOnglet('envoyes')
    } catch (err) {
      toast.error(messageErreur(err, "L'envoi du courrier a echoue."))
    } finally {
      setLoading(false)
    }
  }

  const ouvrir = (c, forcer = false) => {
    setOnglet(c.sens === 'sortant' ? 'recus' : 'envoyes')
    setOuvert(forcer || ouvert !== c.id ? c.id : null)
    if (c.sens === 'sortant' && !c.lu) {
      setCourriers(cs => cs.map(x => x.id === c.id ? {...x, lu: true} : x))
      courrierAPI.lu(c.id).then(rafraichirCompteurs).catch(() => {})
    }
  }

  const repondre = (c) => {
    setForm({ ...FORM_VIDE, sujet: c.sujet.startsWith('Re: ') ? c.sujet : 'Re: ' + c.sujet,
              dossier: c.dossier_ref, parent: c.id, tribunal: c.tribunal || '' })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtres = courriers.filter(c =>
    onglet === 'recus' ? c.sens === 'sortant' : c.sens === 'entrant'
  )

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-700">Courriers</h1>
          <p className="text-gray-500 text-sm mt-1">Echanges avec le tribunal</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setForm(FORM_VIDE) }}
          className="btn-justice flex items-center gap-2">
          <FiEdit className="w-4 h-4" />
          Nouveau courrier
        </button>
      </div>

      {/* Formulaire nouveau courrier */}
      {showForm && (
        <div className="card mb-6 border-2 border-justice-200">
          <h3 className="font-semibold text-navy-700 mb-4 flex items-center gap-2">
            <FiMail className="w-4 h-4 text-justice-500" />
            {form.parent ? 'Repondre au tribunal' : 'Nouveau courrier'}
          </h3>
          <form onSubmit={envoyer} className="space-y-3">
            <div>
              <label className="form-label">Destinataire</label>
              <select className="form-select" value={form.destinataire}
                onChange={e => set('destinataire', e.target.value)}>
                {DESTINATAIRES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              {form.destinataire === 'juge_dossier' && dossierChoisi?.juge && (
                <p className="text-xs text-justice-600 mt-1">Juge : {dossierChoisi.juge}</p>
              )}
            </div>
            <div>
              <label className="form-label">Dossier concerne {form.destinataire === 'juge_dossier' ? '*' : '(optionnel)'}</label>
              <select className="form-select" value={form.dossier}
                onChange={e => set('dossier', e.target.value)}>
                <option value="">Aucun dossier specifique</option>
                {dossiers
                  .filter(d => form.destinataire !== 'juge_dossier' || d.juge)
                  .map(d => <option key={d.ref} value={d.ref}>{d.ref} — {d.libelle}</option>)}
              </select>
            </div>
            {!form.dossier && !form.parent && (
              <div>
                <label className="form-label">Tribunal *</label>
                <select className="form-select" value={form.tribunal}
                  onChange={e => set('tribunal', e.target.value)}>
                  <option value="">Selectionner...</option>
                  {tribunaux.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="form-label">Sujet *</label>
              <input className="form-input" placeholder="Ex: Question sur mon dossier..."
                value={form.sujet} onChange={e => set('sujet', e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Message *</label>
              <textarea className="form-input" rows={5}
                placeholder="Redigez votre message ici..."
                value={form.message} onChange={e => set('message', e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Piece jointe (optionnel)</label>
              <label className="flex items-center gap-2 border border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-justice-400 hover:bg-justice-50 transition-colors">
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={e => setFichiers(Array.from(e.target.files))} />
                <FiPaperclip className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {fichiers.length > 0 ? fichiers[0].name : 'Joindre un fichier PDF ou image'}
                </span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setForm(FORM_VIDE) }}
                className="btn-ghost flex-1">
                Annuler
              </button>
              <button type="submit" disabled={loading}
                className="btn-justice flex-1 flex items-center justify-center gap-2">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <FiSend className="w-4 h-4" />
                }
                {loading ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </form>
        </div>
      )}

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

      {/* Liste des courriers */}
      {chargement ? (
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-navy-100 border-t-navy-700 rounded-full animate-spin" />
        </div>
      ) : filtres.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FiMail className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Aucun courrier</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtres.map(c => {
            const recu = c.sens === 'sortant'
            const nonLu = recu && !c.lu
            return (
              <div key={c.id}
                className={`card cursor-pointer transition-all hover:shadow-card-hover ${
                  nonLu ? 'border-l-4 border-l-justice-400' : ''
                }`}
                onClick={() => ouvrir(c)}>

                {/* Header courrier */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      recu ? 'bg-justice-50' : 'bg-navy-50'
                    }`}>
                      {recu
                        ? <FiInbox className="w-4 h-4 text-justice-500" />
                        : <FiSend className="w-4 h-4 text-navy-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm truncate ${nonLu ? 'font-bold text-navy-700' : 'font-semibold text-gray-700'}`}>
                          {recu ? c.auteur_nom : `A : ${c.juge_nom ? 'Juge ' + c.juge_nom : c.destinataire_label} — ${c.tribunal_nom}`}
                        </p>
                        {nonLu && (
                          <span className="w-2 h-2 rounded-full bg-justice-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-sm truncate ${nonLu ? 'font-semibold text-navy-700' : 'text-gray-600'}`}>
                        {c.sujet}
                      </p>
                      {c.dossier_ref && (
                        <span className="text-xs text-justice-500 font-mono bg-justice-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {c.dossier_ref}
                        </span>
                      )}
                      {!recu && (
                        <span className="text-xs text-gray-400 ml-2">{c.lu ? 'Lu par le tribunal' : 'Non lu'}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <p className="text-xs text-gray-400">{fmtDate(c.created_at)}</p>
                    <p className="text-xs text-gray-400">{fmtHeure(c.created_at)}</p>
                    {ouvert === c.id
                      ? <FiChevronUp className="w-4 h-4 text-gray-400" />
                      : <FiChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                </div>

                {/* Contenu courrier */}
                {ouvert === c.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {c.message}
                    </p>
                    {c.piece_jointe && (
                      <a href={c.piece_jointe} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                        className="flex items-center gap-2 mt-3 bg-gray-50 rounded-xl p-3 hover:bg-gray-100">
                        <FiPaperclip className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-600">{c.piece_nom}</span>
                      </a>
                    )}
                    {c.numero_registre && (
                      <p className="text-xs text-gray-400 mt-3">Registre du greffe : <span className="font-mono">{c.numero_registre}</span></p>
                    )}
                    {recu && (
                      <button
                        onClick={e => { e.stopPropagation(); repondre(c) }}
                        className="mt-3 flex items-center gap-2 text-xs font-semibold text-justice-600 bg-justice-50 px-3 py-2 rounded-xl hover:bg-justice-100 transition-colors">
                        <FiSend className="w-3.5 h-3.5" />
                        Repondre
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
