/** Formats de date communs à l'espace citoyen et à l'espace tribunal */

export function ilYa(date) {
  if (!date) return ''
  const min = Math.round((Date.now() - new Date(date).getTime()) / 60000)
  if (min < 1)  return "A l'instant"
  if (min < 60) return `Il y a ${min} min`
  if (min < 24 * 60) return `Il y a ${Math.round(min / 60)} h`
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const fmtDate = (date) => date
  ? new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

export const fmtHeure = (date) => date
  ? new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''

export const fmtDateHeure = (date) => date ? `${fmtDate(date)} ${fmtHeure(date)}` : ''

/** Aujourd'hui en toutes lettres : « Vendredi 25 septembre 2026 » */
export function aujourdhuiLong() {
  const t = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}
