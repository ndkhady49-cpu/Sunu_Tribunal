import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  FiGrid, FiCalendar, FiFileText, FiAlertTriangle,
  FiBarChart2, FiFolder, FiLogOut, FiMenu, FiX,
  FiBell, FiMail, FiShield, FiUsers, FiBookOpen, FiArchive
} from 'react-icons/fi'
import { useAuth, ROLE_LABELS } from '../../context/AuthContext.jsx'
import { useCompteurs } from '../../context/CompteursContext.jsx'
import Logo from '../common/Logo.jsx'
import AssistantAdmin from '../admin/AssistantAdmin.jsx'
import toast from 'react-hot-toast'

// roles : qui voit le lien (absent = tout le personnel)
// Organisation reelle du greffe : l'accueil gere les RDV, le bureau courrier gere les registres
const navItems = [
  { to:'/admin',           icon:FiGrid,          label:'Vue generale',  exact:true, badge:null        },
  { to:'/admin/rdv',       icon:FiCalendar,      label:'Rendez-vous',   badge:'rdv',
    roles:['admin','juge','greffier','accueil'] },
  { to:'/admin/plaintes',  icon:FiFileText,      label:'Plaintes',      badge:'plaintes',
    roles:['admin','juge','greffier'] },
  { to:'/admin/registres', icon:FiBookOpen,      label:'Registres',     badge:null,
    roles:['admin','greffier','courrier'] },
  { to:'/admin/courrier',  icon:FiMail,          label:'Courriers',     badge:'courriers',
    roles:['admin','greffier','courrier','accueil'] },
  { to:'/admin/alertes',   icon:FiAlertTriangle, label:'Alertes SOS',   badge:'alertes',  urgent:true,
    roles:['admin','juge','greffier','accueil'] },
  { to:'/admin/stats',     icon:FiBarChart2,     label:'Statistiques',  badge:null,
    roles:['admin','juge','greffier'] },
  { to:'/admin/dossiers',  icon:FiArchive,       label:'Archives',      badge:null,
    roles:['admin','juge','greffier','courrier'] },
  { to:'/admin/utilisateurs', icon:FiUsers, label:'Personnel', badge:null, roles:['admin'] },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { compteurs } = useCompteurs()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const tribunal = user?.tribunal_nom || 'Tous les tribunaux'

  const handleLogout = () => {
    logout()
    navigate('/')
    toast.success('Deconnecte avec succes')
  }

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-white/10">
        <Logo size="sm" showText className="filter brightness-0 invert" />
        <p className="text-xs text-white/55 mt-2 uppercase tracking-widest">
          Administration · {tribunal}
        </p>
      </div>

      <div className="p-3 flex-1 overflow-y-auto">
        <p className="text-xs text-white/55 uppercase tracking-widest px-2 mb-3 font-semibold">
          Navigation
        </p>
        {navItems.filter(item => !item.roles || item.roles.includes(user?.role)).map(item => (
          <NavLink key={item.to} to={item.to} end={item.exact}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''} ${item.urgent ? 'mt-1' : ''}`
            }>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge && compteurs[item.badge] > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center ${
                item.urgent ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
              }`}>
                {compteurs[item.badge] > 99 ? '99+' : compteurs[item.badge]}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 bg-white/5 rounded-xl p-3">
          <div className="w-9 h-9 rounded-full bg-gold-400/30 flex items-center justify-center text-gold-400 text-sm font-bold flex-shrink-0">
            {user?.nom?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.nom}</p>
            <p className="text-xs text-white/50 truncate">{ROLE_LABELS[user?.role] || 'Personnel'}</p>
          </div>
          <FiShield className="w-4 h-4 text-gold-400 flex-shrink-0" />
        </div>
        <button onClick={handleLogout}
          className="sidebar-item w-full text-white/50 hover:text-white">
          <FiLogOut className="w-4 h-4" />
          Deconnexion
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-navy-700 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-navy-700 flex flex-col z-50 animate-slide-in">
            <div className="flex justify-end p-4">
              <button onClick={() => setMobileOpen(false)}>
                <FiX className="w-6 h-6 text-white/70" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center justify-between">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <FiMenu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="hidden lg:block">
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Tribunal de Grande Instance
            </p>
            <p className="font-semibold text-navy-700 text-sm">{tribunal}</p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <NavLink to="/admin/notifs" title="Notifications"
              className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <FiBell className="w-5 h-5 text-gray-600" />
              {compteurs.notifs > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {compteurs.notifs > 9 ? '9+' : compteurs.notifs}
                </span>
              )}
            </NavLink>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 border border-gray-200">
              <div className="w-7 h-7 rounded-full bg-navy-700 flex items-center justify-center text-white text-xs font-bold">
                {user?.nom?.[0] || 'A'}
              </div>
              <span className="text-sm font-medium text-navy-700 hidden sm:block">
                {user?.nom}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Assistant Admin flottant */}
      <AssistantAdmin />
    </div>
  )
}