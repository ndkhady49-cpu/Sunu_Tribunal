import logoClair from '../../assets/logo_sunutribunal/sunutribunal-logo.svg'
import logoSombreSvg from '../../assets/logo_sunutribunal/sunutribunal-logo-fond-sombre.svg?raw'
import icone from '../../assets/logo_sunutribunal/sunutribunal-icone.svg'

// Version fond sombre sans son rectangle de fond : elle se pose sur n'importe quel fond foncé
// (sidebar Encre, sidebar Baobab, bannière photo).
const logoSombre = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  logoSombreSvg.replace(/<rect width="1043" height="280"[^>]*\/>/, ''),
)

// Hauteurs du logo horizontal (le texte « SunuTribunal » est inclus dans le SVG)
const HAUTEURS = {
  xs:   'h-7',
  sm:   'h-9',
  md:   'h-11',
  lg:   'h-14',
  xl:   'h-20',
  full: 'h-24',
}
// Tailles de l'icône seule (version compacte)
const CARRES = {
  xs: 'h-8 w-8',
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
  full: 'h-32 w-32',
}

/**
 * Logo SunuTribunal.
 *   fond="clair"  (défaut) → logo encre et or, pour les fonds clairs
 *   fond="sombre"          → logo ivoire et or, pour les sidebars et la bannière
 *   compact                → icône seule (balance), quand la place manque
 * `showText` est conservé pour compatibilité : le nom figure déjà dans le logo.
 */
export default function Logo({ size = 'md', fond = 'clair', compact = false, className = '' }) {
  if (compact) {
    return (
      <img src={icone} alt="SunuTribunal"
        className={`${CARRES[size] || CARRES.md} rounded-xl object-contain ${className}`} />
    )
  }
  return (
    <img src={fond === 'sombre' ? logoSombre : logoClair} alt="SunuTribunal — Justice digitale"
      className={`${HAUTEURS[size] || HAUTEURS.md} w-auto max-w-full object-contain ${className}`} />
  )
}
