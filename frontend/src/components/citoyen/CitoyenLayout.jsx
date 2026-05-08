import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  FiHome, FiCalendar, FiFileText, FiMapPin, FiBell, FiAlertTriangle,
  FiLogOut, FiMenu, FiX
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext.jsx'
import Logo from '../../components/common/Logo.jsx'
import toast from 'react-hot-toast'

const navItems = [
  { to: "/citoyen",          icon: FiHome,         label: "Accueil",  exact: true },
  { to: '/citoyen/rdv',      icon: FiCalendar,     label: 'RDV'           },
  { to: '/citoyen/plainte',  icon: FiFileText,     label: 'Plainte'       },
  { to: '/citoyen/suivi',    icon: FiFileText,     label: 'Mes dossiers'  },
  { to: '/citoyen/carte',    icon: FiMapPin,       label: 'Carte'         },
  { to: "/citoyen/notifs",   icon: FiBell,         label: "Notifications" },
]

export default function CitoyenLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Déconnecté')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-justice-500 text-white flex-shrink-0">
        <div className="p-5 border-b border-white/10">
          <Logo size="md" showText className="filter brightness-0 invert" />
        </div>

        <div className="p-3 flex-1 overflow-y-auto">
          <p className="text-xs text-white/40 uppercase tracking-widest px-2 mb-3 font-semibold">Navigation</p>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}

          <div className="mt-4 pt-4 border-t border-white/10">
            <NavLink to="/citoyen/sos"
              className="sidebar-item bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30">
              <FiAlertTriangle className="w-4 h-4" />
              Alerte SOS
            </NavLink>
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {user?.nom?.[0] || 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.nom}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="sidebar-item w-full text-white/50 hover:text-white">
            <FiLogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-justice-500 text-white p-4 z-50 animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <Logo size="sm" />
              <button onClick={() => setMobileOpen(false)}>
                <FiX className="w-6 h-6 text-white/70" />
              </button>
            </div>
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.exact}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden bg-justice-500 text-white px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)}>
            <FiMenu className="w-6 h-6" />
          </button>
          <Logo size="sm" />
          <NavLink to="/citoyen/notifs">
            <div className="relative"><FiBell className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">2</span>
            </div>
          </NavLink>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden bg-white border-t border-gray-100 flex">
          {navItems.slice(0, 4).map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
                  isActive ? 'text-justice-500' : 'text-gray-400'
                }`}>
              <item.icon className="w-5 h-5" />
              {item.label.split(' ')[0]}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
