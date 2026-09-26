import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, homePathFor } from '../context/AuthContext.jsx'
import { authAPI } from '../services/api.js'
import Logo from '../components/common/Logo.jsx'
import toast from 'react-hot-toast'
import {
  FiCalendar, FiFileText, FiMapPin, FiAlertTriangle,
  FiMessageCircle, FiMail, FiBell, FiBarChart2,
  FiArrowRight, FiCheck, FiUser, FiShield,
  FiLock, FiMail as FiMailIcon, FiEye, FiEyeOff,
  FiAlertCircle, FiX, FiChevronDown, FiMenu
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md animate-slide-in overflow-hidden">

        {/* Header modal */}
        <div className={`px-8 py-6 ${isAdmin ? 'bg-navy-700' : 'bg-justice-500'}`}>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white">
            <FiX className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            {isAdmin
              ? <FiShield className="w-6 h-6 text-gold-400" />
              : <FiUser className="w-6 h-6 text-white" />
            }
            <span className="text-white/80 text-sm font-medium">
              {isAdmin ? 'Espace Tribunal' : 'Espace Citoyen'}
            </span>
          </div>
          <h2 className="text-white font-display text-2xl font-bold">
            {mode === 'login' ? 'Connexion' : 'Creer un compte'}
          </h2>
          <p className="text-white/60 text-sm mt-1">
            {mode === 'login'
              ? 'Acces a votre espace securise'
              : isAdmin ? 'Inscription personnel judiciaire' : 'Rejoignez SunuTribunal'
            }
          </p>
        </div>

        {/* Body modal */}
        <div className="px-8 py-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
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
                <FiMailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input className="form-input pl-10 pr-10"
                  type={showPass ? 'text' : 'password'} required placeholder="••••••••" minLength={6}
                  value={form.password} onChange={e => set('password', e.target.value)} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 bg-navy-50 rounded-xl p-3 text-xs text-navy-600">
                <FiShield className="w-4 h-4 flex-shrink-0" />
                Acces reserve au personnel judiciaire accredite par le Ministere de la Justice
              </div>
            )}

            <button type="submit" disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all duration-200 active:scale-95 ${
                loading ? 'opacity-70 cursor-wait' : ''
              } ${isAdmin ? 'bg-navy-700 hover:bg-navy-600' : 'bg-justice-500 hover:bg-justice-400'}`}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Connexion...' : 'Creation...'}
                </span>
              ) : (mode === 'login' ? 'Se connecter' : 'Creer mon compte')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-sm text-gray-500 hover:text-navy-700 transition-colors">
              {mode === 'login'
                ? 'Pas encore de compte ? Creer un compte'
                : 'Deja inscrit ? Se connecter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MODAL CHOIX DU RÔLE ────────────────────────────
function RoleModal({ onClose, onChoose, mode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-slide-in p-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <FiX className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <Logo size="md" className="mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-navy-700">
            {mode === 'login' ? 'Connexion' : 'Creer un compte'}
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            Acces reserve aux citoyens senegalais
          </p>
        </div>

        <button onClick={() => onChoose('citoyen')}
          className="w-full group flex flex-col items-center p-6 rounded-2xl border-2 border-justice-200 hover:border-justice-400 hover:bg-justice-50 transition-all duration-200 active:scale-95">
          <div className="w-16 h-16 rounded-2xl bg-justice-50 group-hover:bg-justice-100 flex items-center justify-center mb-3">
            <FiUser className="w-8 h-8 text-justice-500" />
          </div>
          <span className="font-bold text-navy-700">Citoyen</span>
          <span className="text-xs text-gray-500 mt-1">Acces aux services judiciaires</span>
        </button>

        <p className="text-xs text-gray-400 text-center mt-6">
          Personnel du tribunal ? Contactez votre administrateur.
        </p>
      </div>
    </div>
  )
}

// ── LANDING PAGE PRINCIPALE ────────────────────────
const FEATURES = [
  { icon: FiCalendar,       title: 'Rendez-vous en ligne',    desc: 'Reservez un creneau au tribunal sans file d attente, depuis votre telephone.',         color: 'bg-green-50 text-justice-500'  },
  { icon: FiFileText,       title: 'Depot de plainte',         desc: 'Soumettez votre plainte officielle avec pieces justificatives en quelques clics.',      color: 'bg-blue-50 text-blue-500'      },
  { icon: FiMapPin,         title: 'Localisation',             desc: 'Trouvez le tribunal le plus proche avec carte interactive et itineraire GPS.',          color: 'bg-orange-50 text-orange-500'  },
  { icon: FiAlertTriangle,  title: 'Alerte SOS',               desc: 'Signalez une urgence en un clic. Votre position GPS est transmise instantanement.',    color: 'bg-red-50 text-red-500'        },
  { icon: FiMessageCircle,  title: 'Assistant IA',             desc: 'Posez vos questions juridiques a notre assistant intelligent disponible 24h/24.',       color: 'bg-purple-50 text-purple-500'  },
  { icon: FiMail,           title: 'Courrier numerique',        desc: 'Echangez des messages officiels avec le tribunal directement depuis l app.',            color: 'bg-yellow-50 text-yellow-600'  },
  { icon: FiBell,           title: 'Notifications',            desc: 'Recevez des alertes en temps reel sur l avancement de vos dossiers.',                  color: 'bg-pink-50 text-pink-500'      },
  { icon: FiBarChart2,      title: 'Suivi de dossier',         desc: 'Consultez l etat de vos procedures judiciaires etape par etape, en toute transparence.', color: 'bg-teal-50 text-teal-500'     },
]

const STATS = [
  { num: '14',    label: 'Tribunaux connectes'  },
  { num: '24h',   label: 'Service disponible'   },
  { num: '100%',  label: 'Securise et chiffre'  },
  { num: '5min',  label: 'Reponse SOS max'      },
]

const STEPS = [
  { num: '01', title: 'Choisissez votre profil',  desc: 'Citoyen ou membre du tribunal — chaque espace est personnalise.' },
  { num: '02', title: 'Creez votre compte',        desc: 'Inscription simple avec votre email. Verification immediate.' },
  { num: '03', title: 'Accedez a vos services',    desc: 'Rendez-vous, plaintes, suivi de dossiers, tout en un.' },
]

const TEMOIGNAGES = [
  { nom: 'Aminata Diallo',   role: 'Citoyenne, Dakar',       texte: 'J ai depose ma plainte depuis mon telephone en 10 minutes. Plus besoin de me deplacer au tribunal !',          initiale: 'A' },
  { nom: 'Ousmane Sow',      role: 'Citoyen, Pikine',         texte: 'Le suivi de mon dossier en temps reel est tres rassurant. Je sais exactement ou j en suis.',                   initiale: 'O' },
  { nom: 'Fatou Ndiaye',     role: 'Greffiere, TGI Dakar',   texte: 'SunuTribunal a reduit de moitie le temps de traitement des dossiers. Un outil indispensable !',               initiale: 'F' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuth, user } = useAuth()
  const [showRoleModal, setShowRoleModal]   = useState(false)
  const [showAuthModal, setShowAuthModal]   = useState(false)
  const [selectedRole, setSelectedRole]     = useState(null)
  const [authMode, setAuthMode]             = useState('login')
  const [mobileMenu, setMobileMenu]         = useState(false)
  const [scrolled, setScrolled]             = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // La redirection "deja connecte" est geree une seule fois dans App.jsx (route "/")

  const openLogin    = () => { setShowRoleModal(true); setAuthMode('login') }
  const openRegister = () => { setShowRoleModal(true); setAuthMode('register') }

  const handleRoleChosen = (role) => {
    setSelectedRole(role)
    setShowRoleModal(false)
    setShowAuthModal(true)
  }

  return (
    <div className="min-h-screen bg-white font-body">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-sm border-b border-gray-100' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="sm" showText />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#fonctionnalites" className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-navy-700' : 'text-white/80 hover:text-white'}`}>
              Fonctionnalites
            </a>
            <a href="#comment" className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-navy-700' : 'text-white/80 hover:text-white'}`}>
              Comment ca marche
            </a>
            <a href="#temoignages" className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-navy-700' : 'text-white/80 hover:text-white'}`}>
              Temoignages
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={openLogin}
              className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
                scrolled ? 'text-navy-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}>
              Se connecter
            </button>
            <button onClick={openRegister}
              className="text-sm font-bold px-5 py-2 rounded-xl bg-justice-500 text-white hover:bg-justice-400 transition-all active:scale-95">
              Creer un compte
            </button>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
            <FiMenu className={`w-6 h-6 ${scrolled ? 'text-navy-700' : 'text-white'}`} />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
            <a href="#fonctionnalites" className="block text-sm text-gray-600 py-2">Fonctionnalites</a>
            <a href="#comment" className="block text-sm text-gray-600 py-2">Comment ca marche</a>
            <a href="#temoignages" className="block text-sm text-gray-600 py-2">Temoignages</a>
            <div className="flex gap-3 pt-2">
              <button onClick={openLogin} className="flex-1 text-sm font-semibold py-2.5 rounded-xl border border-gray-200 text-navy-700">
                Se connecter
              </button>
              <button onClick={openRegister} className="flex-1 text-sm font-bold py-2.5 rounded-xl bg-justice-500 text-white">
                Creer un compte
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-navy-700 via-navy-600 to-justice-500 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-20 left-20 w-64 h-64 rounded-full bg-gold-400/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/3 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-blink" />
              <span className="text-white/80 text-sm font-medium">Plateforme officielle · Republique du Senegal</span>
            </div>

            <h1 className="font-display text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              La justice<br />
              <span className="text-gold-400">numerique</span><br />
              pour tous
            </h1>

            <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-lg">
              SunuTribunal digitalise l acces aux services judiciaires au Senegal.
              Rendez-vous, plaintes, suivi de dossiers et alertes SOS depuis votre telephone.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <button onClick={openRegister}
                className="flex items-center gap-2 bg-gold-400 hover:bg-gold-500 text-navy-700 font-bold px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-lg">
                Commencer maintenant
                <FiArrowRight className="w-5 h-5" />
              </button>
              <button onClick={openLogin}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-4 rounded-2xl transition-all">
                Se connecter
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {STATS.map(s => (
                <div key={s.label} className="text-center">
                  <div className="font-display text-2xl font-bold text-white">{s.num}</div>
                  <div className="text-white/50 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <FiChevronDown className="w-6 h-6 text-white/40" />
        </div>
      </section>

      {/* ── FONCTIONNALITES ── */}
      <section id="fonctionnalites" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-justice-500 font-semibold text-sm uppercase tracking-widest">Fonctionnalites</span>
            <h2 className="font-display text-4xl font-bold text-navy-700 mt-3 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">
              8 modules complets pour digitaliser entierement votre parcours judiciaire
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-navy-700 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT CA MARCHE ── */}
      <section id="comment" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-justice-500 font-semibold text-sm uppercase tracking-widest">Simple et rapide</span>
            <h2 className="font-display text-4xl font-bold text-navy-700 mt-3 mb-4">
              Comment ca marche ?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={i} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-3/4 w-1/2 h-0.5 bg-gradient-to-r from-justice-300 to-gray-200" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-justice-500 text-white font-display text-2xl font-bold flex items-center justify-center mx-auto mb-6 shadow-lg">
                  {s.num}
                </div>
                <h3 className="font-bold text-navy-700 text-lg mb-3">{s.title}</h3>
                <p className="text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <button onClick={openRegister}
              className="inline-flex items-center gap-2 bg-justice-500 hover:bg-justice-400 text-white font-bold px-10 py-4 rounded-2xl transition-all active:scale-95 shadow-lg">
              Creer mon compte gratuitement
              <FiArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── 2 ESPACES ── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-justice-500 font-semibold text-sm uppercase tracking-widest">Deux espaces</span>
            <h2 className="font-display text-4xl font-bold text-navy-700 mt-3 mb-4">
              Une plateforme, deux univers
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Citoyen */}
            <div className="bg-white rounded-3xl p-8 border-2 border-justice-100 hover:border-justice-300 transition-all duration-200 shadow-sm hover:shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-justice-50 flex items-center justify-center mb-6">
                <FiUser className="w-7 h-7 text-justice-500" />
              </div>
              <h3 className="font-display text-2xl font-bold text-navy-700 mb-3">Espace Citoyen</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Pour tous les citoyens senegalais souhaitant acceder facilement aux services judiciaires.
              </p>
              <ul className="space-y-2 mb-8">
                {['Prise de rendez-vous', 'Depot de plainte en ligne', 'Suivi de dossier', 'Alerte SOS', 'Assistant juridique IA', 'Courriers avec le tribunal'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <FiCheck className="w-4 h-4 text-justice-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white/60 text-sm text-center font-medium">
              Acces sur invitation uniquement
              </div>
              <p className="text-xs text-white/40 text-center mt-2">
               Contactez l'administration du Ministere de la Justice
              </p>
              </div>

            {/* Tribunal */}
            <div className="bg-navy-700 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-200">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <FiShield className="w-7 h-7 text-gold-400" />
              </div>
              <h3 className="font-display text-2xl font-bold text-white mb-3">Espace Tribunal</h3>
              <p className="text-white/60 mb-6 leading-relaxed">
                Pour le personnel judiciaire accredite (greffiers, juges, administration).
              </p>
              <ul className="space-y-2 mb-8">
                {['Tableau de bord KPIs', 'Validation des RDV', 'Instruction des plaintes', 'Gestion des alertes SOS', 'Statistiques analytiques', 'Assistant IA de redaction'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white/80">
                    <FiCheck className="w-4 h-4 text-gold-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white/50 text-sm text-center">
                Acces sur invitation de l'administration uniquement
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TEMOIGNAGES ── */}
      <section id="temoignages" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-justice-500 font-semibold text-sm uppercase tracking-widest">Temoignages</span>
            <h2 className="font-display text-4xl font-bold text-navy-700 mt-3 mb-4">
              Ils font confiance a SunuTribunal
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TEMOIGNAGES.map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex mb-3">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className="text-gold-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">"{t.texte}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-justice-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.initiale}
                  </div>
                  <div>
                    <p className="font-semibold text-navy-700 text-sm">{t.nom}</p>
                    <p className="text-gray-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 bg-gradient-to-r from-navy-700 to-justice-500">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Pret a digitaliser votre acces a la justice ?
          </h2>
          <p className="text-white/70 text-lg mb-10">
            Rejoignez des milliers de citoyens qui font deja confiance a SunuTribunal.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={openRegister}
              className="inline-flex items-center gap-2 bg-gold-400 hover:bg-gold-500 text-navy-700 font-bold px-10 py-4 rounded-2xl transition-all active:scale-95 shadow-lg">
              Creer mon compte
              <FiArrowRight className="w-5 h-5" />
            </button>
            <button onClick={openLogin}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-4 rounded-2xl transition-all">
              Se connecter
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-navy-700 py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo fond="sombre" size="md" />
            <p className="text-white/40 text-sm text-center">
              SunuTribunal © 2025 · Ministere de la Justice · Republique du Senegal
            </p>
            <div className="flex gap-6 text-sm text-white/40">
              <a href="#" className="hover:text-white transition-colors">Confidentialite</a>
              <a href="#" className="hover:text-white transition-colors">Conditions</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── MODALS ── */}
      {showRoleModal && (
        <RoleModal
          onClose={() => setShowRoleModal(false)}
          onChoose={handleRoleChosen}
          mode={authMode}
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