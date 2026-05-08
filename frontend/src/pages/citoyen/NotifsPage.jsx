import { useState } from 'react'
import { FiCheckCircle, FiBell, FiAlertTriangle, FiCalendar, FiFileText } from 'react-icons/fi'

const NOTIFS = [
  { id:1, type:'rdv',     icon:FiCalendar,     color:'text-justice-500 bg-justice-50',
    title:'Rendez-vous confirmé ✅', body:'Votre RDV-2025-04817 est confirmé pour le mercredi 7 mai à 10h00 au TGI Dakar.',
    time:"Il y a 5 min", read:false, border:"border-l-justice-400" },
  { id:2, type:'plainte', icon:FiFileText,      color:'text-navy-500 bg-navy-50',
    title:'Dossier mis à jour 📋', body:"PLT-2025-09341 : Votre plainte est en cours d'instruction. Audience prévue le 15 mai 2025.",
    time:'Hier · 09:15', read:false, border:'border-l-navy-500' },
  { id:3, type:"warn",    icon:FiAlertTriangle, color:"text-amber-600 bg-amber-50",
    title:'Pièce manquante ⚠️', body:'Votre dossier PLT-09338 nécessite un justificatif de domicile supplémentaire.',
    time:'30 avr · 14:00', read:true, border:'border-l-amber-400' },
  { id:4, type:'rdv',     icon:FiCheckCircle,   color:'text-justice-500 bg-justice-50',
    title:'Audience confirmée', body:'Votre audience est fixée au 15 mai 2025 à 10h00 au TGI Dakar — Salle 3.',
    time:'28 avr · 10:30', read:true, border:'border-l-justice-400' },
]

export default function NotifsPage() {
  const [notifs, setNotifs] = useState(NOTIFS)
  const unread = notifs.filter(n => !n.read).length

  const markAll = () => setNotifs(n => n.map(x => ({...x, read:true})))
  const markOne = (id) => setNotifs(n => n.map(x => x.id===id ? {...x,read:true} : x))

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-700">Notifications</h1>
          {unread > 0 && <p className="text-sm text-gray-500 mt-1">{unread} non lue{unread>1 ? "s" : ""}</p>}
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="text-xs text-justice-500 font-semibold hover:underline">
            Tout marquer lu
          </button>
        )}
      </div>

      {unread === 0 && (
        <div className="text-center py-12 text-gray-400">
          <FiBell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Tout est à jour !</p>
          <p className="text-sm mt-1">Aucune notification non lue</p>
        </div>
      )}

      <div className="space-y-3">
        {notifs.map(n => (
          <div key={n.id}
            onClick={() => markOne(n.id)}
            className={`card cursor-pointer border-l-4 transition-all ${
              n.read ? 'border-l-gray-200 opacity-70' : 'border-l-navy-700 shadow-card'
            }`}>
            <div className="flex gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${n.color}`}>
                <n.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${n.read ? 'text-gray-600' : 'text-navy-700'}`}>
                    {n.title}
                  </p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-justice-400 flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.body}</p>
                <p className="text-xs text-gray-400 mt-2">{n.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
