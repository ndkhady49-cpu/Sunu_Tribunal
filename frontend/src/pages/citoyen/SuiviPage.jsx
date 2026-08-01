import { useState } from 'react'
import { FiMessageSquare, FiChevronDown, FiChevronUp, FiAlertCircle } from 'react-icons/fi'
import Badge from '../../components/common/Badge.jsx'

const DOSSIERS = [
  {
    ref: 'PLT-2025-09341', type: 'Plainte', nature: 'Litige foncier',
    tribunal: 'TGI Dakar', juge: 'Mme Sarr', status: 'progress',
    steps: [
      { title: 'Depot recu',                  sub: '30 avr. 2025 14:22',  done: true   },
      { title: 'Enregistre par le greffe',    sub: '01 mai 2025 09:15',   done: true   },
      { title: 'En instruction — Juge Sarr',  sub: 'Audience : 15 mai 2025', active: true },
      { title: 'Decision rendue',             sub: 'En attente',           done: false  },
    ],
    message: 'Greffe TGI Dakar: Votre dossier est transmis a Mme la Juge Sarr. Presentez-vous le 15 mai a 10h00 avec toutes vos pieces.',
    motifRejet: null,
  },
  {
    ref: 'RDV-2025-04817', type: 'Rendez-vous', nature: 'Dossier civil',
    tribunal: 'TGI Dakar', juge: null, status: 'done',
    steps: [
      { title: 'Demande envoyee',      sub: '01 mai 2025',         done: true },
      { title: 'Valide par le greffe', sub: '02 mai 2025',         done: true },
      { title: 'RDV effectue',         sub: '07 mai 2025 10h00',   done: true },
    ],
    message: null,
    motifRejet: null,
  },
  {
    ref: 'RDV-2025-04810', type: 'Rendez-vous', nature: 'Consultation juridique',
    tribunal: 'TGI Dakar', juge: null, status: 'rejected',
    steps: [
      { title: 'Demande envoyee',  sub: '29 avr. 2025', done: true },
      { title: 'Demande rejetee', sub: '30 avr. 2025', done: true },
    ],
    message: null,
    motifRejet: 'Creneau indisponible pour cette date. Veuillez choisir une autre date ou un autre tribunal. Le greffe vous invite a soumettre une nouvelle demande.',
  },
]

function Tracker({ steps }) {
  return (
    <div className="mt-4 space-y-0">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
              s.done ? 'bg-justice-400' : s.active ? 'bg-gold-400' : 'bg-gray-300'
            }`}>
              {s.done ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-0.5 flex-1 min-h-4 my-1 ${s.done ? 'bg-justice-300' : 'bg-gray-200'}`} />
            )}
          </div>
          <div className="pb-4">
            <p className={`text-sm font-semibold ${s.done || s.active ? 'text-navy-700' : 'text-gray-400'}`}>
              {s.title}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SuiviPage() {
  const [open, setOpen] = useState({ 0: true })

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-700">Mes dossiers</h1>
        <p className="text-gray-500 text-sm mt-1">Suivi en temps reel de vos procedures</p>
      </div>

      <div className="space-y-4">
        {DOSSIERS.map((d, i) => (
          <div key={d.ref} className="card">
            <div className="flex items-start justify-between cursor-pointer"
              onClick={() => setOpen(o => ({...o, [i]: !o[i]}))}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-bold text-navy-700">{d.ref}</span>
                  <Badge status={d.status} />
                </div>
                <p className="text-sm text-gray-600">{d.nature} · {d.tribunal}</p>
                {d.juge && <p className="text-xs text-gray-400 mt-0.5">Juge : {d.juge}</p>}
              </div>
              {open[i]
                ? <FiChevronUp className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                : <FiChevronDown className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              }
            </div>

            {open[i] && (
              <>
                <Tracker steps={d.steps} />

                {d.status === 'rejected' && d.motifRejet && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <FiAlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-bold text-red-600 uppercase tracking-wide">
                        Motif du rejet
                      </span>
                    </div>
                    <p className="text-sm text-red-700 leading-relaxed">{d.motifRejet}</p>
                  </div>
                )}

                {d.message && (
                  <div className="bg-navy-50 border border-navy-100 rounded-xl p-3 mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <FiMessageSquare className="w-4 h-4 text-navy-500" />
                      <span className="text-xs font-bold text-navy-600 uppercase tracking-wide">
                        Message du tribunal
                      </span>
                    </div>
                    <p className="text-sm text-navy-700 leading-relaxed">{d.message}</p>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}