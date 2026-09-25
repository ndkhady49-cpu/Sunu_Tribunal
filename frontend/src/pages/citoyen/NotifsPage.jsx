import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCheckCircle, FiBell, FiAlertTriangle, FiCalendar, FiFileText, FiMail } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { notifAPI, liste, messageErreur } from '../../services/api.js'
import usePolling from '../../hooks/usePolling.js'
import { useCompteurs } from '../../context/CompteursContext.jsx'
import { ilYa } from '../../utils/format.js'

// Apparence selon le type de notification (meme style qu'avant)
const STYLES = {
  rdv:     { icon: FiCalendar,      color: 'text-justice-500 bg-justice-50' },
  plainte: { icon: FiFileText,      color: 'text-navy-500 bg-navy-50'       },
  sos:     { icon: FiAlertTriangle, color: 'text-amber-600 bg-amber-50'     },
  message: { icon: FiMail,          color: 'text-navy-500 bg-navy-50'       },
  system:  { icon: FiCheckCircle,   color: 'text-justice-500 bg-justice-50' },
}

const versAffichage = (n) => ({
  id: n.id, ...(STYLES[n.type_notif] || STYLES.system),
  title: n.titre, body: n.corps, time: ilYa(n.created_at), read: n.lu, lien: n.lien,
})

export default function NotifsPage() {
  const navigate = useNavigate()
  const { rafraichirCompteurs } = useCompteurs()
  const [notifs, setNotifs] = useState([])
  const [chargement, setChargement] = useState(true)
  const unread = notifs.filter(n => !n.read).length

  // Rafraîchissement automatique toutes les 15 s
  usePolling((auto) => {
    notifAPI.list()
      .then(res => setNotifs(liste(res).map(versAffichage)))
      .catch(err => { if (!auto) toast.error(messageErreur(err, 'Impossible de charger les notifications.')) })
      .finally(() => setChargement(false))
  })

  const markAll = () => {
    setNotifs(n => n.map(x => ({...x, read:true})))
    notifAPI.markAll().then(rafraichirCompteurs).catch(() => {})
  }
  const markOne = (id) => {
    const cible = notifs.find(x => x.id === id)
    if (!cible) return
    if (!cible.read) {
      setNotifs(n => n.map(x => x.id===id ? {...x,read:true} : x))
      notifAPI.markRead(id).then(rafraichirCompteurs).catch(() => {})
    }
    if (cible.lien) navigate(cible.lien)   // ouvre le dossier / courrier concerné
  }

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

      {chargement && (
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-navy-100 border-t-navy-700 rounded-full animate-spin" />
        </div>
      )}

      {!chargement && unread === 0 && (
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
