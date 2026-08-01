const variants = {
  pending:  'badge-pending',
  progress: 'badge-progress',
  done:     'badge-done',
  urgent:   'badge-urgent',
  rejected: 'badge-rejected',
  free:     'badge-free',
}

const labels = {
  pending:  'En attente',
  progress: 'En cours',
  done:     'Traité',
  urgent:   'Urgent',
  rejected: 'Rejeté',
  free:     'Disponible',
}

const dotColors = {
  pending:  'bg-amber-400',
  progress: 'bg-blue-400',
  done:     'bg-emerald-400',
  urgent:   'bg-red-500',
  rejected: 'bg-gray-400',
  free:     'bg-emerald-400',
}

export default function Badge({ status, label, className = '' }) {
  const variant  = variants[status] || 'badge-pending'
  const text     = label || labels[status] || status
  const dotColor = dotColors[status] || 'bg-gray-400'
  return (
    <span className={`badge ${variant} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor} ${status === 'urgent' ? 'animate-pulse' : ''}`} />
      {text}
    </span>
  )
}
