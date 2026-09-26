import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiLock, FiEye, FiEyeOff, FiCheck, FiLogOut, FiAlertCircle } from 'react-icons/fi'
import Logo from '../components/common/Logo.jsx'
import { authAPI, messageErreur } from '../services/api.js'
import { useAuth, homePathFor } from '../context/AuthContext.jsx'

/**
 * Définir son mot de passe — obligatoire à la 1re connexion d'un compte du personnel.
 * Tant que ce n'est pas fait, le reste de l'application (et l'API) reste bloqué.
 */
export default function MotDePassePage() {
  const { user, logout, majUtilisateur } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ ancien: '', nouveau: '', confirmation: '' })
  const [voir, setVoir] = useState(false)
  const [erreurs, setErreurs] = useState({})
  const [chargement, setChargement] = useState(false)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErreurs({}) }

  // Rappel des règles, vérifiées en direct (le serveur applique aussi les validateurs Django)
  const regles = [
    { ok: form.nouveau.length >= 8, texte: '8 caractères minimum' },
    { ok: !!form.nouveau && form.nouveau !== form.ancien, texte: 'Différent du mot de passe temporaire' },
    { ok: !!form.nouveau && form.nouveau === form.confirmation, texte: 'Confirmation identique' },
  ]

  const enregistrer = async (e) => {
    e.preventDefault()
    setChargement(true)
    try {
      const res = await authAPI.changerMotDePasse(form)
      majUtilisateur({ ...res.data.user, doit_changer_mdp: false })
      toast.success('Mot de passe enregistré. Bienvenue !')
      navigate(homePathFor(user.role) || '/', { replace: true })
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object' && !data.detail) setErreurs(data)
      else toast.error(messageErreur(err))
    } finally {
      setChargement(false)
    }
  }

  const deconnecter = () => { logout(); navigate('/', { replace: true }) }
  const erreur = (champ) => erreurs[champ] && (
    <p className="text-xs text-danger-600 mt-1.5 flex items-start gap-1">
      <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
      {[].concat(erreurs[champ]).join(' ')}
    </p>
  )
  const champ = (cle, label, autoComplete) => (
    <div>
      <label className="form-label" htmlFor={cle}>{label}</label>
      <div className="relative">
        <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input id={cle} className="form-input pl-10" type={voir ? 'text' : 'password'} required
          autoComplete={autoComplete} value={form[cle]} onChange={e => set(cle, e.target.value)} />
      </div>
      {erreur(cle)}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">
      <Logo size="md" className="mb-8" />
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="font-display text-3xl font-bold text-navy-700">Définir votre mot de passe</h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Bonjour {user?.prenom || user?.nom}. Votre compte a été créé avec un mot de passe temporaire :
          choisissez votre mot de passe personnel pour accéder à votre espace.
        </p>

        <form onSubmit={enregistrer} className="space-y-4 mt-6">
          {champ('ancien', 'Mot de passe temporaire', 'current-password')}
          {champ('nouveau', 'Nouveau mot de passe', 'new-password')}
          {champ('confirmation', 'Confirmer le nouveau mot de passe', 'new-password')}

          <button type="button" onClick={() => setVoir(!voir)}
            className="text-xs font-semibold text-gray-500 hover:text-navy-700 flex items-center gap-1.5">
            {voir ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
            {voir ? 'Masquer les mots de passe' : 'Afficher les mots de passe'}
          </button>

          <ul className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5">
            {regles.map(r => (
              <li key={r.texte} className={`text-xs flex items-center gap-2 ${r.ok ? 'text-justice-600' : 'text-gray-500'}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${r.ok ? 'bg-justice-500 text-white' : 'border border-gray-300'}`}>
                  {r.ok && <FiCheck className="w-3 h-3" />}
                </span>
                {r.texte}
              </li>
            ))}
            <li className="text-xs text-gray-500 pl-6">Évitez les mots de passe courants ou proches de votre email.</li>
          </ul>

          <button type="submit" disabled={chargement || !regles.every(r => r.ok)} className="btn-primary w-full py-3">
            {chargement
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : 'Enregistrer mon mot de passe'}
          </button>
        </form>
      </div>
      <button onClick={deconnecter}
        className="mt-6 text-sm text-gray-500 hover:text-navy-700 flex items-center gap-2">
        <FiLogOut className="w-4 h-4" /> Se déconnecter
      </button>
    </div>
  )
}
