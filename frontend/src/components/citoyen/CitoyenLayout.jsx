import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  FiHome, FiCalendar, FiFileText, FiMapPin, FiBell,
  FiAlertTriangle, FiLogOut, FiMenu, FiX, FiMail, FiSearch
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'

const navItems = [
  { to: "/citoyen",          icon: FiHome,     label: "Accueil",      exact: true, color: "#6366f1" },
  { to: '/citoyen/rdv',      icon: FiCalendar, label: 'RDV',          color: "#0ea5e9" },
  { to: '/citoyen/plainte',  icon: FiFileText, label: 'Plainte',      color: "#f59e0b" },
  { to: '/citoyen/suivi',    icon: FiSearch,   label: 'Dossiers',     color: "#10b981" },
  { to: '/citoyen/courrier', icon: FiMail,     label: 'Courriers',    color: "#8b5cf6" },
  { to: '/citoyen/carte',    icon: FiMapPin,   label: 'Carte',        color: "#ec4899" },
  { to: "/citoyen/notifs",   icon: FiBell,     label: "Notifications",color: "#f97316" },
]

export default function CitoyenLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout(); navigate('/login'); toast.success('Déconnecté')
  }

  const initials = user?.nom?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'CT'

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <span className="text-white font-bold text-sm">⚖</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm">Sunu Tribunal</p>
            <p className="text-white/50 text-xs">Espace Citoyen</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="h-px w-full bg-white/10" />
        </div>
      </div>

      {/* User card */}
      <div className="mx-3 mb-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.12)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.nom || 'Citoyen'}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-white/60 text-xs">Compte vérifié</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 overflow-y-auto space-y-1">
        <p className="text-white/30 text-xs uppercase tracking-widest px-2 mb-3 font-semibold">Menu</p>
        {navItems.map((item, i) => (
          <NavLink key={item.to} to={item.to} end={item.exact}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <div className="sidebar-icon" style={{ background: `${item.color}25` }}>
              <item.icon className="w-4 h-4" style={{ color: item.color }} />
            </div>
            <span className="flex-1">{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* SOS + Logout */}
      <div className="px-3 pb-5 pt-3 space-y-2 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <NavLink to="/citoyen/sos" onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer font-semibold text-sm transition-all"
          style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
          <div className="sidebar-icon" style={{ background: 'rgba(239,68,68,0.2)' }}>
            <FiAlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
          </div>
          Alerte SOS
        </NavLink>
        <button onClick={handleLogout}
          className="sidebar-item w-full text-white/40 hover:text-red-400 hover:bg-red-500/10">
          <div className="sidebar-icon">
            <FiLogOut className="w-4 h-4 text-white/40" />
          </div>
          Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f0f4f8' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0"
        style={{ background: 'linear-gradient(180deg, #0f8a58 0%, #065f40 100%)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col animate-slide-in"
            style={{ background: 'linear-gradient(180deg, #0f8a58 0%, #065f40 100%)' }}>
            <div className="flex justify-end p-4">
              <button onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
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
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0f8a58, #065f40)' }}>
          <button onClick={() => setMobileOpen(true)}
            className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <FiMenu className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">⚖ Sunu Tribunal</span>
          </div>
          <NavLink to="/citoyen/notifs" className="relative w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
            <FiBell className="w-5 h-5 text-white" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
          </NavLink>
        </header>

        {/* Desktop topbar */}
        <header className="hidden lg:flex items-center justify-between bg-white/80 backdrop-blur-md
          border-b border-gray-100/80 px-6 py-3.5 flex-shrink-0"
          style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Espace citoyen</p>
            <p className="text-sm font-semibold text-navy-700">Bienvenue, {user?.nom?.split(' ')[0] || 'Citoyen'}</p>
          </div>
          <div className="flex items-center gap-2">
            <NavLink to="/citoyen/notifs"
              className="relative w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
              <FiBell className="w-4 h-4 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </NavLink>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #0f8a58, #065f40)' }}>
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

        {/* Mobile bottom nav */}
        <nav className="lg:hidden bg-white border-t border-gray-100 flex flex-shrink-0"
          style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
          {navItems.slice(0, 5).map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2.5 gap-1 text-xs font-medium transition-all ${
                  isActive ? 'text-justice-500' : 'text-gray-400'
                }`}>
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-7 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? 'bg-justice-50' : ''
                  }`}>
                    <item.icon className={`w-4.5 h-4.5 ${isActive ? 'text-justice-500' : 'text-gray-400'}`} />
                  </div>
                  <span className="leading-none">{item.label.split(' ')[0]}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
