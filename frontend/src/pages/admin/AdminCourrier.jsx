import { useState } from 'react'
import {
  FiMail, FiSend, FiInbox, FiPaperclip, FiEdit, FiChevronDown, FiChevronUp,
  FiZap, FiX, FiUser, FiHash
} from 'react-icons/fi'
import toast from 'react-hot-toast'

const COURRIERS_ADMIN = [
  {
    id: 1,
    type: 'recu',
    expediteur: 'Abdoulaye Diallo',
    initials: 'AD',
    color: '#0d1f3c',
    email: 'ndkhady49@gmail.com',
    sujet: 'Question sur mon dossier RDV-2025-04817',
    message: 'Bonjour, je voudrais savoir si mon rendez-vous du 07 mai est toujours confirmé. Merci.',
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
    initials: 'CF',
    color: '#c8272d',
    email: 'cheikh.fall@gmail.com',
    sujet: 'Demande de report audience',
    message: 'Bonjour, je sollicite respectueusement un report de mon audience prévue le 15 mai car je serai en déplacement professionnel. Merci de bien vouloir accepter ma demande.',
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
    initials: 'GT',
    color: '#0a7048',
    email: 'ndkhady49@gmail.com',
    sujet: 'Convocation audience — PLT-2025-09341',
    message: 'Vous êtes convoqué à une audience le 15 mai 2025 à 10h00 au TGI Dakar, Salle 3. Veuillez vous présenter avec toutes vos pièces justificatives.',
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
      initials: 'GT',
      color: '#0a7048',
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
    toast.success('Courrier envoyé — citoyen notifié !')
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

  const genererParIA = async () => {
    if (!form.destinataire || !form.sujet) {
      toast.error("Remplissez d'abord le destinataire et le sujet")
      return
    }
    setLoading(true)
    toast.loading(`L'IA rédige le courrier...`, { id: 'ia' })
    try {
      const response = await fetch('http://localhost:8000/api/chatbot/generate-doc/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access')}`
        },
        body: JSON.stringify({ destinataire: form.destinataire, motif: form.sujet, decision: 'Veuillez rédiger ce courrier de manière formelle.' }),
      })
      const data = await response.json()
      if (response.ok && data.document) {
        set('message', data.document)
        toast.success('Courrier généré !', { id: 'ia' })
      } else {
        toast.error('Erreur lors de la génération', { id: 'ia' })
      }
    } catch (e) {
      toast.error('Erreur de connexion', { id: 'ia' })
    } finally {
      setLoading(false)
    }
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

  const statsData = [
    {
      num: courriers.filter(c => c.type === 'recu').length,
      label: 'Reçus',
      gradient: 'linear-gradient(135deg, #0d1f3c, #1a3a6e)',
      shadow: '0 6px 20px rgba(13,31,60,0.3)',
      icon: FiInbox,
    },
    {
      num: nonLus,
      label: 'Non lus',
      gradient: 'linear-gradient(135deg, #c8272d, #e8484e)',
      shadow: '0 6px 20px rgba(232,72,78,0.3)',
      icon: FiMail,
    },
    {
      num: courriers.filter(c => c.type === 'envoye').length,
      label: 'Envoyés',
      gradient: 'linear-gradient(135deg, #0a7048, #0f8a58)',
      shadow: '0 6px 20px rgba(10,112,72,0.3)',
      icon: FiSend,
    },
  ]

  return (
    <div className="p-4 lg:p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-700">Courriers</h1>
          <p className="text-gray-400 text-sm mt-0.5">Échanges officiels avec les citoyens</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setReplyTo(null) }}
          className="btn-primary flex items-center gap-2">
          {showForm
            ? <><FiX className="w-4 h-4" /> Annuler</>
            : <><FiEdit className="w-4 h-4" /> Nouveau courrier</>
          }
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {statsData.map((s, i) => (
          <div key={s.label}
            className="kpi-box-gradient animate-fade-up"
            style={{
              background: s.gradient,
              boxShadow: s.shadow,
              animationDelay: `${i * 80}ms`,
              animationFillMode: 'forwards',
              opacity: 0,
            }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-1"
              style={{ background: 'rgba(255,255,255,0.18)' }}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <div className="kpi-num text-white">{s.num}</div>
            <div className="kpi-label text-white/70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="card mb-6 animate-scale-in" style={{ border: '2px solid #eef2fa' }}>
          {/* Form header */}
          <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
            <div className="icon-box" style={{ background: 'linear-gradient(135deg, #0d1f3c, #1a3a6e)' }}>
              <FiMail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-navy-700 text-sm">
                {replyTo ? `Répondre à ${replyTo.expediteur}` : 'Nouveau courrier officiel'}
              </h3>
              {replyTo && (
                <p className="text-xs text-gray-400 mt-0.5">Re: {replyTo.sujet}</p>
              )}
            </div>
          </div>

          <form onSubmit={envoyer} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label flex items-center gap-1">
                  <FiUser className="w-3 h-3" /> Destinataire
                </label>
                <input className="form-input" placeholder="Nom du citoyen"
                  value={form.destinataire} onChange={e => set('destinataire', e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="citoyen@email.sn"
                  value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="form-label flex items-center gap-1">
                <FiHash className="w-3 h-3" /> Dossier concerné
              </label>
              <select className="form-select" value={form.dossier}
                onChange={e => set('dossier', e.target.value)}>
                <option value="">— Aucun dossier spécifique —</option>
                <option>PLT-2025-09345</option>
                <option>PLT-2025-09341</option>
                <option>RDV-2025-04820</option>
                <option>RDV-2025-04817</option>
              </select>
            </div>

            <div>
              <label className="form-label">Sujet</label>
              <input className="form-input" placeholder="Objet du courrier..."
                value={form.sujet} onChange={e => set('sujet', e.target.value)} required />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="form-label mb-0">Message</label>
                <button type="button" onClick={genererParIA} disabled={loading}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #a0811a, #c9a227)', color: 'white', boxShadow: '0 2px 8px rgba(201,162,39,0.35)' }}>
                  <FiZap className="w-3.5 h-3.5" /> Rédiger avec l'IA
                </button>
              </div>
              <textarea className="form-input" rows={6}
                placeholder="Rédigez votre message officiel ici..."
                value={form.message} onChange={e => set('message', e.target.value)} required />
            </div>

            <div>
              <label className="form-label">Pièce jointe</label>
              <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-navy-700/30 hover:bg-navy-50/50 transition-all group">
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setFichiers(Array.from(e.target.files))} />
                <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-navy-50 flex items-center justify-center flex-shrink-0 transition-colors">
                  <FiPaperclip className="w-4 h-4 text-gray-400 group-hover:text-navy-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {fichiers.length > 0 ? fichiers[0].name : 'Joindre un document officiel'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG — max 10Mo</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-1">
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

      {/* Onglets */}
      <div className="tab-bar mb-4">
        <button onClick={() => setOnglet('recus')}
          className={`tab-btn ${onglet === 'recus' ? 'active' : ''}`}>
          <FiInbox className="w-4 h-4" />
          Reçus
          {nonLus > 0 && (
            <span className="bg-danger-400 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: '#e8484e' }}>
              {nonLus}
            </span>
          )}
        </button>
        <button onClick={() => setOnglet('envoyes')}
          className={`tab-btn ${onglet === 'envoyes' ? 'active' : ''}`}>
          <FiSend className="w-4 h-4" />
          Envoyés
        </button>
      </div>

      {/* Liste */}
      {filtres.length === 0 ? (
        <div className="empty-state">
          <FiMail />
          <p>Aucun courrier dans cette section</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtres.map((c, idx) => (
            <div key={c.id}
              className={`bg-white rounded-2xl cursor-pointer transition-all border ${
                !c.lu && c.type === 'recu'
                  ? 'border-l-4 border-gray-100/80'
                  : 'border-gray-100/80'
              }`}
              style={{
                borderLeftColor: !c.lu && c.type === 'recu' ? '#0d1f3c' : undefined,
                boxShadow: ouvert === c.id
                  ? '0 4px 20px rgba(0,0,0,0.08)'
                  : '0 1px 3px rgba(0,0,0,0.05)',
                animation: `fade-up 0.4s ease ${idx * 60}ms both`,
              }}
              onClick={() => { setOuvert(ouvert === c.id ? null : c.id); if (!c.lu) marquerLu(c.id) }}>

              <div className="p-4 flex items-start gap-3">
                {/* Avatar */}
                <div className="avatar flex-shrink-0 text-xs font-bold text-white"
                  style={{ background: c.color || '#0d1f3c' }}>
                  {c.initials || c.expediteur[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm truncate ${!c.lu && c.type === 'recu' ? 'font-bold text-navy-700' : 'font-semibold text-gray-700'}`}>
                          {c.type === 'recu' ? c.expediteur : `À : ${c.destinataire || 'Citoyen'}`}
                        </p>
                        {!c.lu && c.type === 'recu' && (
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#0d1f3c' }} />
                        )}
                      </div>
                      <p className={`text-sm truncate ${!c.lu && c.type === 'recu' ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                        {c.sujet}
                      </p>
                      {c.dossier && (
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold bg-navy-50 px-2 py-0.5 rounded-full mt-1.5 border border-navy-100"
                          style={{ color: '#0d1f3c' }}>
                          <FiHash className="w-2.5 h-2.5" />{c.dossier}
                        </span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                      <p className="text-xs text-gray-400 whitespace-nowrap">{c.date}</p>
                      <p className="text-xs text-gray-300">{c.heure}</p>
                      {ouvert === c.id
                        ? <FiChevronUp className="w-4 h-4 text-gray-300 mt-1" />
                        : <FiChevronDown className="w-4 h-4 text-gray-300 mt-1" />
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded body */}
              {ouvert === c.id && (
                <div className="px-4 pb-4" style={{ borderTop: '1px solid #f9fafb' }}>
                  <div className="bg-gray-50/80 rounded-xl p-4 mt-3">
                    <p className="text-sm text-gray-700 leading-relaxed">{c.message}</p>
                  </div>
                  {c.type === 'recu' && (
                    <button
                      onClick={e => { e.stopPropagation(); repondre(c) }}
                      className="mt-3 flex items-center gap-2 btn-primary text-xs">
                      <FiSend className="w-3.5 h-3.5" />
                      Répondre au citoyen
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