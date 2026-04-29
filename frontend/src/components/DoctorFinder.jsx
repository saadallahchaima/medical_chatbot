import { useState, useEffect, useRef } from 'react'
import {
  MapPin, Search, Phone, Globe, Clock, Loader2,
  ChevronDown, ExternalLink, X, RefreshCw, AlertCircle, Stethoscope, Navigation, MapPinned
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const SPECIALTIES = [
  { key: 'general_practitioner', fr: 'Médecin généraliste', emoji: '🩺' },
  { key: 'cardiologist',         fr: 'Cardiologue',          emoji: '🫀' },
  { key: 'neurologist',          fr: 'Neurologue',           emoji: '🧠' },
  { key: 'pulmonologist',        fr: 'Pneumologue',          emoji: '🫁' },
  { key: 'endocrinologist',      fr: 'Endocrinologue',       emoji: '⚗️' },
  { key: 'gastroenterologist',   fr: 'Gastro-entérologue',   emoji: '🔬' },
  { key: 'psychiatrist',         fr: 'Psychiatre',           emoji: '🧘' },
  { key: 'psychologist',         fr: 'Psychologue',          emoji: '💬' },
  { key: 'dermatologist',        fr: 'Dermatologue',         emoji: '🔵' },
  { key: 'orthopedist',          fr: 'Orthopédiste',         emoji: '🦴' },
  { key: 'rheumatologist',       fr: 'Rhumatologue',         emoji: '🦿' },
  { key: 'ophthalmologist',      fr: 'Ophtalmologue',        emoji: '👁️' },
  { key: 'otolaryngologist',     fr: 'ORL',                  emoji: '👂' },
  { key: 'gynecologist',         fr: 'Gynécologue',          emoji: '🌸' },
  { key: 'urologist',            fr: 'Urologue',             emoji: '💧' },
  { key: 'nephrologist',         fr: 'Néphrologue',          emoji: '🫘' },
  { key: 'oncologist',           fr: 'Oncologue',            emoji: '🎗️' },
]

function normalizeKey(key) {
  if (!key) return 'general_practitioner'
  const map = {
    general: 'general_practitioner',
    cardiology: 'cardiologist',
    neurology: 'neurologist',
    pulmonology: 'pulmonologist',
    endocrinology: 'endocrinologist',
    gastroenterology: 'gastroenterologist',
    psychiatry: 'psychiatrist',
    psychology: 'psychologist',
    dermatology: 'dermatologist',
    orthopedics: 'orthopedist',
    rheumatology: 'rheumatologist',
    ophthalmology: 'ophthalmologist',
    otolaryngology: 'otolaryngologist',
    gynecology: 'gynecologist',
    urology: 'urologist',
    nephrology: 'nephrologist',
    oncology: 'oncologist',
  }
  return map[key] || key
}

function fmt(m) {
  if (!m && m !== 0) return ''
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`
}

function LeafletMap({ userLocation, doctors, selectedId, onSelect }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return
      const L = window.L
      if (!L) return
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true })
      mapInstanceRef.current = map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)
    }
    if (window.L) { initMap() } else {
      const s = document.createElement('script')
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      s.onload = initMap
      document.head.appendChild(s)
    }
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    const L = window.L
    if (!map || !L || !userLocation) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // User marker with pulse effect
    markersRef.current.push(
      L.marker([userLocation.lat, userLocation.lon], {
        icon: L.divIcon({
          html: `<div class="pulse-marker-green" style="width:20px;height:20px;background:#10B981;border-radius:50%;border:3px solid white;box-shadow:0 4px 15px rgba(16,185,129,0.5)"></div>`,
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })
      }).addTo(map).bindPopup('<b>📍 Votre position</b>')
    )

    // Doctor markers
    doctors.forEach((doc, i) => {
      const sel = doc.id === selectedId
      const sz = sel ? 38 : 30
      const bg = sel ? '#10B981' : '#14B8A6'
      
      markersRef.current.push(
        L.marker([doc.lat, doc.lon], {
          icon: L.divIcon({
            html: `<div style="background:${bg};color:white;border-radius:50% 50% 50% 0;width:${sz}px;height:${sz}px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:${sel ? 14 : 11}px;border:3px solid white;box-shadow:0 4px 15px rgba(16,185,129,0.4);transform:rotate(-45deg);transition:all 0.3s"><span style="transform:rotate(45deg)">${i + 1}</span></div>`,
            className: '',
            iconSize: [sz, sz],
            iconAnchor: [sz / 2, sz],
          })
        })
          .addTo(map)
          .bindPopup(`<div style="font-family:system-ui;min-width:200px;font-size:13px"><b>${doc.name}</b>${doc.address ? `<br><small style="color:#555">📍 ${doc.address}</small>` : ''}${doc.phone ? `<br><small>📞 <a href="tel:${doc.phone}">${doc.phone}</a></small>` : ''}<br><small style="color:#888">🚶 ${fmt(doc.distance_m)}</small><br><a href="${doc.google_maps_url}" target="_blank" style="color:#10B981;font-size:11px;text-decoration:none">Ouvrir dans Maps →</a></div>`)
          .on('click', () => onSelect(doc.id))
      )
    })

    const pts = [[userLocation.lat, userLocation.lon], ...doctors.map(d => [d.lat, d.lon])]
    if (doctors.length > 0) map.fitBounds(pts, { padding: [50, 50] })
    else map.setView([userLocation.lat, userLocation.lon], 14)
  }, [doctors, userLocation, selectedId])

  return (
    <>
      <style>{`
        .pulse-marker-green {
          animation: pulseMarkerGreen 2s ease-in-out infinite;
        }
        @keyframes pulseMarkerGreen {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 4px 15px rgba(16,185,129,0.5);
          }
          50% {
            transform: scale(1.2);
            box-shadow: 0 4px 25px rgba(16,185,129,0.8);
          }
        }
      `}</style>
      <div ref={mapRef} className="w-full h-[280px] sm:h-[350px] rounded-2xl overflow-hidden border-2 border-emerald-100 shadow-card" />
    </>
  )
}

function DoctorCard({ doc, index, isSelected, onSelect }) {
  const sp = SPECIALTIES.find(s => s.key === doc.specialty)
  const medalColors = [
    'from-amber-400 to-orange-500',
    'from-slate-300 to-slate-400',
    'from-amber-600 to-amber-700'
  ]

  return (
    <div
      onClick={() => onSelect(doc.id)}
      className={`bg-white rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:shadow-card-hover ${
        isSelected ? 'ring-2 ring-emerald-400 shadow-emerald-lg scale-[1.02]' : 'shadow-soft'
      }`}
      style={{
        background: isSelected
          ? 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(20,184,166,0.06) 100%)'
          : '#ffffff'
      }}
    >
      <div className="flex items-start gap-3">
        {/* Medal/Rank */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm ${
            index < 3 ? `bg-gradient-to-br ${medalColors[index]} text-white` : 'bg-slate-100 text-slate-500'
          }`}
        >
          {index + 1}
        </div>

        {/* Specialty Icon */}
        <span className="text-2xl flex-shrink-0">{sp?.emoji || '🏥'}</span>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-sm font-bold text-slate-800 truncate">{doc.name}</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border border-emerald-200">
              {fmt(doc.distance_m)}
            </span>
          </div>

          {doc.address && (
            <div className="flex items-start gap-1.5 mb-1.5">
              <MapPin size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-slate-600 leading-relaxed">{doc.address}</span>
            </div>
          )}

          {doc.phone && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <Phone size={12} className="text-slate-400" />
              <a
                href={`tel:${doc.phone}`}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                onClick={e => e.stopPropagation()}
              >
                {doc.phone}
              </a>
            </div>
          )}

          {doc.opening_hours && (
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={12} className="text-slate-400" />
              <span className="text-xs text-slate-500">{doc.opening_hours}</span>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <a
              href={doc.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm"
            >
              <Navigation size={10} />
              Itinéraire
            </a>
            {doc.website && (
              <a
                href={doc.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 transition-all shadow-sm"
              >
                <Globe size={10} />
                Site web
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DoctorFinder({ initialSpecialty = null, onClose }) {
  const [location, setLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [isGeolocating, setIsGeolocating] = useState(false)
  const [specialty, setSpecialty] = useState(normalizeKey(initialSpecialty))
  const [radius, setRadius] = useState(5000)
  const [doctors, setDoctors] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [manualAddress, setManualAddress] = useState('')
  const [isGeocoding, setIsGeocoding] = useState(false)

  useEffect(() => { geolocate() }, [])
  useEffect(() => { if (initialSpecialty) setSpecialty(normalizeKey(initialSpecialty)) }, [initialSpecialty])

  const geolocate = async () => {
    setIsGeolocating(true)
    setLocationError(null)

    // 1. Try browser geolocation first
    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 60000
          })
        })
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setIsGeolocating(false)
        return
      } catch (err) {
        console.log('Browser geolocation failed:', err)
        // Continue to fallback
      }
    }

    // 2. Fallback: IP-based geolocation
    try {
      const res = await fetch('https://ipapi.co/json/')
      if (res.ok) {
        const data = await res.json()
        if (data.latitude && data.longitude) {
          setLocation({ lat: data.latitude, lon: data.longitude })
          setStatusMsg(`Position estimée: ${data.city}, ${data.country_name}`)
          setIsGeolocating(false)
          return
        }
      }
    } catch (e) {
      console.log('IP geolocation failed:', e)
    }

    // 3. Final fallback: show error with manual input option
    setIsGeolocating(false)
    setLocationError('Position indisponible — entrez une ville manuellement')
  }

  const geocodeManual = async () => {
    if (!manualAddress.trim()) return
    setIsGeocoding(true)
    setLocationError(null)
    try {
      const res = await fetch(`${API_BASE}/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: manualAddress.trim() })
      })
      if (!res.ok) throw new Error('Ville non trouvée')
      const data = await res.json()
      setLocation({ lat: data.lat, lon: data.lon })
      setStatusMsg(`Position: ${data.location}`)
    } catch (e) {
      setLocationError(`Erreur: ${e.message}`)
    } finally {
      setIsGeocoding(false)
    }
  }

  const search = async () => {
    if (!location) {
      geolocate()
      return
    }
    setIsSearching(true)
    setDoctors([])
    setSearched(false)
    setSelectedId(null)
    setStatusMsg('Recherche en cours...')
    try {
      const p = new URLSearchParams({
        lat: location.lat,
        lon: location.lon,
        specialty,
        radius,
        limit: 15
      })
      const res = await fetch(`${API_BASE}/doctors/nearby?${p}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const docs = data.doctors || []
      setDoctors(docs)
      setSelectedId(docs[0]?.id || null)
      setStatusMsg(
        docs.length > 0
          ? `${docs.length} médecin${docs.length > 1 ? 's' : ''} trouvé${docs.length > 1 ? 's' : ''}`
          : 'Aucun résultat — essayez un rayon plus grand'
      )
    } catch (e) {
      setStatusMsg(`Erreur: ${e.message}`)
      setDoctors([])
    } finally {
      setIsSearching(false)
      setSearched(true)
    }
  }

  const currentSp = SPECIALTIES.find(s => s.key === specialty) || SPECIALTIES[0]

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-emerald-100/60 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-2xl pulse-ring flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)' }}
          >
            <MapPin size={18} className="text-white heartbeat" />
          </div>
          <div>
            <div className="text-base font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Médecins à proximité
            </div>
            <div className="text-xs text-slate-400">Recherche via OpenStreetMap</div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 sm:p-5 border-b border-emerald-100/60 flex-shrink-0 space-y-3">
        {/* GPS Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {isGeolocating ? (
              <>
                <Loader2 size={14} className="animate-spin text-emerald-500" />
                <span className="text-xs text-slate-600">Localisation...</span>
              </>
            ) : location ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-ring" />
                <span className="text-xs text-emerald-600 font-medium truncate">
                  Position acquise · {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                </span>
                <button
                  onClick={geolocate}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors flex-shrink-0"
                >
                  <RefreshCw size={12} />
                </button>
              </>
            ) : locationError ? (
              <>
                <AlertCircle size={14} className="text-rose-500 flex-shrink-0" />
                <span className="text-xs text-rose-600">{locationError}</span>
              </>
            ) : null}
          </div>

          {/* Manual address input */}
          {!location && (
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <MapPinned size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={manualAddress}
                  onChange={e => setManualAddress(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && geocodeManual()}
                  placeholder="Paris, Lyon, Marseille..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-emerald-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-400 transition-colors shadow-soft"
                />
              </div>
              <button
                onClick={geocodeManual}
                disabled={isGeocoding || !manualAddress.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5 flex-shrink-0"
              >
                {isGeocoding ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
                <span className="hidden sm:inline">Localiser</span>
              </button>
            </div>
          )}
        </div>

        {/* Specialty + Radius */}
        <div className="flex gap-2 flex-col sm:flex-row">
          <div className="relative flex-1">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-white border border-emerald-200 hover:border-emerald-300 transition-colors shadow-soft"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{currentSp.emoji}</span>
                <span className="text-sm font-medium text-slate-700">{currentSp.fr}</span>
              </div>
              <ChevronDown
                size={14}
                className="text-slate-400 transition-transform"
                style={{ transform: showPicker ? 'rotate(180deg)' : '' }}
              />
            </button>
            {showPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl overflow-y-auto bg-white border border-emerald-200 shadow-xl max-h-[250px]">
                  {SPECIALTIES.map(s => (
                    <button
                      key={s.key}
                      onClick={() => {
                        setSpecialty(s.key)
                        setShowPicker(false)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-emerald-50 transition-colors text-left"
                    >
                      <span className="text-lg">{s.emoji}</span>
                      <span className={`text-sm ${s.key === specialty ? 'font-bold text-emerald-600' : 'text-slate-700'}`}>
                        {s.fr}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <select
            value={radius}
            onChange={e => setRadius(Number(e.target.value))}
            className="px-4 py-2.5 rounded-xl bg-white border border-emerald-200 text-sm text-slate-700 font-medium focus:outline-none focus:border-emerald-400 transition-colors shadow-soft"
          >
            <option value={1000}>1 km</option>
            <option value={2000}>2 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
            <option value={20000}>20 km</option>
          </select>
        </div>

        {/* Search Button */}
        <button
          onClick={search}
          disabled={isSearching || isGeolocating}
          className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white shadow-emerald hover:shadow-emerald-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: isSearching
              ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
              : 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)'
          }}
        >
          {isSearching ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Recherche...
            </>
          ) : (
            <>
              <Search size={16} />
              Rechercher
            </>
          )}
        </button>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`text-xs text-center py-2 px-3 rounded-xl ${
              doctors.length > 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-50 text-slate-600 border border-slate-200'
            }`}
          >
            {statusMsg}
          </div>
        )}
      </div>

      {/* Map + Results */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {location && (
          <LeafletMap
            userLocation={location}
            doctors={doctors}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}

        {searched && doctors.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <Stethoscope size={36} className="text-slate-300 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Aucun résultat trouvé</p>
              <p className="text-xs text-slate-400">Essayez d'augmenter le rayon de recherche</p>
            </div>
          </div>
        )}

        {doctors.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-medium text-slate-500 px-1">
              {doctors.length} établissement{doctors.length > 1 ? 's' : ''} trouvé{doctors.length > 1 ? 's' : ''}
            </div>
            {doctors.map((doc, i) => (
              <DoctorCard
                key={doc.id || i}
                doc={doc}
                index={i}
                isSelected={doc.id === selectedId}
                onSelect={setSelectedId}
              />
            ))}
            <p className="text-xs text-center text-slate-400 pt-4">
              Données © OpenStreetMap contributors
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

