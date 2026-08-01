import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  FiGrid, FiCalendar, FiFileText, FiAlertTriangle,
  FiBarChart2, FiFolder, FiLogOut,
  FiMenu, FiX, FiBell, FiMail, FiChevronRight,
  FiActivity
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'

const navItems = [
  { to:"/admin",          icon:FiGrid,          label:"Vue générale",  exact:true, badge:null, color:"#c9a227", glow:'rgba(201,162,39,0.35)' },
  { to:'/admin/rdv',      icon:FiCalendar,      label:'Rendez-vous',   badge:"8",  color:"#0a7048", glow:'rgba(10,112,72,0.35)' },
  { to:"/admin/plaintes", icon:FiFileText,      label:"Plaintes",      badge:'5',  color:"#c9a227", glow:'rgba(201,162,39,0.35)' },
  { to:'/admin/courrier', icon:FiMail,          label:'Courriers',     badge:'2',  color:"#e8c44a", glow:'rgba(232,196,74,0.35)' },
  { to:"/admin/alertes",  icon:FiAlertTriangle, label:"Alertes SOS",   badge:'3',  urgent:true, color:"#f87171", glow:'rgba(248,113,113,0.5)' },
  { to:"/admin/stats",    icon:FiBarChart2,     label:"Statistiques",  badge:null, color:"#0f8a58", glow:'rgba(15,138,88,0.35)' },
  { to:"/admin/dossiers", icon:FiFolder,        label:"Dossiers",      badge:null, color:"#ddb84a", glow:'rgba(221,184,74,0.35)' },
]

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <span className="font-mono text-xs text-gray-400 tabular-nums">
        {time.toLocaleTimeString('fr-SN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
      </span>
    </div>
  )
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate("/login"); toast.success("Déconnecté") }

  const initials = user?.nom?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'AD'

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative"
            style={{ background: 'linear-gradient(135deg, #c9a227, #f0c84a)', boxShadow: '0 4px 16px rgba(201,162,39,0.5)' }}>
            <span className="text-white font-bold text-lg">⚖</span>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2"
              style={{ borderColor: '#0d1f3c' }} />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight tracking-tight">Sunu Tribunal</p>
            <p className="text-white/35 text-xs tracking-wider">Administration</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-5 px-1">
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.02))' }} />
          <div className="flex items-center gap-2 mt-3">
            <FiActivity className="w-3 h-3 text-white/30" />
            <p className="text-white/30 text-xs tracking-widest font-medium uppercase">TGI Dakar · Plateau</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 overflow-y-auto pb-4">
        <p className="sidebar-section-label px-2 mb-2 mt-1">Navigation</p>
        {navItems.map((item, i) => (
          <NavLink key={item.to} to={item.to} end={item.exact}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `sidebar-item group animate-fade-up opacity-0 ${isActive ? 'active' : ''}`
            }
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}>
            <div className="sidebar-icon" style={{ background: `${item.color}1a` }}>
              <item.icon className="w-4 h-4" style={{ color: item.color }} />
            </div>
            <span className="flex-1 text-sm">{item.label}</span>
            {item.badge && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                item.urgent
                  ? 'text-white animate-pulse'
                  : 'bg-white/10 text-white/70'
              }`}
                style={item.urgent ? {
                  background: 'linear-gradient(135deg, #ef4444, #f87171)',
                  boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
                } : {}}>
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* User footer */}
      <div className="flex-shrink-0 px-3 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3 px-2 pt-4 mb-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #c9a227, #f0c84a)', boxShadow: '0 3px 12px rgba(201,162,39,0.4)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.nom || 'Administrateur'}</p>
            <p className="text-xs text-white/35 truncate">Greffier en chef</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="sidebar-item w-full text-white/40 hover:text-red-400 group mt-1"
          style={{ '--hover-bg': 'rgba(239,68,68,0.08)' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background=''}>
          <div className="sidebar-icon group-hover:bg-red-500/20">
            <FiLogOut className="w-4 h-4" />
          </div>
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f0f4f9' }}>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col flex-shrink-0"
        style={{
          width: 256,
          background: 'linear-gradient(180deg, #0a1929 0%, #071220 100%)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col animate-slide-in"
            style={{ background: 'linear-gradient(180deg, #0a1929 0%, #071220 100%)' }}>
            <div className="flex justify-end p-4">
              <button onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <FiX className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent />
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 lg:px-6 py-3"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
          }}>
          <div className="flex items-center gap-4">
            <button className="lg:hidden w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              onClick={() => setMobileOpen(true)}>
              <FiMenu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="hidden lg:flex items-center gap-2 text-sm text-gray-400">
              <span className="font-semibold text-navy-700">Tribunal de Grande Instance</span>
              <FiChevronRight className="w-3 h-3 text-gray-300" />
              <span className="text-gray-500">TGI Dakar – Plateau</span>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <LiveClock />
            <div className="w-px h-4 bg-gray-200" />

            {/* Notification bell */}
            <NavLink to="/admin/alertes"
              className="relative w-9 h-9 bg-gray-100 hover:bg-red-50 rounded-xl flex items-center justify-center transition-all group">
              <FiBell className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            </NavLink>

            {/* User avatar */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold cursor-pointer transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #0d1f3c, #1a3a6e)', boxShadow: '0 2px 8px rgba(13,31,60,0.3)' }}>
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
