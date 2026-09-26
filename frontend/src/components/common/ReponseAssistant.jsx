import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FiCopy, FiCheck } from 'react-icons/fi'

// Éléments Markdown rendus dans la charte « Encre & Or » (aucun HTML brut n'est interprété)
const ELEMENTS = {
  p:      ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-navy-700">{children}</strong>,
  em:     ({ children }) => <em className="italic">{children}</em>,
  a:      ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-gold-500 underline underline-offset-2 hover:text-gold-600">{children}</a>
  ),
  // Titres : au plus un cran au-dessus du texte
  h1: ({ children }) => <p className="text-[15px] font-semibold text-navy-700 mt-3 mb-1.5 first:mt-0">{children}</p>,
  h2: ({ children }) => <p className="text-[15px] font-semibold text-navy-700 mt-3 mb-1.5 first:mt-0">{children}</p>,
  h3: ({ children }) => <p className="text-sm font-semibold text-navy-700 mt-2.5 mb-1 first:mt-0">{children}</p>,
  h4: ({ children }) => <p className="text-sm font-semibold text-navy-700 mt-2 mb-1 first:mt-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 last:mb-0 space-y-1 marker:text-gray-400">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 last:mb-0 space-y-1 marker:text-gray-500 marker:font-semibold">{children}</ol>,
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-gray-300 pl-3 text-gray-600 my-2">{children}</blockquote>
  ),
  hr:   () => <hr className="my-3 border-gray-200" />,
  code: ({ children }) => <code className="bg-gray-100 rounded px-1 py-0.5 text-[13px]">{children}</code>,
  pre:  ({ children }) => <pre className="bg-gray-50 rounded-lg p-2 my-2 overflow-x-auto whitespace-pre-wrap text-[13px]">{children}</pre>,
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="text-left font-semibold text-navy-700 bg-gray-50 border border-gray-200 px-2 py-1">{children}</th>,
  td: ({ children }) => <td className="border border-gray-200 px-2 py-1 align-top">{children}</td>,
}

/**
 * Réponse d'un assistant : Markdown rendu proprement + bouton « Copier ».
 * La copie reprend le texte affiché (innerText) : aucun symbole Markdown (**, #, -) n'est copié.
 */
export default function ReponseAssistant({ texte, copiable = true }) {
  const contenuRef = useRef(null)
  const [copie, setCopie] = useState(false)

  const copier = async () => {
    const propre = contenuRef.current?.innerText?.trim() || ''
    try {
      await navigator.clipboard.writeText(propre)
    } catch {
      // Repli pour les navigateurs sans presse-papiers asynchrone (WebView Android ancienne)
      const zone = document.createElement('textarea')
      zone.value = propre
      document.body.appendChild(zone)
      zone.select()
      document.execCommand('copy')
      zone.remove()
    }
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  return (
    <div>
      <div ref={contenuRef} className="break-words">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={ELEMENTS} skipHtml>
          {texte}
        </ReactMarkdown>
      </div>
      {copiable && (
        <button onClick={copier} type="button"
          className="flex items-center gap-1 mt-2 -mb-0.5 text-xs text-gray-500 hover:text-navy-700 transition-colors">
          {copie
            ? <><FiCheck className="w-3 h-3 text-justice-500" /><span className="text-justice-600">Copié</span></>
            : <><FiCopy className="w-3 h-3" /><span>Copier</span></>}
        </button>
      )}
    </div>
  )
}
