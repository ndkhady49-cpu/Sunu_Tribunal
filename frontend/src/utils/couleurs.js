/**
 * Couleurs de la charte « Encre & Or » pour les usages hors Tailwind
 * (graphiques Recharts, marqueurs Leaflet, notifications toast).
 */
export const CHARTE = {
  encre:    '#0E1A2B',
  encreDoux:'#4E5F7C',
  or:       '#C9A45C',
  baobab:   '#1F5E4B',
  bordeaux: '#A23446',
  ivoire:   '#F7F3EA',
  trait:    '#E7E1D4',
  texteDoux:'#6B6457',
}

// Une couleur par catégorie de dossier (les libellés viennent de /api/stats/)
export const COULEUR_SERVICE = {
  'Civil':      CHARTE.encre,
  'Penal':      CHARTE.bordeaux,
  'Commercial': CHARTE.or,
  'Etat civil': CHARTE.baobab,
  'Cyber':      CHARTE.encreDoux,
}

// Palette des camemberts, dans l'ordre d'affichage
export const PALETTE = [CHARTE.encre, CHARTE.bordeaux, CHARTE.or, CHARTE.baobab, CHARTE.encreDoux, '#B7AE9C']

// Style commun des axes et infobulles
export const AXE = { fontSize: 11, fill: CHARTE.texteDoux }
export const INFOBULLE = { borderRadius: 12, border: `1px solid ${CHARTE.trait}`, fontSize: 12, fontFamily: 'Manrope' }
