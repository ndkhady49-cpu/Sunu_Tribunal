import { useState } from 'react'
import { FiMail, FiSend, FiPaperclip, FiChevronDown, FiChevronUp, FiInbox, FiEdit } from 'react-icons/fi'
import toast from 'react-hot-toast'

const COURRIERS = [
  {
    id: 1,
    type: 'recu',
    expediteur: 'Greffe TGI Dakar',
    sujet: 'Convocation audience — PLT-2025-09341',
    message: 'Vous etes convoque a une audience le 15 mai 2025 a 10h00 au Tribunal de Grande Instance de Dakar, Salle 3. Veuillez vous presenter avec toutes vos pieces justificatives.',
    date: '01 mai 2025',
    heure: '09:15',
    lu: true,
    dossier: 'PLT-2025-09341',
    pieceJointe: null,
  },
  {
    id: 2,
    type: 'recu',
    expediteur: 'Juge Mme Sarr',
    sujet: 'Demande de piece complementaire',
    message: 'Dans le cadre de votre dossier PLT-2025-09341, nous avons besoin de votre justificatif de domicile et une copie de votre CNI. Veuillez les deposer au greffe ou les envoyer via cette application.',
    date: '30 avr 2025',
    heure: '14:30',
    lu: false,
    dossier: 'PLT-2025-09341',
    pieceJointe: null,
  },
  {
    id: 3,
    type: 'envoye',
    expediteur: 'Moi',
    sujet: 'Question sur mon dossier RDV-2025-04817',
    message: 'Bonjour, je voudrais savoir si mon rendez-vous du 07 mai est toujours confirme. Merci.',
    date: '28 avr 2025',
    heure: '11:00',
    lu: true,
    dossier: 'RDV-2025-04817',
    pieceJointe: null,
  },
]

export default function CourrierPage() {
  const [onglet, setOnglet]       = useState('recus')
  const [ouvert, setOuvert]       = useState(null)
  const [showForm, setShowForm]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [fichiers, setFichiers]   = useState([])
  const [courriers, setCourriers] = useState(COURRIERS)
  const [form, setForm] = useState({
    sujet: '', message: '', dossier: '', destinataire: 'Greffe TGI Dakar',
  })

  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  const nonLus = courriers.filter(c => c.type === 'recu' && !c.lu).length

  const envoyer = async (e) => {
    e.preventDefault()
    if (!form.sujet || !form.message) {
      toast.error('Remplissez le sujet et le message')
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    const nouveau = {
      id: Date.now(),
      type: 'envoye',
      expediteur: 'Moi',
      sujet: form.sujet,
      message: form.message,
      date: new Date().toLocaleDateString('fr-FR'),
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      lu: true,
      dossier: form.dossier,
      pieceJointe: fichiers.length > 0 ? fichiers[0].name : null,
    }
    setCourriers(c => [nouveau, ...c])
    toast.success('Courrier envoye avec succes !')
    setShowForm(false)
    setForm({ sujet: '', message: '', dossier: '', destinataire: 'Greffe TGI Dakar' })
    setFichiers([])
    setOnglet('envoyes')
    setLoading(false)
  }

  const marquerLu = (id) => {
    setCourriers(c => c.map(x => x.id === id ? {...x, lu: true} : x))
  }

  const filtres = courriers.filter(c =>
    onglet === 'recus' ? c.type === 'recu' : c.type === 'envoye'
  )

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-700">Courriers</h1>
          <p className="text-gray-500 text-sm mt-1">Echanges avec le tribunal</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
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
            Nouveau courrier
          </h3>
          <form onSubmit={envoyer} className="space-y-3">
            <div>
              <label className="form-label">Destinataire</label>
              <select className="form-select" value={form.destinataire}
                onChange={e => set('destinataire', e.target.value)}>
                <option>Greffe TGI Dakar</option>
                <option>Juge Mme Sarr</option>
                <option>Juge M. Badji</option>
                <option>Administration TGI Dakar</option>
              </select>
            </div>
            <div>
              <label className="form-label">Dossier concerne (optionnel)</label>
              <select className="form-select" value={form.dossier}
                onChange={e => set('dossier', e.target.value)}>
                <option value="">Aucun dossier specifique</option>
                <option>PLT-2025-09341</option>
                <option>RDV-2025-04817</option>
              </select>
            </div>
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
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setFichiers(Array.from(e.target.files))} />
                <FiPaperclip className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {fichiers.length > 0 ? fichiers[0].name : 'Joindre un fichier PDF ou image'}
                </span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
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
      {filtres.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FiMail className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Aucun courrier</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtres.map(c => (
            <div key={c.id}
              className={`card cursor-pointer transition-all hover:shadow-card-hover ${
                !c.lu && c.type === 'recu' ? 'border-l-4 border-l-justice-400' : ''
              }`}
              onClick={() => {
                setOuvert(ouvert === c.id ? null : c.id)
                if (!c.lu) marquerLu(c.id)
              }}>

              {/* Header courrier */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    c.type === 'recu' ? 'bg-justice-50' : 'bg-navy-50'
                  }`}>
                    {c.type === 'recu'
                      ? <FiInbox className="w-4 h-4 text-justice-500" />
                      : <FiSend className="w-4 h-4 text-navy-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm truncate ${!c.lu && c.type === 'recu' ? 'font-bold text-navy-700' : 'font-semibold text-gray-700'}`}>
                        {c.type === 'recu' ? c.expediteur : 'A : Greffe TGI Dakar'}
                      </p>
                      {!c.lu && c.type === 'recu' && (
                        <span className="w-2 h-2 rounded-full bg-justice-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className={`text-sm truncate ${!c.lu && c.type === 'recu' ? 'font-semibold text-navy-700' : 'text-gray-600'}`}>
                      {c.sujet}
                    </p>
                    {c.dossier && (
                      <span className="text-xs text-justice-500 font-mono bg-justice-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                        {c.dossier}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <p className="text-xs text-gray-400">{c.date}</p>
                  <p className="text-xs text-gray-400">{c.heure}</p>
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
                  {c.pieceJointe && (
                    <div className="flex items-center gap-2 mt-3 bg-gray-50 rounded-xl p-3">
                      <FiPaperclip className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-600">{c.pieceJointe}</span>
                    </div>
                  )}
                  {c.type === 'recu' && (
                    <button
                      onClick={e => { e.stopPropagation(); setShowForm(true); set('sujet', 'Re: ' + c.sujet) }}
                      className="mt-3 flex items-center gap-2 text-xs font-semibold text-justice-600 bg-justice-50 px-3 py-2 rounded-xl hover:bg-justice-100 transition-colors">
                      <FiSend className="w-3.5 h-3.5" />
                      Repondre
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}