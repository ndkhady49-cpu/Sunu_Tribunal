import { Component } from 'react'
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi'

/**
 * Filet de sécurité : si un composant plante, on affiche un message
 * au lieu d'une page blanche.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { erreur: null }
  }

  static getDerivedStateFromError(erreur) {
    return { erreur }
  }

  componentDidCatch(erreur, info) {
    console.error('[SunuTribunal] Erreur interface :', erreur, info?.componentStack)
  }

  recharger = () => {
    this.setState({ erreur: null })
    window.location.assign('/')
  }

  render() {
    if (!this.state.erreur) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="card max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <FiAlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="font-display text-xl font-bold text-navy-700">
            Une erreur est survenue
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            L'affichage de cette page a rencontre un probleme. Vos donnees ne sont pas perdues.
          </p>
          {import.meta.env.DEV && (
            <pre className="text-left text-xs bg-gray-100 text-red-600 rounded-xl p-3 mt-4 overflow-auto max-h-40">
              {String(this.state.erreur?.message || this.state.erreur)}
            </pre>
          )}
          <button onClick={this.recharger}
            className="btn-primary mt-6 w-full flex items-center justify-center gap-2">
            <FiRefreshCw className="w-4 h-4" />
            Retour a l'accueil
          </button>
        </div>
      </div>
    )
  }
}
