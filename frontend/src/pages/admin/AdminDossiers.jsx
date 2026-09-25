import { useState, useEffect, useCallback } from 'react'
import {
  FiSearch, FiFilter, FiEye, FiPlus, FiCamera, FiUpload, FiFile, FiImage,
  FiTrash2, FiArchive, FiCheck, FiRotateCcw, FiMapPin, FiCheckCircle,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import { archivesAPI, messageErreur } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'

const REGISTRES = [
  { value: 'civil',    label: 'Affaires civiles' },
  { value: 'plaintes', label: 'Plaintes'         },
  { value: 'parquet',  label: 'Parquet'          },
]
const CATEGORIES = [
  { value: 'civil', label: 'Civil' }, { value: 'penal', label: 'Penal' },
  { value: 'commercial', label: 'Commercial' }, { value: 'social', label: 'Social' },
  { value: 'foncier', label: 'Foncier' }, { value: 'etat_civil', label: 'Etat civil' },
  { value: 'autre', label: 'Autre' },
]
const TYPES_PIECE = [
  { value: 'requete', label: 'Requete / assignation' }, { value: 'plainte', label: 'Plainte' },
  { value: 'pv', label: 'Proces-verbal' }, { value: 'jugement', label: 'Jugement / decision' },
  { value: 'identite', label: "Piece d'identite" }, { value: 'courrier', label: 'Courrier' },
  { value: 'preuve', label: 'Piece justificative' }, { value: 'autre', label: 'Autre' },
]
const STATUT_BADGE = {
  actif:   { status: 'progress', label: 'En cours' },
  clos:    { status: 'done',     label: 'Cloture'  },
  archive: { status: 'rejected', label: 'Archive'  },
}
const FORM_VIDE = {
  registre: 'civil', categorie: 'civil', intitule: '', demandeur: '', defendeur: '',
  juge: '', date_ouverture: new Date().toISOString().split('T')[0], mots_cles: '', observations: '',
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const fmtDateHeure = (d) => d ? new Date(d).toLocaleString('fr-FR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
const fmtTaille = (o) => o > 1024 * 1024 ? `${(o / 1024 / 1024).toFixed(1)} Mo` : `${Math.max(1, Math.round(o / 1024))} Ko`

export default function AdminDossiers() {
  const { user } = useAuth()
  const [dossiers, setDossiers] = useState([])
  const [stats, setStats]       = useState(null)
  const [juges, setJuges]       = useState([])
  const [chargement, setChargement] = useState(true)

  const [search, setSearch]     = useState('')
  const [registre, setRegistre] = useState('')
  const [statut, setStatut]     = useState('')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(FORM_VIDE)
  const [enregistrement, setEnregistrement] = useState(false)

  const [detail, setDetail]     = useState(null)
  const [typePiece, setTypePiece] = useState('autre')
  const [envoi, setEnvoi]       = useState(false)
  const [showArchivage, setShowArchivage] = useState(false)
  const [emplacement, setEmplacement] = useState({ salle: '', armoire: '', etagere: '', boite: '' })
  const [actionEnCours, setActionEnCours] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Chargement ─────────────────────────────────────────
  const charger = useCallback(async () => {
    setChargement(true)
    try {
      const params = {}
      if (search.trim()) params.q = search.trim()
      if (registre) params.registre = registre
      if (statut) params.statut = statut
      const res = await archivesAPI.list(params)
      setDossiers(res.data)
    } catch (err) {
      toast.error(messageErreur(err, 'Impossible de charger les dossiers.'))
    } finally {
      setChargement(false)
    }
  }, [search, registre, statut])

  const chargerStats = () => archivesAPI.stats().then(r => setStats(r.data)).catch(() => {})

  useEffect(() => {
    chargerStats()
    archivesAPI.juges().then(r => setJuges(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(charger, 300)
    return () => clearTimeout(t)
  }, [charger])

  const rafraichir = (d) => {
    setDetail(d)
    charger()
    chargerStats()
  }

  // ── Ouverture d'un dossier ─────────────────────────────
  const creer = async (e) => {
    e.preventDefault()
    if (!form.intitule.trim()) { toast.error("L'intitule est obligatoire"); return }
    setEnregistrement(true)
    try {
      const data = { ...form, juge: form.juge || null }
      const res = await archivesAPI.create(data)
      toast.success(`Dossier ouvert : ${res.data.numero}`)
      setShowForm(false)
      setForm(FORM_VIDE)
      rafraichir(res.data)
    } catch (err) {
      toast.error(messageErreur(err, "Erreur lors de l'ouverture du dossier."))
    } finally {
      setEnregistrement(false)
    }
  }

  const ouvrirDetail = async (d) => {
    setShowArchivage(false)
    try {
      const res = await archivesAPI.detail(d.id)
      setDetail(res.data)
      setEmplacement({ salle: res.data.salle, armoire: res.data.armoire, etagere: res.data.etagere, boite: res.data.boite })
    } catch (err) {
      toast.error(messageErreur(err))
    }
  }

  // ── Numérisation ───────────────────────────────────────
  const ajouterPieces = async (fichiers) => {
    if (!fichiers.length) return
    setEnvoi(true)
    try {
      await archivesAPI.ajouterPieces(detail.id, fichiers, typePiece)
      const res = await archivesAPI.detail(detail.id)
      toast.success(`${fichiers.length} piece(s) numerisee(s)`)
      rafraichir(res.data)
    } catch (err) {
      toast.error(messageErreur(err, "Echec de l'envoi des pieces."))
    } finally {
      setEnvoi(false)
    }
  }

  const supprimerPiece = async (piece) => {
    if (!window.confirm(`Supprimer definitivement « ${piece.nom} » ?`)) return
    try {
      await archivesAPI.supprimerPiece(detail.id, piece.id)
      const res = await archivesAPI.detail(detail.id)
      toast.success('Piece supprimee')
      rafraichir(res.data)
    } catch (err) {
      toast.error(messageErreur(err))
    }
  }

  // ── Cycle de vie ───────────────────────────────────────
  const executer = async (fn, succes) => {
    setActionEnCours(true)
    try {
      const res = await fn()
      toast.success(succes)
      setShowArchivage(false)
      rafraichir(res.data)
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setActionEnCours(false)
    }
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-700">Dossiers et archives</h1>
          <p className="text-gray-500 text-sm mt-1">Numerisation, recherche et localisation des dossiers</p>
        </div>
        <button onClick={() => { setForm(FORM_VIDE); setShowForm(true) }} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" /> Ouvrir un dossier
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { num: stats?.actifs ?? '—',   label: 'En cours' },
          { num: stats?.clos ?? '—',     label: 'Clotures' },
          { num: stats?.archives ?? '—', label: 'Archives' },
          { num: stats?.pieces ?? '—',   label: 'Pieces numerisees', color: 'text-justice-500' },
        ].map(s => (
          <div key={s.label} className="kpi-box">
            <div className={`kpi-num ${s.color || ''}`}>{s.num}</div>
            <div className="kpi-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input className="form-input pl-10"
            placeholder="Rechercher : n° de dossier, partie, mot-cle, nom d'une piece..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select lg:w-44" value={statut} onChange={e => setStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="actif">En cours</option>
          <option value="clos">Clotures</option>
          <option value="archive">Archives</option>
        </select>
      </div>
      <div className="flex gap-2 overflow-x-auto mb-4">
        {[{ value: '', label: 'Tous' }, ...REGISTRES].map(r => (
          <button key={r.value} onClick={() => setRegistre(r.value)}
            className={`px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              registre === r.value ? 'bg-navy-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden overflow-x-auto">
        <table className="data-table min-w-full">
          <thead><tr>
            <th>N° Dossier</th>
            <th>Parties</th>
            <th>Categorie</th>
            <th>Juge</th>
            <th>Ouverture</th>
            <th>Pieces</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>
            {dossiers.map(d => (
              <tr key={d.id} className="cursor-pointer" onClick={() => ouvrirDetail(d)}>
                <td className="font-mono text-xs font-bold text-navy-700 whitespace-nowrap">{d.numero}</td>
                <td>
                  <p className="font-medium text-sm">{d.demandeur || '—'}{d.defendeur && <span className="text-gray-400"> c/ </span>}{d.defendeur}</p>
                  <p className="text-xs text-gray-500 truncate max-w-xs">{d.intitule}</p>
                </td>
                <td>
                  <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    {d.categorie_label}
                  </span>
                </td>
                <td className="text-gray-600 text-sm">{d.juge_nom || '—'}</td>
                <td className="text-gray-500 text-xs">{fmtDate(d.date_ouverture)}</td>
                <td className="text-xs font-semibold text-navy-700">{d.nb_pieces}</td>
                <td><Badge {...STATUT_BADGE[d.statut]} /></td>
                <td>
                  <button onClick={e => { e.stopPropagation(); ouvrirDetail(d) }}
                    className="flex items-center gap-1 text-xs font-semibold text-navy-700 bg-navy-50 px-3 py-1.5 rounded-lg hover:bg-navy-100 transition-colors">
                    <FiEye className="w-3.5 h-3.5" /> Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {chargement && (
          <div className="flex justify-center py-8">
            <span className="w-6 h-6 border-2 border-navy-100 border-t-navy-700 rounded-full animate-spin" />
          </div>
        )}
        {!chargement && dossiers.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <FiFilter className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Aucun dossier ne correspond a votre recherche</p>
          </div>
        )}
      </div>

      {/* ── Modal : ouvrir un dossier ── */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Ouvrir un dossier" size="lg">
        <form onSubmit={creer} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Registre *</label>
              <select className="form-select" value={form.registre} onChange={e => set('registre', e.target.value)}>
                {REGISTRES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                {{ civil: 'RAC', plaintes: 'RPL', parquet: 'RPQ' }[form.registre]}-00001/{new Date().getFullYear()}/JURIDICTION
              </p>
            </div>
            <div>
              <label className="form-label">Categorie</label>
              <select className="form-select" value={form.categorie} onChange={e => set('categorie', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Intitule de l'affaire *</label>
            <input className="form-input" placeholder="Ex : Litige foncier — parcelle n° 1234 Keur Massar"
              value={form.intitule} onChange={e => set('intitule', e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Demandeur / plaignant</label>
              <input className="form-input" value={form.demandeur} onChange={e => set('demandeur', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Defendeur / mis en cause</label>
              <input className="form-input" value={form.defendeur} onChange={e => set('defendeur', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Juge assigne</label>
              <select className="form-select" value={form.juge} onChange={e => set('juge', e.target.value)}>
                <option value="">Non assigne</option>
                {juges.map(j => <option key={j.id} value={j.id}>{j.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Date d'ouverture</label>
              <input type="date" className="form-input" value={form.date_ouverture}
                onChange={e => set('date_ouverture', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="form-label">Mots-cles (pour la recherche)</label>
            <input className="form-input" placeholder="Ex : titre foncier, bornage, succession"
              value={form.mots_cles} onChange={e => set('mots_cles', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Observations</label>
            <textarea className="form-input" rows={3} value={form.observations}
              onChange={e => set('observations', e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Annuler</button>
            <button type="submit" disabled={enregistrement} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {enregistrement
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <FiCheck className="w-4 h-4" />}
              {enregistrement ? 'Ouverture...' : 'Ouvrir le dossier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal : détail du dossier ── */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={`Dossier ${detail?.numero || ''}`} size="lg">
        {detail && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2"><label className="form-label">Intitule</label>
                <p className="font-semibold text-navy-700">{detail.intitule}</p></div>
              <div><label className="form-label">Demandeur</label><p className="font-semibold">{detail.demandeur || '—'}</p></div>
              <div><label className="form-label">Defendeur</label><p className="font-semibold">{detail.defendeur || '—'}</p></div>
              <div><label className="form-label">Registre</label><p>{detail.registre_label}</p></div>
              <div><label className="form-label">Categorie</label><p>{detail.categorie_label}</p></div>
              <div><label className="form-label">Juge assigne</label><p className="font-semibold">{detail.juge_nom || '—'}</p></div>
              <div><label className="form-label">Statut</label><Badge {...STATUT_BADGE[detail.statut]} /></div>
              <div><label className="form-label">Ouverture</label><p>{fmtDate(detail.date_ouverture)}</p></div>
              <div><label className="form-label">Cloture</label><p>{fmtDate(detail.date_cloture)}</p></div>
            </div>

            {detail.emplacement && (
              <div className="flex items-center gap-2 bg-gold-50 border border-gold-100 rounded-xl px-4 py-3 text-sm text-navy-700">
                <FiMapPin className="w-4 h-4 text-gold-500 flex-shrink-0" />
                <span><strong>Original papier :</strong> {detail.emplacement}</span>
              </div>
            )}

            {/* Pièces numérisées */}
            <div>
              <label className="form-label">Pieces numerisees ({detail.pieces.length})</label>
              <div className="space-y-2 mt-2">
                {detail.pieces.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-navy-50 flex items-center justify-center flex-shrink-0">
                      {p.extension === 'pdf' ? <FiFile className="w-4 h-4 text-navy-500" /> : <FiImage className="w-4 h-4 text-navy-500" />}
                    </div>
                    <a href={p.fichier} target="_blank" rel="noreferrer" className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-700 truncate hover:underline">{p.nom}</p>
                      <p className="text-xs text-gray-400">{p.type_label} · {fmtTaille(p.taille)} · {p.ajoute_par_nom}</p>
                    </a>
                    {user?.role === 'admin' && (
                      <button onClick={() => supprimerPiece(p)} title="Supprimer"
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {detail.pieces.length === 0 && (
                  <p className="text-sm text-gray-400">Aucune piece numerisee pour ce dossier.</p>
                )}
              </div>

              {detail.statut !== 'archive' && (
                <div className="mt-3 space-y-2">
                  <select className="form-select" value={typePiece} onChange={e => setTypePiece(e.target.value)}>
                    {TYPES_PIECE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-justice-400 hover:bg-justice-50 transition-colors ${envoi ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input type="file" className="hidden" accept="image/*" capture="environment"
                        onChange={e => { ajouterPieces(Array.from(e.target.files)); e.target.value = '' }} />
                      <FiCamera className="w-4 h-4 text-justice-500" />
                      <span className="text-sm font-semibold text-gray-600">Scanner</span>
                    </label>
                    <label className={`flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-navy-400 hover:bg-navy-50 transition-colors ${envoi ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={e => { ajouterPieces(Array.from(e.target.files)); e.target.value = '' }} />
                      <FiUpload className="w-4 h-4 text-navy-500" />
                      <span className="text-sm font-semibold text-gray-600">{envoi ? 'Envoi...' : 'Importer'}</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-400">PDF ou images · 15 Mo max par fichier</p>
                </div>
              )}
            </div>

            {/* Historique */}
            <div>
              <label className="form-label">Historique</label>
              <div className="mt-2">
                {detail.historique.map((h, i) => (
                  <div key={h.id} className="tracker-step">
                    {i < detail.historique.length - 1 && <div className="tracker-line bg-gray-200" />}
                    <div className={`tracker-dot ${i === detail.historique.length - 1 ? 'bg-gold-400' : 'bg-justice-400'}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-700">{h.action}</p>
                      <p className="text-xs text-gray-400">{fmtDateHeure(h.date)} · {h.agent_nom}</p>
                      {h.detail && <p className="text-xs text-gray-600 mt-0.5">{h.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Archivage : emplacement de l'original */}
            {showArchivage && (
              <div className="border-2 border-gold-100 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-semibold text-navy-700 flex items-center gap-2">
                  <FiMapPin className="w-4 h-4 text-gold-500" /> Ou est classe l'original papier ?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[['salle', 'Salle *', 'Ex : A2'], ['armoire', 'Armoire', 'Ex : 3'],
                    ['etagere', 'Etagere', 'Ex : B'], ['boite', "Boite d'archives *", 'Ex : 2026-014']].map(([k, l, ph]) => (
                    <div key={k}>
                      <label className="form-label">{l}</label>
                      <input className="form-input" placeholder={ph} value={emplacement[k]}
                        onChange={e => setEmplacement(x => ({ ...x, [k]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowArchivage(false)} className="btn-ghost flex-1">Annuler</button>
                  <button disabled={actionEnCours}
                    onClick={() => executer(() => archivesAPI.archiver(detail.id, emplacement), 'Dossier archive')}
                    className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <FiArchive className="w-4 h-4" /> Confirmer l'archivage
                  </button>
                </div>
              </div>
            )}

            {!showArchivage && (
              <div className="flex gap-3">
                {detail.statut === 'actif' && (
                  <button disabled={actionEnCours} onClick={() => executer(() => archivesAPI.cloturer(detail.id), 'Dossier cloture')}
                    className="btn-ghost flex-1 flex items-center justify-center gap-2">
                    <FiCheckCircle className="w-4 h-4" /> Cloturer
                  </button>
                )}
                {detail.statut !== 'archive' && (
                  <button onClick={() => setShowArchivage(true)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <FiArchive className="w-4 h-4" /> Archiver
                  </button>
                )}
                {detail.statut !== 'actif' && (
                  <button disabled={actionEnCours} onClick={() => executer(() => archivesAPI.rouvrir(detail.id), 'Dossier rouvert')}
                    className="btn-ghost flex-1 flex items-center justify-center gap-2">
                    <FiRotateCcw className="w-4 h-4" /> Rouvrir
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
