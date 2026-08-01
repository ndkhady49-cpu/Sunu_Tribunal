import { useNavigate } from 'react-router-dom'
import { FiChevronRight, FiCalendar, FiFileText, FiSearch, FiMapPin, FiBell, FiAlertTriangle, FiMail } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext.jsx'
import Badge from '../../components/common/Badge.jsx'

const modules = [
  {
    to:'/citoyen/rdv',
    icon: FiCalendar,
    title:'Rendez-vous',
    desc:'Réservez un créneau sans file d\'attente',
    gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
    bg: '#eef2ff',
    iconColor: '#6366f1',
  },
  {
    to:'/citoyen/plainte',
    icon: FiFileText,
    title:'Déposer plainte',
    desc:'Soumettez votre plainte en ligne',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    bg: '#fffbeb',
    iconColor: '#f59e0b',
  },
  {
    to:'/citoyen/suivi',
    icon: FiSearch,
    title:'Mes dossiers',
    desc:'Suivez vos procédures en direct',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    bg: '#ecfdf5',
    iconColor: '#10b981',
  },
  {
    to:'/citoyen/carte',
    icon: FiMapPin,
    title:'Localisation',
    desc:'Trouvez le tribunal le plus proche',
    gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
    bg: '#fdf2f8',
    iconColor: '#ec4899',
  },
  {
    to:'/citoyen/courrier',
    icon: FiMail,
    title:'Courriers',
    desc:'Consultez vos courriers officiels',
    gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    bg: '#f5f3ff',
    iconColor: '#8b5cf6',
  },
  {
    to:'/citoyen/notifs',
    icon: FiBell,
    title:'Notifications',
    desc:'Restez informé de l\'avancement',
    gradient: 'linear-gradient(135deg, #f97316, #fb923c)',
    bg: '#fff7ed',
    iconColor: '#f97316',
  },
]

const kpis = [
  { num:'2', label:'Dossiers',    color:'#6366f1', bg:'#eef2ff' },
  { num:'1', label:'RDV confir.', color:'#10b981', bg:'#ecfdf5' },
  { num:'1', label:'En cours',    color:'#f59e0b', bg:'#fffbeb' },
  { num:'3', label:'Notifs',      color:'#f97316', bg:'#fff7ed' },
]

const recentActivity = [
  { ref:'RDV-2025-04817', desc:'TGI Dakar · Dossier civil',  status:'done',     date:'Hier',   color:'#6366f1', icon: FiCalendar },
  { ref:'PLT-2025-09341', desc:'Litige foncier · 2 pièces',  status:'progress', date:'30 avr', color:'#f59e0b', icon: FiFileText },
  { ref:'PLT-2025-09338', desc:'Cybercriminalité · 7 preuves',status:'urgent',   date:'28 avr', color:'#ef4444', icon: FiAlertTriangle },
]

export default function CitoyenHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.nom?.split(' ')[0] || 'Citoyen'
  const initials = user?.nom?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'CT'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="p-4 lg:p-7 space-y-6 max-w-4xl mx-auto">

      {/* ── Hero Banner ── */}
      <div className="relative rounded-2xl overflow-hidden p-6 text-white"
        style={{
          background: 'linear-gradient(135deg, #0f8a58 0%, #065f40 60%, #044d33 100%)',
          boxShadow: '0 8px 32px rgba(15,138,88,0.25)',
        }}>
        {/* Decorative shapes */}
        <div className="absolute right-6 top-4 w-28 h-28 rounded-full opacity-10 animate-float"
          style={{ background: 'radial-gradient(circle, white, transparent)', animationDuration: '4s' }} />
        <div className="absolute right-14 bottom-2 w-16 h-16 rounded-full opacity-10 animate-float"
          style={{ background: 'radial-gradient(circle, white, transparent)', animationDelay: '1s', animationDuration:'5s' }} />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-white/60 text-sm mb-1">{greeting},</p>
            <h1 className="text-2xl font-bold mb-3">{firstName}</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                Compte vérifié
              </div>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold">
            {initials}
          </div>
        </div>
      </div>

      {/* ── KPI Mini Row ── */}
      <div className="grid grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <div key={k.label} className="rounded-2xl p-3 text-center animate-fade-up"
            style={{
              background: k.bg, animationDelay: `${i * 60}ms`,
              animationFillMode: 'forwards', opacity: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
            <div className="text-2xl font-bold" style={{ color: k.color, fontFamily:'Playfair Display,serif' }}>{k.num}</div>
            <div className="text-xs font-medium text-gray-500 mt-0.5 leading-tight">{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Notification banner ── */}
      <div className="flex items-center gap-4 rounded-2xl p-4 cursor-pointer hover:opacity-90 transition-all"
        style={{
          background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          border: '1px solid #bfdbfe',
          boxShadow: '0 2px 12px rgba(59,130,246,0.1)'
        }}
        onClick={() => navigate('/citoyen/notifs')}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#3b82f6' }}>
          <FiBell className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-800">RDV-2025-04817 confirmé</p>
          <p className="text-xs text-blue-600 mt-0.5">Votre RDV du 07 mai a été validé par le TGI Dakar</p>
        </div>
        <FiChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
      </div>

      {/* ── Services Grid ── */}
      <div>
        <h2 className="font-bold text-navy-700 text-lg mb-3">Services disponibles</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((m, i) => (
            <button key={m.to} onClick={() => navigate(m.to)}
              className="text-left rounded-2xl p-4 transition-all duration-250 hover:-translate-y-1 animate-fade-up group"
              style={{
                background: m.bg,
                border: `1px solid ${m.iconColor}20`,
                animationDelay: `${i * 60}ms`,
                animationFillMode: 'forwards',
                opacity: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = `0 8px 24px ${m.iconColor}25`}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: m.gradient }}>
                <m.icon className="w-5 h-5 text-white" />
              </div>
              <div className="font-semibold text-navy-700 text-sm mb-1">{m.title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── SOS Button ── */}
      <button onClick={() => navigate('/citoyen/sos')}
        className="w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-98 animate-pulse-sos"
        style={{
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          boxShadow: '0 4px 20px rgba(220,38,38,0.35)',
        }}>
        <FiAlertTriangle className="w-5 h-5" />
        <span className="text-base">🆘 Alerte SOS urgence</span>
        <FiAlertTriangle className="w-5 h-5" />
      </button>

      {/* ── Recent Activity ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-navy-700 text-lg">Activité récente</h2>
          <button onClick={() => navigate('/citoyen/suivi')}
            className="text-xs font-semibold text-justice-500 flex items-center gap-1 hover:underline">
            Voir tout <FiChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="card p-0 overflow-hidden divide-y divide-gray-50">
          {recentActivity.map((item, i) => (
            <div key={item.ref}
              className="flex items-center gap-3.5 p-4 cursor-pointer hover:bg-gray-50/80 transition-colors animate-fade-up"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode:'forwards', opacity:0 }}
              onClick={() => navigate('/citoyen/suivi')}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}18` }}>
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy-700 truncate font-mono">{item.ref}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{item.desc}</p>
              </div>
              <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                <Badge status={item.status} />
                <p className="text-xs text-gray-400">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
