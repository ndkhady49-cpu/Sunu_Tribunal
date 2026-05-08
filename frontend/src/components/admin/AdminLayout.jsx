import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  FiGrid, FiCalendar, FiFileText, FiAlertTriangle,
  FiBarChart2, FiFolder, FiSettings, FiLogOut, FiMenu, FiX, FiBell
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext.jsx'
import Logo from '../../components/common/Logo.jsx'
import toast from 'react-hot-toast'

const navItems = [
  { to:"/admin",          icon:FiGrid,          label:"Vue générale",   exact:true, badge:null },
  { to:'/admin/rdv',      icon:FiCalendar,      label:'Rendez-vous',    badge:"8"  },
  { to:"/admin/plaintes", icon:FiFileText,      label:"Plaintes",       badge:'5'  },
  { to:"/admin/alertes",  icon:FiAlertTriangle, label:"Alertes SOS",    badge:'3', urgent:true },
  { to:"/admin/stats",    icon:FiBarChart2,     label:"Statistiques",   badge:null },
  { to:"/admin/dossiers", icon:FiFolder,        label:"Dossiers",       badge:null },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate("/login"); toast.success("Déconnecté") }

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-white/10">
        <Logo size="sm" showText className="filter brightness-0 invert" />
        <p className="text-xs text-white/40 mt-2 uppercase tracking-widest">Administration · TGI Dakar</p>
      </div>
      <div className="p-3 flex-1 overflow-y-auto">
        <p className="text-xs text-white/40 uppercase tracking-widest px-2 mb-3 font-semibold">Navigation</p>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.exact}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''} ${item.urgent ? 'mt-1' : ''}`
            }>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                item.urgent ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
              }`}>{item.badge}</span>
            )}
          </NavLink>
        ))}
      </div>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gold-400/30 flex items-center justify-center text-gold-400 text-sm font-bold">
            {user?.nom?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.nom}</p>
            <p className="text-xs text-white/50">Greffier en chef</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-item w-full text-white/50 hover:text-white">
          <FiLogOut className="w-4 h-4" />Déconnexion
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

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center justify-between">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <FiMenu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="hidden lg:block">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Tribunal de Grande Instance</p>
            <p className="font-semibold text-navy-700 text-sm">TGI Dakar – Plateau</p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <NavLink to="/admin/alertes" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <FiBell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">3</span>
            </NavLink>
            <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-white text-xs font-bold">
              {user?.nom?.[0] || 'A'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
