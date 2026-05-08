import { useEffect, useRef, useState } from 'react'
import { FiNavigation, FiPhone, FiClock } from 'react-icons/fi'

const TRIBUNAUX = [
  { id:1, nom:'TGI Dakar – Plateau',        adresse:'Av. Léopold Sédar Senghor', tel:'+221 33 889 10 00', heures:'Lun–Ven · 08h–17h', lat:14.6979, lng:-17.4380, dist:'0.8 km' },
  { id:2, nom:'Tribunal de Commerce',        adresse:'Rue Carnot, Dakar Plateau', tel:'+221 33 823 24 10', heures:'Lun–Ven · 08h–17h', lat:14.6938, lng:-17.4400, dist:'1.4 km' },
  { id:3, nom:'Tribunal Régional de Pikine', adresse:'Route de Pikine, Dakar',    tel:'+221 33 834 07 52', heures:'Lun–Ven · 08h–16h', lat:14.7522, lng:-17.3920, dist:'8.2 km' },
  { id:4, nom:"TGI Saint-Louis",             adresse:"Centre-ville, Saint-Louis", tel:'+221 33 961 14 00', heures:'Lun–Ven · 08h–17h', lat:16.0179, lng:-16.4897, dist:'265 km' },
]

export default function CartePage() {
  const mapRef     = useRef(null)
  const mapInst    = useRef(null)
  const [selected, setSelected] = useState(null)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    if (mapInst.current) return
    import('leaflet').then(L => {
      mapInst.current = L.map(mapRef.current, {
        center: [14.6928, -17.4467], zoom: 12
      })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInst.current)

      TRIBUNAUX.forEach(t => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:#0d1f3c;color:#fff;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #c9a227;display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:11px;font-weight:800;">⚖</span></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        })
        L.marker([t.lat, t.lng], { icon })
          .addTo(mapInst.current)
          .bindPopup(`<strong>${t.nom}</strong><br/>${t.adresse}`)
      })
    })
    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null } }
  }, [])

  const filtered = TRIBUNAUX.filter(t =>
    t.nom.toLowerCase().includes(search.toLowerCase()) ||
    t.adresse.toLowerCase().includes(search.toLowerCase())
  )

  const flyTo = (t) => {
    setSelected(t.id)
    mapInst.current?.flyTo([t.lat, t.lng], 15, { duration: 1 })
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold text-navy-700">Localisation des tribunaux</h1>
        <p className="text-gray-500 text-sm mt-1">Trouvez le tribunal le plus proche</p>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 mb-4 shadow-card" style={{ height: 280 }}>
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      </div>

      {/* Search */}
      <input className="form-input mb-4" placeholder="🔍 Rechercher un tribunal..."
        value={search} onChange={e => setSearch(e.target.value)} />

      {/* List */}
      <div className="space-y-3">
        {filtered.map(t => (
          <div key={t.id}
            onClick={() => flyTo(t)}
            className={`card cursor-pointer transition-all ${
              selected === t.id ? 'border-navy-700 ring-1 ring-navy-700' : 'hover:shadow-card-hover'
            }`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-justice-400" />
                  <h3 className="font-semibold text-navy-700 text-sm">{t.nom}</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-4">{t.adresse}</p>
              </div>
              <span className="text-xs font-semibold text-justice-500 bg-justice-50 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                {t.dist}
              </span>
            </div>
            <div className="flex items-center gap-4 ml-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><FiPhone className="w-3 h-3" />{t.tel}</span>
              <span className="flex items-center gap-1"><FiClock className="w-3 h-3" />{t.heures}</span>
            </div>
            <div className="flex gap-2 mt-3 ml-4">
              <a href={`https://maps.google.com/?q=${t.lat},${t.lng}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-navy-700 bg-navy-50 px-3 py-1.5 rounded-lg hover:bg-navy-100 transition-colors"
                onClick={e => e.stopPropagation()}>
                <FiNavigation className="w-3 h-3" /> Itinéraire
              </a>
              <a href={`tel:${t.tel}`}
                className="flex items-center gap-1.5 text-xs font-semibold text-justice-600 bg-justice-50 px-3 py-1.5 rounded-lg hover:bg-justice-100 transition-colors"
                onClick={e => e.stopPropagation()}>
                <FiPhone className="w-3 h-3" /> Appeler
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
