import { useNavigate } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext.jsx'
import Badge from '../../components/common/Badge.jsx'

const modules = [
  { to:'/citoyen/rdv',     emoji:'📅', title:'Rendez-vous',    desc:'Reservez un creneau sans file',     border:'border-justice-100 bg-justice-50' },
  { to:'/citoyen/plainte', emoji:'📋', title:'Deposer plainte', desc:'Soumettez votre plainte en ligne',  border:'border-gold-100 bg-gold-50'        },
  { to:'/citoyen/suivi',   emoji:'🔍', title:'Mes dossiers',    desc:'Suivez vos procedures en direct',   border:'border-navy-100 bg-navy-50'        },
  { to:'/citoyen/carte',   emoji:'📍', title:'Localisation',    desc:'Trouvez le tribunal le plus proche',border:'border-blue-100 bg-blue-50'        },
]

const recentActivity = [
  { ref:'RDV-2025-04817', desc:'TGI Dakar · Dossier civil',    status:'done',     date:'Hier',  emoji:'📅' },
  { ref:'PLT-2025-09341', desc:'Litige foncier · 2 pieces',    status:'progress', date:'30 avr',emoji:'📋' },
  { ref:'PLT-2025-09338', desc:'Cybercrimi · 7 preuves',       status:'urgent',   date:'28 avr',emoji:'📋' },
]

export default function CitoyenHome() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-justice-500 to-justice-400 rounded-2xl p-5 text-white mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
        <p className="text-white/70 text-sm mb-1">Bonjour,</p>
        <h1 className="font-display text-2xl font-bold mb-2">{user?.nom || 'Citoyen'}</h1>
        <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
          Compte verifie
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { num:'2', label:'Dossiers actifs'  },
          { num:'1', label:'RDV confirme'     },
          { num:'1', label:'Plainte en cours' },
          { num:'3', label:'Notifications'    },
        ].map(k => (
          <div key={k.label} className="kpi-box">
            <div className="kpi-num">{k.num}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-justice-50 border border-justice-100 rounded-2xl p-4 flex items-start gap-3 mb-6 cursor-pointer hover:bg-justice-100/60 transition-colors"
        onClick={() => navigate('/citoyen/notifs')}>
        <div className="w-2 h-2 rounded-full bg-justice-400 mt-1.5 animate-blink flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-justice-600">RDV-2025-04817 confirme</p>
          <p className="text-xs text-gray-500 mt-0.5">Votre RDV du 07 mai a ete valide par le TGI Dakar</p>
        </div>
        <FiChevronRight className="w-4 h-4 text-justice-400 mt-0.5" />
      </div>

      <h2 className="font-display text-lg font-bold text-navy-700 mb-3">Services disponibles</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {modules.map(m => (
          <button key={m.to} onClick={() => navigate(m.to)}
            className={`card border text-left hover:shadow-card-hover transition-all ${m.border}`}>
            <div className="text-2xl mb-3">{m.emoji}</div>
            <div className="font-semibold text-navy-700 text-sm mb-1">{m.title}</div>
            <div className="text-xs text-gray-500 leading-relaxed">{m.desc}</div>
          </button>
        ))}
      </div>

      <button onClick={() => navigate('/citoyen/sos')}
        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg mb-6"
        style={{ animation: 'pulse-sos 2s infinite' }}>
        Alerte SOS urgence
      </button>

      <h2 className="font-display text-lg font-bold text-navy-700 mb-3">Activite recente</h2>
      <div className="card p-0 overflow-hidden">
        {recentActivity.map((item, i) => (
          <div key={item.ref}
            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              i < recentActivity.length - 1 ? 'border-b border-gray-50' : ''
            }`}
            onClick={() => navigate('/citoyen/suivi')}>
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
              {item.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy-700 truncate">{item.ref}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{item.desc}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <Badge status={item.status} />
              <p className="text-xs text-gray-400 mt-1">{item.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
