import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, homePathFor } from '../context/AuthContext.jsx'
import { authAPI } from '../services/api.js'
import Logo from '../components/common/Logo.jsx'
import toast from 'react-hot-toast'
import heroDesktop from '../assets/hero-justice.jpg'
import heroMobile from '../assets/hero-justice-mobile.jpg'
import {
  FiCalendar, FiFileText, FiMapPin, FiAlertTriangle, FiMessageCircle, FiSearch,
  FiArrowRight, FiUser, FiShield, FiLock, FiMail as FiMailIcon, FiEye, FiEyeOff,
  FiAlertCircle, FiX, FiMenu, FiUserPlus, FiSend, FiSmartphone
} from 'react-icons/fi'

// ── MODAL D'AUTHENTIFICATION ─────────────────────────
function AuthModal({ mode: initMode, role: initRole, onClose }) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [mode, setMode]         = useState(initMode || 'login')   // login | register
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [form, setForm] = useState({
    email: '', password: '', nom: '', prenom: '', telephone: ''
  })

  const isAdmin = initRole === 'admin'
  const set = (k, v) => { setForm(f => ({...f, [k]: v})); setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) { setError('Veuillez remplir tous les champs.'); return }
    if (mode === 'register' && !form.nom) { setError('Le nom est requis.'); return }
    setLoading(true)
    try {
      if (mode === 'login') {
        const res = await authAPI.login({ email: form.email, password: form.password })
        const { access, user } = res.data
        const home = homePathFor(user.role)
        if (!home) { setError("Ce type de compte n'a pas encore d'espace dans l'application."); return }
        login(user, access)
        toast.success('Bienvenue ' + user.nom + ' !')
        onClose()
        navigate(home, { replace: true })
      } else {
        await authAPI.register({
          email: form.email, password: form.password, password2: form.password,
          nom: form.nom, prenom: form.prenom, telephone: form.telephone,
          // Le rôle n'est pas envoyé : le serveur crée TOUJOURS un compte citoyen
        })
        toast.success('Compte cree ! Connectez-vous.')
        setMode('login')
        setForm(f => ({...f, password: ''}))
      }
    } catch (err) {
      const data = err.response?.data
      if (data?.detail) setError(data.detail)
      else if (data?.email) setError('Email : ' + data.email[0])
      else if (data?.non_field_errors) setError(data.non_field_errors[0])
      else setError('Email ou mot de passe incorrect.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-navy-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md animate-slide-in overflow-hidden max-h-[92vh] overflow-y-auto">

        {/* En-tête : Encre pour le tribunal, Baobab pour le citoyen */}
        <div className={`px-6 sm:px-8 pt-7 pb-6 ${isAdmin ? 'bg-navy-700' : 'bg-justice-600'}`}>
          <button onClick={onClose} aria-label="Fermer"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10">
            <FiX className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-3">
            {isAdmin
              ? <FiShield className="w-4 h-4 text-gold-400" />
              : <FiUser className="w-4 h-4 text-white/80" />
            }
            <span className="text-white/80 text-xs font-semibold uppercase tracking-[0.14em]">
              {isAdmin ? 'Espace Tribunal' : 'Espace Citoyen'}
            </span>
          </div>
          <h2 className="text-white font-display text-3xl font-bold">
            {mode === 'login' ? 'Connexion' : 'Creer un compte'}
          </h2>
          <p className="text-white/70 text-sm mt-1">
            {mode === 'login'
              ? 'Acces a votre espace securise'
              : 'Rejoignez SunuTribunal'
            }
          </p>
        </div>

        <div className="px-6 sm:px-8 py-6">
          {error && (
            <div className="flex items-center gap-2 bg-danger-50 border border-danger-100 text-danger-600 rounded-xl px-4 py-3 mb-4 text-sm">
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Nom *</label>
                  <input className="form-input" placeholder="Diallo"
                    value={form.nom} onChange={e => set('nom', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Prenom</label>
                  <input className="form-input" placeholder="Abdoulaye"
                    value={form.prenom} onChange={e => set('prenom', e.target.value)} />
                </div>
              </div>
            )}

            <div>
              <label className="form-label">
                {isAdmin ? 'Identifiant judiciaire' : 'Adresse email'}
              </label>
              <div className="relative">
                <FiMailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input className="form-input pl-10" type="email" required
                  placeholder={isAdmin ? 'greffier@tgi-dakar.sn' : 'votre@email.sn'}
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="form-label">Telephone</label>
                <input className="form-input" placeholder="+221 77 000 00 00"
                  value={form.telephone} onChange={e => set('telephone', e.target.value)} />
              </div>
            )}

            <div>
              <label className="form-label">Mot de passe</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input className="form-input pl-10 pr-10"
                  type={showPass ? 'text' : 'password'} required placeholder="••••••••" minLength={6}
                  value={form.password} onChange={e => set('password', e.target.value)} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-700">
                  {showPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-start gap-2 bg-navy-50 rounded-xl p-3 text-xs text-navy-600 leading-relaxed">
                <FiShield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Acces reserve au personnel judiciaire accredite. Les comptes sont crees par le greffier en chef.
              </div>
            )}

            <button type="submit" disabled={loading}
              className={`w-full py-3 ${isAdmin ? 'btn-primary' : 'btn-justice'} ${loading ? 'cursor-wait' : ''}`}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Connexion...' : 'Creation...'}
                </span>
              ) : (mode === 'login' ? 'Se connecter' : 'Creer mon compte')}
            </button>
          </form>

          {/* Inscription publique : citoyens uniquement */}
          {!isAdmin && (
            <div className="mt-5 text-center">
              <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
                className="text-sm text-gray-500 hover:text-navy-700 transition-colors">
                {mode === 'login'
                  ? <>Pas encore de compte ? <span className="font-semibold text-justice-500">Creer un compte</span></>
                  : <>Deja inscrit ? <span className="font-semibold text-justice-500">Se connecter</span></>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── MODAL CHOIX DU RÔLE ────────────────────────────
function RoleModal({ onClose, onChoose }) {
  const choix = [
    { role: 'citoyen', icon: FiUser,   titre: 'Citoyen',                 desc: 'Rendez-vous, plaintes, suivi de dossier', cls: 'text-justice-500 bg-justice-50' },
    { role: 'admin',   icon: FiShield, titre: 'Personnel du tribunal',   desc: 'Greffe, juges, accueil, bureau courrier',  cls: 'text-navy-700 bg-navy-50' },
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-navy-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm animate-slide-in p-6 sm:p-8">
        <button onClick={onClose} aria-label="Fermer"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-navy-700 hover:bg-gray-50">
          <FiX className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <Logo size="md" className="mx-auto mb-5" />
          <h2 className="font-display text-3xl font-bold text-navy-700">Connexion</h2>
          <p className="text-gray-500 text-sm mt-1">Choisissez votre espace</p>
        </div>

        <div className="space-y-3">
          {choix.map(c => (
            <button key={c.role} onClick={() => onChoose(c.role)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-200 hover:border-navy-300 hover:shadow-card text-left transition-all active:scale-[0.99]">
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${c.cls}`}>
                <c.icon className="w-5 h-5" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-navy-700">{c.titre}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{c.desc}</span>
              </span>
              <FiArrowRight className="w-4 h-4 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── CONTENU DE LA PAGE ─────────────────────────────
const SERVICES = [
  { icon: FiCalendar,      titre: 'Rendez-vous',            desc: 'Reservez un creneau au tribunal, sans file d\'attente.' },
  { icon: FiFileText,      titre: 'Plainte en ligne',       desc: 'Deposez votre plainte avec vos pieces scannees.' },
  { icon: FiSearch,        titre: 'Suivi de dossier',       desc: 'Suivez chaque etape de votre procedure en direct.' },
  { icon: FiMapPin,        titre: 'Carte des tribunaux',    desc: 'Trouvez le tribunal le plus proche de chez vous.' },
  { icon: FiAlertTriangle, titre: 'Alerte SOS',             desc: 'Signalez une urgence avec votre position GPS.', sos: true },
  { icon: FiMessageCircle, titre: 'Assistant juridique IA', desc: 'Posez vos questions de droit, a toute heure.' },
]

const ETAPES = [
  { icon: FiUserPlus,   titre: 'Je cree mon compte',     desc: 'Email et telephone : c\'est gratuit et immediat.' },
  { icon: FiSend,       titre: 'Je fais ma demarche',    desc: 'Rendez-vous, plainte ou courrier, depuis mon telephone.' },
  { icon: FiSmartphone, titre: 'Je recois un SMS',       desc: 'Le tribunal me repond : confirmation, orientation, decision.' },
]

export default function LandingPage() {
  const [showRoleModal, setShowRoleModal]   = useState(false)
  const [showAuthModal, setShowAuthModal]   = useState(false)
  const [selectedRole, setSelectedRole]     = useState(null)
  const [authMode, setAuthMode]             = useState('login')
  const [mobileMenu, setMobileMenu]         = useState(false)
  const [scrolled, setScrolled]             = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // La redirection "deja connecte" est geree une seule fois dans App.jsx (route "/")

  const ouvrirAuth = (role, mode = 'login') => {
    setMobileMenu(false)
    setSelectedRole(role)
    setAuthMode(mode)
    setShowAuthModal(true)
  }
  const openLogin    = () => { setMobileMenu(false); setShowRoleModal(true) }
  const openRegister = () => ouvrirAuth('citoyen', 'register')   // inscription : citoyens uniquement

  const handleRoleChosen = (role) => {
    setShowRoleModal(false)
    ouvrirAuth(role, 'login')
  }

  const lienNav = 'text-sm font-medium text-white/80 hover:text-white transition-colors'

  return (
    <div className="min-h-screen bg-gray-50 font-body">

      {/* ── NAVBAR : transparente sur la bannière, Encre au défilement ── */}
      <nav className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled || mobileMenu ? 'bg-navy-700/95 backdrop-blur shadow-[0_1px_0_rgba(255,255,255,0.06)]' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
          <a href="#haut" aria-label="SunuTribunal — accueil"><Logo fond="sombre" size="sm" /></a>

          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className={lienNav}>Nos services</a>
            <a href="#comment" className={lienNav}>Comment ca marche</a>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button onClick={openLogin} className="text-sm font-semibold text-white px-4 py-2 rounded-xl hover:bg-white/10 transition-colors">
              Se connecter
            </button>
            <button onClick={openRegister}
              className="text-sm font-semibold text-white px-4 py-2 rounded-xl border border-white/40 hover:border-white hover:bg-white/5 transition-colors">
              Creer un compte
            </button>
          </div>

          <button className="md:hidden p-2 -mr-2 text-white" onClick={() => setMobileMenu(!mobileMenu)}
            aria-label={mobileMenu ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={mobileMenu}>
            {mobileMenu ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenu && (
          <div className="md:hidden border-t border-white/10 px-4 pb-5 pt-2 space-y-1 animate-fade-in">
            <a href="#services" onClick={() => setMobileMenu(false)} className="block text-white/85 py-3 text-[15px]">Nos services</a>
            <a href="#comment" onClick={() => setMobileMenu(false)} className="block text-white/85 py-3 text-[15px]">Comment ca marche</a>
            <div className="grid grid-cols-2 gap-3 pt-3">
              <button onClick={openLogin} className="py-3 rounded-xl border border-white/40 text-white text-sm font-semibold">
                Se connecter
              </button>
              <button onClick={openRegister} className="py-3 rounded-xl bg-white text-navy-700 text-sm font-semibold">
                Creer un compte
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── BANNIÈRE ── */}
      <header id="haut" className="relative min-h-[100svh] flex overflow-hidden bg-navy-700">
        <picture>
          <source media="(max-width: 767px)" srcSet={heroMobile} />
          <img src={heroDesktop} alt="" aria-hidden="true"
            className="absolute inset-x-0 bottom-0 w-full h-[76%] md:inset-0 md:h-full object-cover object-bottom md:object-[75%_center]" />
        </picture>
        {/* Dégradé Encre léger pour la lisibilité du texte */}
        <div className="absolute inset-0 md:hidden"
          style={{ background: 'linear-gradient(to bottom, rgba(14,26,43,0.90) 0%, rgba(14,26,43,0.55) 38%, rgba(14,26,43,0.15) 62%)' }} />
        <div className="absolute inset-0 hidden md:block"
          style={{ background: 'linear-gradient(to right, rgba(14,26,43,0.92) 0%, rgba(14,26,43,0.70) 35%, rgba(14,26,43,0.10) 70%)' }} />

        <div className="relative w-full max-w-6xl mx-auto px-5 sm:px-6 pt-28 md:pt-0 md:flex md:items-center">
          <div className="max-w-xl">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
              Justice digitale · Senegal
            </p>
            <h1 className="font-display text-white font-bold leading-[1.05] text-[2.6rem] sm:text-5xl lg:text-[4.25rem]">
              La justice,<br />plus proche de vous.
            </h1>
            <p className="text-white/80 text-base md:text-lg leading-relaxed mt-5 max-w-md">
              Rendez-vous, plainte, suivi de dossier et alerte SOS : vos demarches au tribunal,
              depuis votre telephone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button onClick={() => ouvrirAuth('citoyen', 'login')} className="btn-gold py-3.5 px-7 text-[15px]">
                <FiCalendar className="w-4 h-4 mr-2" /> Prendre rendez-vous
              </button>
              <button onClick={() => ouvrirAuth('admin', 'login')}
                className="inline-flex items-center justify-center py-3.5 px-7 rounded-xl border border-white/70 text-white text-[15px] font-semibold hover:bg-white/10 hover:border-white transition-all">
                <FiShield className="w-4 h-4 mr-2" /> Espace tribunal
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── NOS SERVICES ── */}
      <section id="services" className="py-20 md:py-28 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="max-w-xl mb-10 md:mb-14">
            <p className="text-justice-500 text-xs font-semibold uppercase tracking-[0.18em] mb-3">Nos services</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-navy-700 leading-tight">
              Tout le tribunal, dans votre poche
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {SERVICES.map(s => (
              <button key={s.titre} onClick={() => ouvrirAuth('citoyen', 'login')}
                className="card text-left flex items-start gap-4 hover:-translate-y-0.5 group">
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  s.sos ? 'bg-danger-50 text-danger-400' : 'bg-navy-50 text-navy-700'
                }`}>
                  <s.icon className="w-5 h-5" />
                </span>
                <span>
                  <span className="block font-semibold text-navy-700">{s.titre}</span>
                  <span className="block text-sm text-gray-500 mt-1 leading-relaxed">{s.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section id="comment" className="py-20 md:py-28 bg-white border-y border-gray-200 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="max-w-xl mb-10 md:mb-14">
            <p className="text-justice-500 text-xs font-semibold uppercase tracking-[0.18em] mb-3">Comment ca marche</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-navy-700 leading-tight">
              Trois etapes, c'est tout
            </h2>
          </div>
          <ol className="grid md:grid-cols-3 gap-8 md:gap-10">
            {ETAPES.map((e, i) => (
              <li key={e.titre} className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-display text-5xl font-bold text-navy-100 leading-none">0{i + 1}</span>
                  <span className="w-10 h-10 rounded-full bg-navy-700 text-white flex items-center justify-center">
                    <e.icon className="w-4 h-4" />
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold text-navy-700">{e.titre}</h3>
                <p className="text-gray-500 mt-2 leading-relaxed">{e.desc}</p>
              </li>
            ))}
          </ol>
          <button onClick={openRegister} className="btn-primary mt-12 py-3 px-6">
            Creer mon compte citoyen <FiArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </section>

      {/* ── PIED DE PAGE ── */}
      <footer className="bg-navy-700 text-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <Logo fond="sombre" size="md" />
            <nav className="flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/75" aria-label="Liens du pied de page">
              <a href="#services" className="hover:text-white transition-colors">Nos services</a>
              <a href="#comment" className="hover:text-white transition-colors">Comment ca marche</a>
              <button onClick={openLogin} className="hover:text-white transition-colors">Se connecter</button>
              <button onClick={() => ouvrirAuth('admin', 'login')} className="hover:text-white transition-colors">Espace tribunal</button>
            </nav>
          </div>
          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-white/60">
            <p>Ministere de la Justice — Republique du Senegal</p>
            <p>© {new Date().getFullYear()} SunuTribunal · Justice digitale</p>
          </div>
        </div>
      </footer>

      {/* ── MODALS ── */}
      {showRoleModal && (
        <RoleModal
          onClose={() => setShowRoleModal(false)}
          onChoose={handleRoleChosen}
        />
      )}

      {showAuthModal && selectedRole && (
        <AuthModal
          mode={authMode}
          role={selectedRole}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  )
}
