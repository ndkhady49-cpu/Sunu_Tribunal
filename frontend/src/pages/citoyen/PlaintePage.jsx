import { useState } from 'react'
import { FiUpload, FiCheckCircle, FiFile, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'

const NATURES = [
  'Agression physique', 'Escroquerie / Fraude', 'Litige foncier',
  'Violence domestique', 'Cybercriminalité', 'Autre',
]

const STEPS = ["Identification", "Faits", "Preuves", "Validation"]

export default function PlaintePage() {
  const [step,    setStep]    = useState(0)
  const [files,   setFiles]   = useState([])
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nature: '', description: '', tribunal: '', plaignant: '', cni: '', telephone: '',
  })
  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files)
    setFiles(f => [...f, ...newFiles])
  }

  const submit = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    const ref = 'PLT-2025-0' + Math.floor(9300 + Math.random() * 100)
    setSuccess(ref)
    setLoading(false)
    toast.success('Plainte enregistrée !')
  }

  if (success) return (
    <div className="p-4 lg:p-6 max-w-lg mx-auto">
      <div className="card text-center py-10">
        <FiCheckCircle className="w-16 h-16 text-justice-500 mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold text-navy-700 mb-2">Plainte enregistrée !</h2>
        <p className="font-mono text-lg font-bold text-navy-700 bg-gray-50 px-4 py-2 rounded-xl inline-block mb-4">{success}</p>
        <p className="text-sm text-gray-500 mb-6">Vous serez notifié à chaque étape de la procédure</p>
        <div className="bg-justice-50 rounded-xl p-3 text-sm text-justice-600 flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-justice-400 animate-blink" />
          Le greffe examinera votre dossier sous 48h
        </div>
        <button className="btn-ghost w-full" onClick={() => { setSuccess(null); setStep(0); setFiles([]) }}>
          Déposer une nouvelle plainte
        </button>
      </div>
    </div>
  )

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-700">Déposer une plainte</h1>
        <p className="text-gray-500 text-sm mt-1">Procédure sécurisée et confidentielle</p>
      </div>

      {/* Steps */}
      <div className="flex mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < step  ? 'bg-justice-400 text-white' :
              i === step ? 'bg-navy-700 text-white' :
                           'bg-gray-200 text-gray-500'
            }`}>{i < step ? '✓' : i + 1}</div>
            <p className={`text-xs mt-1 font-medium ${i === step ? 'text-navy-700' : 'text-gray-400'}`}>{s}</p>
          </div>
        ))}
      </div>

      {/* Step 0: Identification */}
      {step === 0 && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-navy-700">Vos informations</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nom complet</label>
              <input className="form-input" placeholder="Abdoulaye Diallo"
                value={form.plaignant} onChange={e => set('plaignant',e.target.value)} />
            </div>
            <div>
              <label className="form-label">N° CNI</label>
              <input className="form-input" placeholder="1 2345678901234"
                value={form.cni} onChange={e => set('cni',e.target.value)} />
            </div>
          </div>
          <div>
            <label className="form-label">Téléphone</label>
            <input className="form-input" placeholder="+221 77 000 00 00"
              value={form.telephone} onChange={e => set('telephone',e.target.value)} />
          </div>
          <button className="btn-primary w-full" onClick={() => setStep(1)}>Suivant →</button>
        </div>
      )}

      {/* Step 1: Faits */}
      {step === 1 && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-navy-700">Description des faits</h3>
          <div>
            <label className="form-label">Nature de l'infraction</label>
            <select className="form-select" value={form.nature} onChange={e => set('nature',e.target.value)} required>
              <option value="">Sélectionner...</option>
              {NATURES.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Description détaillée des faits</label>
            <textarea className="form-input" rows={6}
              placeholder="Décrivez précisément : date, lieu, circonstances, personnes impliquées..."
              value={form.description} onChange={e => set('description',e.target.value)} />
          </div>
          <div>
            <label className="form-label">Tribunal compétent</label>
            <select className="form-select" value={form.tribunal} onChange={e => set('tribunal',e.target.value)}>
              <option value="">Sélectionner...</option>
              <option>TGI Dakar – Plateau</option>
              <option>Tribunal de Pikine</option>
              <option>Tribunal de Commerce</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setStep(0)}>← Retour</button>
            <button className="btn-primary flex-1" onClick={() => setStep(2)}>Suivant →</button>
          </div>
        </div>
      )}

      {/* Step 2: Preuves */}
      {step === 2 && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-navy-700">Pièces justificatives</h3>
          <label className="block border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-justice-400 hover:bg-justice-50 transition-colors">
            <input type="file" multiple className="hidden" onChange={handleFiles}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="font-semibold text-gray-700">Glissez vos fichiers ici</p>
            <p className="text-sm text-gray-500 mt-1">PDF, JPG, PNG, DOC · Max 10 Mo chacun</p>
          </label>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <FiFile className="w-4 h-4 text-navy-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-gray-400">{(f.size/1024).toFixed(0)} Ko</span>
                  <button onClick={() => setFiles(files.filter((_,j) => j!==i))}>
                    <FiX className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setStep(1)}>← Retour</button>
            <button className="btn-primary flex-1" onClick={() => setStep(3)}>Suivant →</button>
          </div>
        </div>
      )}

      {/* Step 3: Validation */}
      {step === 3 && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-navy-700">Récapitulatif & confirmation</h3>
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Nature</span><span className="font-semibold">{form.nature}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tribunal</span><span className="font-semibold">{form.tribunal || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Pièces jointes</span><span className="font-semibold">{files.length} fichier(s)</span></div>
          </div>
          <div className="bg-gold-50 border border-gold-100 rounded-xl p-3 text-xs text-amber-700">
            En soumettant cette plainte, vous certifiez que les informations fournies sont exactes et sincères.
          </div>
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setStep(2)}>← Retour</button>
            <button className="btn-justice flex-1 py-3 font-bold" onClick={submit} disabled={loading}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi…
                  </span>
                : '📤 Soumettre la plainte'
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
