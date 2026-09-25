import { useState, useEffect, useCallback } from 'react'
import {
  FiInbox, FiSend, FiRepeat, FiPlus, FiSearch, FiEye, FiDownload, FiFilter,
  FiPaperclip, FiCamera, FiArrowRight, FiCheck, FiArchive, FiAlertCircle,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import { registresAPI, messageErreur } from '../../services/api.js'

// ── Référentiels ───────────────────────────────────────
const REGISTRES = [
  { value: 'civil',         label: 'Affaires civiles' },
  { value: 'plaintes',      label: 'Plaintes'         },
  { value: 'parquet',       label: 'Parquet'          },
  { value: 'administratif', label: 'Administratif'    },
]

// statut du courrier → couleur du badge existant
const STATUT_BADGE = {
  enregistre: { status: 'pending',  label: 'Enregistre' },
  transmis:   { status: 'progress', label: 'Transmis'   },
  recu:       { status: 'progress', label: 'Recu'       },
  traite:     { status: 'done',     label: 'Traite'     },
  expedie:    { status: 'done',     label: 'Expedie'    },
  archive:    { status: 'rejected', label: 'Archive'    },
}

const ACTION_COULEUR = {
  enregistrement: 'bg-navy-700',
  transmission:   'bg-gold-400',
  reception:      'bg-justice-400',
  traitement:     'bg-justice-500',
  expedition:     'bg-navy-500',
  archivage:      'bg-gray-400',
}

const FORM_VIDE = {
  sens: 'arrivee', registre: 'civil', date_courrier: new Date().toISOString().split('T')[0],
  correspondant: '', adresse_correspondant: '', reference_externe: '', objet: '', resume: '',
  nombre_pieces: 1, priorite: 'normale', dossier_lie: '',
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
const fmtDateHeure = (d) => d ? new Date(d).toLocaleString('fr-FR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

export default function AdminRegistres() {
  const [onglet, setOnglet]     = useState('arrivee')        // arrivee | depart | transmission
  const [courriers, setCourriers] = useState([])
  const [transmissions, setTransmissions] = useState([])
  const [stats, setStats]       = useState(null)
  const [services, setServices] = useState([])
  const [chargement, setChargement] = useState(true)

  const [search, setSearch]     = useState('')
  const [registre, setRegistre] = useState('')
  const [statut, setStatut]     = useState('')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(FORM_VIDE)
  const [scan, setScan]         = useState(null)
  const [enregistrement, setEnregistrement] = useState(false)

  const [detail, setDetail]     = useState(null)
  const [destination, setDestination] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [actionEnCours, setActionEnCours] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const labelService = (v) => services.find(s => s.value === v)?.label || v

  // ── Chargement ─────────────────────────────────────────
  const charger = useCallback(async () => {
    setChargement(true)
    try {
      if (onglet === 'transmission') {
        const res = await registresAPI.transmissions()
        setTransmissions(res.data)
      } else {
        const params = { sens: onglet }
        if (search.trim()) params.q = search.trim()
        if (registre) params.registre = registre
        if (statut) params.statut = statut
        const res = await registresAPI.list(params)
        setCourriers(res.data)
      }
    } catch (err) {
      toast.error(messageErreur(err, 'Impossible de charger le registre.'))
    } finally {
      setChargement(false)
    }
  }, [onglet, search, registre, statut])

  const chargerStats = () => registresAPI.stats().then(r => setStats(r.data)).catch(() => {})

  useEffect(() => {
    registresAPI.services().then(r => setServices(r.data)).catch(() => {})
    chargerStats()
  }, [])

  // petite temporisation pour la recherche
  useEffect(() => {
    const t = setTimeout(charger, 300)
    return () => clearTimeout(t)
  }, [charger])

  // ── Enregistrement d'un courrier ───────────────────────
  const ouvrirFormulaire = () => {
    setForm({ ...FORM_VIDE, sens: onglet === 'depart' ? 'depart' : 'arrivee' })
    setScan(null)
    setShowForm(true)
  }

  const enregistrer = async (e) => {
    e.preventDefault()
    if (!form.correspondant.trim() || !form.objet.trim()) {
      toast.error('Correspondant et objet sont obligatoires')
      return
    }
    setEnregistrement(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (scan) fd.append('fichier', scan)
      const res = await registresAPI.create(fd)
      toast.success(`Enregistre sous le n° ${res.data.numero}`)
      setShowForm(false)
      if (onglet !== res.data.sens) setOnglet(res.data.sens)
      else charger()
      chargerStats()
      setDetail(res.data)
    } catch (err) {
      toast.error(messageErreur(err, "Erreur lors de l'enregistrement."))
    } finally {
      setEnregistrement(false)
    }
  }

  // ── Circuit du courrier ────────────────────────────────
  const ouvrirDetail = async (c) => {
    setDestination('')
    setCommentaire('')
    try {
      const res = await registresAPI.detail(c.id)
      setDetail(res.data)
    } catch (err) {
      toast.error(messageErreur(err))
    }
  }

  const executer = async (fn, succes) => {
    setActionEnCours(true)
    try {
      const res = await fn()
      setDetail(res.data)
      setCommentaire('')
      setDestination('')
      toast.success(succes)
      charger()
      chargerStats()
    } catch (err) {
      toast.error(messageErreur(err))
    } finally {
      setActionEnCours(false)
    }
  }

  const transmettre = () => {
    if (!destination) { toast.error('Choisissez le service destinataire'); return }
    executer(() => registresAPI.transmettre(detail.id, destination, commentaire),
      `Transmis a : ${labelService(destination)}`)
  }

  // ── Export Excel (CSV) ─────────────────────────────────
  const exporter = async () => {
    try {
      const params = onglet === 'transmission' ? {} : { sens: onglet }
      if (registre) params.registre = registre
      const res = await registresAPI.exporter(params)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `registre_courrier_${onglet}_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Registre exporte')
    } catch (err) {
      toast.error(messageErreur(err, "Echec de l'export."))
    }
  }

  const ouvert = detail && !['archive'].includes(detail.statut)

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-700">Registres du greffe</h1>
          <p className="text-gray-500 text-sm mt-1">
            Courrier arrivee / depart et registre de transmission
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exporter} className="btn-ghost flex items-center gap-2">
            <FiDownload className="w-4 h-4" /> Exporter
          </button>
          <button onClick={ouvrirFormulaire} className="btn-primary flex items-center gap-2">
            <FiPlus className="w-4 h-4" /> Enregistrer un courrier
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { num: stats?.arrivees ?? '—',        label: 'Arrivees',        color: 'text-navy-700'    },
          { num: stats?.departs ?? '—',         label: 'Departs',         color: 'text-justice-500' },
          { num: stats?.en_circulation ?? '—',  label: 'En circulation',  color: 'text-gold-500'    },
          { num: stats?.urgents_ouverts ?? '—', label: 'Urgents ouverts', color: 'text-red-600'     },
        ].map(s => (
          <div key={s.label} className="kpi-box text-center">
            <div className={`kpi-num ${s.color}`}>{s.num}</div>
            <div className="kpi-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-4">
        {[
          { id: 'arrivee',      label: 'Arrivee',      icon: FiInbox  },
          { id: 'depart',       label: 'Depart',       icon: FiSend   },
          { id: 'transmission', label: 'Transmission', icon: FiRepeat },
        ].map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              onglet === o.id ? 'bg-white text-navy-700 shadow-sm' : 'text-gray-500'
            }`}>
            <o.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        ))}
      </div>

      {/* ── Registre arrivée / départ ── */}
      {onglet !== 'transmission' && (
        <>
          <div className="flex flex-col lg:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input className="form-input pl-10"
                placeholder="Rechercher : n° d'ordre, objet, correspondant, reference, dossier..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-select lg:w-48" value={statut} onChange={e => setStatut(e.target.value)}>
              <option value="">Tous les statuts</option>
              {Object.entries(STATUT_BADGE).map(([v, b]) => <option key={v} value={v}>{b.label}</option>)}
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
                <th>N° d'ordre</th>
                <th>Date</th>
                <th>{onglet === 'arrivee' ? 'Expediteur' : 'Destinataire'}</th>
                <th>Objet</th>
                <th>Registre</th>
                <th>Service actuel</th>
                <th>Statut</th>
                <th></th>
              </tr></thead>
              <tbody>
                {courriers.map(c => (
                  <tr key={c.id} className="cursor-pointer" onClick={() => ouvrirDetail(c)}>
                    <td className="font-mono text-xs font-bold text-navy-700 whitespace-nowrap">
                      {c.priorite === 'urgente' && <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5" title="Urgent" />}
                      {c.numero}
                    </td>
                    <td className="text-gray-500 text-xs whitespace-nowrap">{fmtDate(c.date_enregistrement)}</td>
                    <td className="font-medium">{c.correspondant}</td>
                    <td className="text-sm max-w-xs truncate">{c.objet}</td>
                    <td>
                      <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {c.registre_label}
                      </span>
                    </td>
                    <td className="text-gray-600 text-xs">{c.service_label}</td>
                    <td><Badge {...(STATUT_BADGE[c.statut] || { status: 'pending', label: c.statut_label })} /></td>
                    <td>
                      <button onClick={e => { e.stopPropagation(); ouvrirDetail(c) }}
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
            {!chargement && courriers.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <FiFilter className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Aucun courrier dans ce registre</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Registre de transmission ── */}
      {onglet === 'transmission' && (
        <div className="card p-0 overflow-hidden overflow-x-auto">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-navy-700 text-sm uppercase tracking-wide">
              Registre de transmission — mouvements recents
            </h3>
          </div>
          <table className="data-table min-w-full">
            <thead><tr>
              <th>Date</th><th>N° d'ordre</th><th>Operation</th><th>De</th><th></th><th>Vers</th><th>Agent</th><th>Observation</th>
            </tr></thead>
            <tbody>
              {transmissions.map(t => (
                <tr key={t.id}>
                  <td className="text-gray-500 text-xs whitespace-nowrap">{fmtDateHeure(t.date)}</td>
                  <td className="font-mono text-xs font-bold text-navy-700 whitespace-nowrap">{t.courrier_numero}</td>
                  <td>
                    <span className="text-xs font-semibold bg-navy-50 text-navy-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {t.action_label}
                    </span>
                  </td>
                  <td className="text-xs text-gray-600">{t.origine_label || '—'}</td>
                  <td><FiArrowRight className="w-3.5 h-3.5 text-gold-400" /></td>
                  <td className="text-xs text-gray-600">{t.destination_label || '—'}</td>
                  <td className="text-xs font-medium">{t.agent_nom}</td>
                  <td className="text-xs text-gray-500 max-w-xs truncate">{t.commentaire}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!chargement && transmissions.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <FiRepeat className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Aucun mouvement enregistre</p>
            </div>
          )}
        </div>
      )}

      {/* ── Modal : enregistrer un courrier ── */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Enregistrer un courrier" size="lg">
        <form onSubmit={enregistrer} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-2xl p-1">
            {[{ v: 'arrivee', l: 'Courrier arrivee', i: FiInbox }, { v: 'depart', l: 'Courrier depart', i: FiSend }].map(o => (
              <button key={o.v} type="button" onClick={() => set('sens', o.v)}
                className={`py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  form.sens === o.v ? 'bg-white text-navy-700 shadow-sm' : 'text-gray-500'
                }`}>
                <o.i className="w-4 h-4" /> {o.l}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Le n° d'ordre est attribue automatiquement : <span className="font-mono text-navy-700">
            {form.sens === 'arrivee' ? 'CA' : 'CD'}-00001/{new Date().getFullYear()}/JURIDICTION</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Registre *</label>
              <select className="form-select" value={form.registre} onChange={e => set('registre', e.target.value)}>
                {REGISTRES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Date du courrier *</label>
              <input type="date" className="form-input" value={form.date_courrier}
                onChange={e => set('date_courrier', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">{form.sens === 'arrivee' ? 'Expediteur *' : 'Destinataire *'}</label>
              <input className="form-input" placeholder="Nom, cabinet, administration..."
                value={form.correspondant} onChange={e => set('correspondant', e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Reference du document</label>
              <input className="form-input" placeholder="Ex : N° 245/MJ/DSJ"
                value={form.reference_externe} onChange={e => set('reference_externe', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="form-label">Adresse</label>
            <input className="form-input" placeholder="Adresse de l'expediteur / du destinataire"
              value={form.adresse_correspondant} onChange={e => set('adresse_correspondant', e.target.value)} />
          </div>

          <div>
            <label className="form-label">Objet *</label>
            <input className="form-input" placeholder="Objet du courrier"
              value={form.objet} onChange={e => set('objet', e.target.value)} required />
          </div>

          <div>
            <label className="form-label">Analyse / resume</label>
            <textarea className="form-input" rows={3} placeholder="Resume du contenu (facultatif)"
              value={form.resume} onChange={e => set('resume', e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">Nb pieces</label>
              <input type="number" min={1} className="form-input" value={form.nombre_pieces}
                onChange={e => set('nombre_pieces', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Priorite</label>
              <select className="form-select" value={form.priorite} onChange={e => set('priorite', e.target.value)}>
                <option value="normale">Normale</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="form-label">Dossier lie</label>
              <input className="form-input" placeholder="RAC-..., PLT-..."
                value={form.dossier_lie} onChange={e => set('dossier_lie', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="form-label">Scan du courrier</label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 border border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-navy-400 hover:bg-navy-50 transition-colors">
                <input type="file" className="hidden" accept="image/*" capture="environment"
                  onChange={e => setScan(e.target.files[0] || null)} />
                <FiCamera className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Scanner</span>
              </label>
              <label className="flex items-center gap-2 border border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-navy-400 hover:bg-navy-50 transition-colors">
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setScan(e.target.files[0] || null)} />
                <FiPaperclip className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Joindre un fichier</span>
              </label>
            </div>
            {scan && <p className="text-xs text-justice-500 mt-1.5 font-semibold truncate">✓ {scan.name}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Annuler</button>
            <button type="submit" disabled={enregistrement}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {enregistrement
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <FiCheck className="w-4 h-4" />}
              {enregistrement ? 'Enregistrement...' : 'Enregistrer au registre'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal : détail + circuit ── */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={detail ? `Courrier ${detail.sens_label.toLowerCase()}` : ''} size="lg">
        {detail && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">N° d'ordre</p>
                <p className="font-mono text-lg font-bold text-navy-700">{detail.numero}</p>
              </div>
              <div className="flex items-center gap-2">
                {detail.priorite === 'urgente' && <Badge status="urgent" label="Urgent" />}
                <Badge {...(STATUT_BADGE[detail.statut] || { status: 'pending' })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><label className="form-label">{detail.sens === 'arrivee' ? 'Expediteur' : 'Destinataire'}</label>
                <p className="font-semibold">{detail.correspondant}</p>
                {detail.adresse_correspondant && <p className="text-xs text-gray-500">{detail.adresse_correspondant}</p>}</div>
              <div><label className="form-label">Registre</label><p className="font-semibold">{detail.registre_label}</p></div>
              <div><label className="form-label">Date du courrier</label><p>{fmtDate(detail.date_courrier)}</p></div>
              <div><label className="form-label">Enregistre le</label><p>{fmtDateHeure(detail.date_enregistrement)}</p></div>
              <div><label className="form-label">Reference</label><p>{detail.reference_externe || '—'}</p></div>
              <div><label className="form-label">Pieces</label><p>{detail.nombre_pieces}</p></div>
              <div><label className="form-label">Service actuel</label><p className="font-semibold text-navy-700">{detail.service_label}</p></div>
              <div><label className="form-label">Dossier lie</label><p className="font-mono text-xs">{detail.dossier_lie || '—'}</p></div>
            </div>

            <div>
              <label className="form-label">Objet</label>
              <p className="text-sm font-semibold text-navy-700">{detail.objet}</p>
              {detail.resume && <p className="text-sm text-gray-600 mt-1 leading-relaxed">{detail.resume}</p>}
            </div>

            {detail.fichier && (
              <a href={detail.fichier} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-xs font-semibold text-navy-700 bg-navy-50 px-3 py-2 rounded-xl hover:bg-navy-100 transition-colors w-fit">
                <FiPaperclip className="w-3.5 h-3.5" /> Ouvrir le scan
              </a>
            )}

            {/* Circuit */}
            <div>
              <label className="form-label">Circuit du courrier</label>
              <div className="mt-2">
                {detail.transmissions.map((t, i) => (
                  <div key={t.id} className="tracker-step">
                    {i < detail.transmissions.length - 1 && <div className="tracker-line bg-gray-200" />}
                    <div className={`tracker-dot ${ACTION_COULEUR[t.action] || 'bg-navy-700'}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-700">
                        {t.action_label}
                        {t.action === 'transmission' && <span className="font-normal text-gray-600"> : {t.origine_label} → {t.destination_label}</span>}
                      </p>
                      <p className="text-xs text-gray-400">{fmtDateHeure(t.date)} · {t.agent_nom}</p>
                      {t.commentaire && <p className="text-xs text-gray-600 mt-0.5">{t.commentaire}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {ouvert ? (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <label className="form-label">Faire avancer le courrier</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select className="form-select flex-1" value={destination} onChange={e => setDestination(e.target.value)}>
                    <option value="">Transmettre a...</option>
                    {services.filter(s => s.value !== detail.service_actuel && s.value !== 'exterieur').map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button onClick={transmettre} disabled={actionEnCours}
                    className="btn-primary flex items-center justify-center gap-2">
                    <FiArrowRight className="w-4 h-4" /> Transmettre
                  </button>
                </div>
                <input className="form-input" placeholder="Observation (facultatif) — ex : pour attribution, pour avis..."
                  value={commentaire} onChange={e => setCommentaire(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  {detail.statut === 'transmis' && (
                    <button disabled={actionEnCours} onClick={() => executer(() => registresAPI.accuser(detail.id, commentaire), 'Accuse de reception enregistre')}
                      className="btn-justice flex items-center gap-2"><FiCheck className="w-4 h-4" /> Accuser reception</button>
                  )}
                  {!['traite', 'expedie'].includes(detail.statut) && (
                    <button disabled={actionEnCours} onClick={() => executer(() => registresAPI.traiter(detail.id, commentaire), 'Courrier traite')}
                      className="btn-ghost flex items-center gap-2"><FiCheck className="w-4 h-4" /> Marquer traite</button>
                  )}
                  {detail.sens === 'depart' && detail.statut !== 'expedie' && (
                    <button disabled={actionEnCours} onClick={() => executer(() => registresAPI.expedier(detail.id, commentaire), 'Courrier expedie')}
                      className="btn-ghost flex items-center gap-2"><FiSend className="w-4 h-4" /> Expedier</button>
                  )}
                  <button disabled={actionEnCours} onClick={() => executer(() => registresAPI.archiver(detail.id, commentaire), 'Courrier archive')}
                    className="btn-ghost flex items-center gap-2"><FiArchive className="w-4 h-4" /> Archiver</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0" /> Courrier archive — le circuit est clos.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
