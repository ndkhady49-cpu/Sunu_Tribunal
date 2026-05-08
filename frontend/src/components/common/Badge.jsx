const variants = {
  pending:  'badge-pending',
  progress: 'badge-progress',
  done:     'badge-done',
  urgent:   'badge-urgent',
  rejected: 'badge-rejected',
}

const labels = {
  pending:  'En attente',
  progress: 'En cours',
  done:     'Traité',
  urgent:   'Urgent',
  rejected: 'Rejeté',
}

export default function Badge({ status, label, className = '' }) {
  const variant = variants[status] || 'badge-pending'
  const text    = label || labels[status] || status
  return (
    <span className={`badge ${variant} ${className}`}>{text}</span>
  )
}
