import { useState } from 'react'
import { FiMail, FiSend, FiInbox, FiPaperclip, FiEdit, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import toast from 'react-hot-toast'

const COURRIERS_ADMIN = [
  {
    id: 1,
    type: 'recu',
    expediteur: 'Abdoulaye Diallo',
    email: 'ndkhady49@gmail.com',
    sujet: 'Question sur mon dossier RDV-2025-04817',
    message: 'Bonjour, je voudrais savoir si mon rendez-vous du 07 mai est toujours confirme. Merci.',
    date: '28 avr 2025',
    heure: '11:00',
    lu: false,
    dossier: 'RDV-2025-04817',
    statut: 'en_attente',
  },
  {
    id: 2,
    type: 'recu',
    expediteur: 'Cheikh Fall',
    email: 'cheikh.fall@gmail.com',
    sujet: 'Demande de report audience',
    message: 'Bonjour, je sollicite respectueusement un report de mon audience prevue le 15 mai car je serai en deplacement professionnel. Merci de bien vouloir accepter ma demande.',
    date: '02 mai 2025',
    heure: '08:45',
    lu: false,
    dossier: 'PLT-2025-09345',
    statut: 'en_attente',
  },
  {
    id: 3,
    type: 'envoye',
    expediteur: 'Greffe TGI Dakar',
    email: 'ndkhady49@gmail.com',
    sujet: 'Convocation audience — PLT-2025-09341',
    message: 'Vous etes convoque a une audience le 15 mai 2025 a 10h00 au TGI Dakar, Salle 3. Veuillez vous presenter avec toutes vos pieces justificatives.',
    date: '01 mai 2025',
    heure: '09:15',
    lu: true,
    dossier: 'PLT-2025-09341',
    statut: 'envoye',
  },
]

export default function AdminCourrier() {
  const [onglet, setOnglet]       = useState('recus')
  const [ouvert, setOuvert]       = useState(null)
  const [showForm, setShowForm]   = useState(false)
  const [replyTo, setReplyTo]     = useState(null)
  const [loading, setLoading]     = useState(false)
  const [courriers, setCourriers] = useState(COURRIERS_ADMIN)
  const [fichiers, setFichiers]   = useState([])
  const [form, setForm] = useState({
    destinataire: '', email: '', sujet: '', message: '', dossier: '',
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
      expediteur: 'Greffe TGI Dakar',
      email: form.email,
      sujet: form.sujet,
      message: form.message,
      date: new Date().toLocaleDateString('fr-FR'),
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      lu: true,
      dossier: form.dossier,
      statut: 'envoye',
    }
    setCourriers(c => [nouveau, ...c])
    toast.success('Courrier envoye — citoyen notifie !')
    setShowForm(false)
    setReplyTo(null)
    setForm({ destinataire: '', email: '', sujet: '', message: '', dossier: '' })
    setFichiers([])
    setOnglet('envoyes')
    setLoading(false)
  }

  const marquerLu = (id) => {
    setCourriers(c => c.map(x => x.id === id ? {...x, lu: true} : x))
  }

  const repondre = (c) => {
    setReplyTo(c)
    setForm({
      destinataire: c.expediteur,
      email: c.email,
      sujet: 'Re: ' + c.sujet,
      message: '',
      dossier: c.dossier,
    })
    setShowForm(true)
  }

  const filtres = courriers.filter(c =>
    onglet === 'recus' ? c.type === 'recu' : c.type === 'envoye'
  )

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-700">Courriers</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion des echanges avec les citoyens</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setReplyTo(null) }}
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
            {replyTo ? 'Repondre a ' + replyTo.expediteur : 'Nouveau courrier'}
          </h3>
          <form onSubmit={envoyer} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Destinataire *</label>
                <input className="form-input" placeholder="Nom du citoyen"
                  value={form.destinataire} onChange={e => set('destinataire', e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" placeholder="citoyen@email.sn"
                  value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="form-label">Dossier concerne</label>
              <select className="form-select" value={form.dossier}
                onChange={e => set('dossier', e.target.value)}>
                <option value="">Aucun dossier specifique</option>
                <option>PLT-2025-09345</option>
                <option>PLT-2025-09341</option>
                <option>RDV-2025-04820</option>
                <option>RDV-2025-04817</option>
              </select>
            </div>
            <div>
              <label className="form-label">Sujet *</label>
              <input className="form-input" placeholder="Objet du courrier..."
                value={form.sujet} onChange={e => set('sujet', e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Message *</label>
              <textarea className="form-input" rows={6}
                placeholder="Redigez votre message officiel ici..."
                value={form.message} onChange={e => set('message', e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Piece jointe</label>
              <label className="flex items-center gap-2 border border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-navy-400 hover:bg-navy-50 transition-colors">
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setFichiers(Array.from(e.target.files))} />
                <FiPaperclip className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {fichiers.length > 0 ? fichiers[0].name : 'Joindre un document officiel'}
                </span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setReplyTo(null) }}
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
          { num: courriers.filter(c => c.type === 'recu').length,   label:'Recus',    color:'text-navy-700'    },
          { num: nonLus,                                             label:'Non lus',  color:'text-red-600'     },
          { num: courriers.filter(c => c.type === 'envoye').length, label:'Envoyes',  color:'text-justice-500' },
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
      {filtres.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <FiMail className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Aucun courrier</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtres.map(c => (
            <div key={c.id}
              className={`card cursor-pointer hover:shadow-card-hover transition-all ${
                !c.lu && c.type === 'recu' ? 'border-l-4 border-l-navy-700' : ''
              }`}
              onClick={() => { setOuvert(ouvert === c.id ? null : c.id); if (!c.lu) marquerLu(c.id) }}>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    c.type === 'recu' ? 'bg-navy-50' : 'bg-justice-50'
                  }`}>
                    {c.type === 'recu'
                      ? <FiInbox className="w-4 h-4 text-navy-500" />
                      : <FiSend className="w-4 h-4 text-justice-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm truncate ${!c.lu && c.type === 'recu' ? 'font-bold text-navy-700' : 'font-semibold text-gray-700'}`}>
                        {c.type === 'recu' ? c.expediteur : 'A : ' + c.destinataire || 'Citoyen'}
                      </p>
                      {!c.lu && c.type === 'recu' && (
                        <span className="w-2 h-2 rounded-full bg-navy-700 flex-shrink-0" />
                      )}
                    </div>
                    <p className={`text-sm truncate ${!c.lu && c.type === 'recu' ? 'font-semibold' : 'text-gray-600'}`}>
                      {c.sujet}
                    </p>
                    {c.dossier && (
                      <span className="text-xs text-navy-500 font-mono bg-navy-50 px-2 py-0.5 rounded-full mt-1 inline-block">
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

              {ouvert === c.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed">{c.message}</p>
                  {c.type === 'recu' && (
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
          ))}
        </div>
      )}
    </div>
  )
}