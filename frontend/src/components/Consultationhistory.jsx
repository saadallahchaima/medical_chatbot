import { useState } from 'react'
import {
  Search, Calendar, Trash2, FileText, ChevronDown, ChevronUp,
  Clock, AlertCircle, Stethoscope, Pill, ClipboardList, Sparkles,
  MessageSquare
} from 'lucide-react'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'

export default function ConsultationHistory({
  consultations = [],
  onDeleteConsultation,
  onGenerateReport,
}) {
  const [expandedId, setExpandedId] = useState(null)
  const [searchInput, setSearchInput] = useState('')

  const safeConsultations = Array.isArray(consultations) ? consultations : []

  const filtered = safeConsultations.filter((consult) => {
    const q = searchInput.toLowerCase()
    return (
      consult.query?.toLowerCase().includes(q) ||
      consult.diagnosis?.toLowerCase().includes(q)
    )
  })

  const handleGenerateReport = async (consult) => {
    const toastId = toast.loading('Génération du rapport...')
    try {
      const report = await onGenerateReport(consult.id)
      if (report) {
        const blob = new Blob([report], { type: 'text/markdown' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Rapport_MediAgent_${format(new Date(consult.date), 'dd_MM_yyyy')}.md`
        link.click()
        window.URL.revokeObjectURL(url)
        toast.success('Rapport téléchargé', { id: toastId })
      }
    } catch (e) {
      toast.error('Erreur de génération', { id: toastId })
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Rechercher une consultation..."
          className="w-full bg-white border border-emerald-100 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all shadow-soft"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((consult, index) => (
            <ConsultationCard
              key={consult.id}
              consult={consult}
              index={index}
              expanded={expandedId === consult.id}
              onToggle={() => setExpandedId(expandedId === consult.id ? null : consult.id)}
              onDelete={() => {
                if (window.confirm('Delete cette consultation ?')) {
                  onDeleteConsultation(consult.id)
                }
              }}
              onGenerateReport={() => handleGenerateReport(consult)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
          <Calendar size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-400 text-sm italic">Aucune consultation trouvée</p>
        </div>
      )}
    </div>
  )
}

function ConsultationCard({ consult, index, expanded, onToggle, onDelete, onGenerateReport }) {
  const alertsCount = (consult.alerts || []).length
  const hasDiagnosis = consult.diagnosis && consult.diagnosis !== 'Analyse clinique'

  return (
    <div className="bg-white rounded-2xl border border-emerald-100/60 shadow-soft overflow-hidden transition-all hover:shadow-card">
      {/* Card Header */}
      <div
        className="p-4 cursor-pointer flex items-start justify-between gap-4"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          {/* Query + Badges */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
              <MessageSquare size={13} className="text-white" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 truncate">{consult.query}</h4>
            {alertsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-500 text-[10px] font-bold border border-red-100 flex-shrink-0">
                {alertsCount} ALERTE{alertsCount > 1 ? 'S' : ''}
              </span>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-3 text-[11px] text-slate-400 ml-9">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {format(new Date(consult.date), 'dd MMM yyyy • HH:mm', { locale: enUS })}
            </span>
            {hasDiagnosis && (
              <span className="text-emerald-500 font-medium truncate max-w-[200px]">
                {consult.diagnosis}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onGenerateReport(); }}
            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Générer Rapport"
          >
            <FileText size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
          <div className="ml-1">
            {expanded ? (
              <ChevronUp size={18} className="text-slate-400" />
            ) : (
              <ChevronDown size={18} className="text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50">
          <div className="space-y-4">
            {/* Diagnosis Section */}
            <div className="bg-white rounded-xl p-4 border border-emerald-100/60 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope size={14} className="text-emerald-500" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Diagnostic & Analyse</p>
              </div>
              <div className="text-sm text-slate-700 leading-relaxed">
                {consult.diagnosis || "Aucun diagnostic spécifique extrait."}
              </div>
            </div>

            {/* Treatment Section */}
            {consult.treatment && consult.treatment !== 'Suivi standard' && (
              <div className="bg-white rounded-xl p-4 border border-emerald-100/60 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Pill size={14} className="text-emerald-500" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan de Traitement</p>
                </div>
                <div className="text-sm text-slate-700 leading-relaxed">
                  {consult.treatment}
                </div>
              </div>
            )}

            {/* Full AI Response */}
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-violet-500" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Réponse Complète de l'IA</p>
              </div>
              <div className="prose prose-sm max-w-none text-slate-700 max-h-60 overflow-y-auto bg-slate-50 rounded-lg p-3">
                <ReactMarkdown>
                  {consult.report?.full_response || consult.query}
                </ReactMarkdown>
              </div>
            </div>

            {/* Alerts */}
            {alertsCount > 0 && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-100/60">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={14} className="text-red-500" />
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Alertes Cliniques</p>
                </div>
                <div className="space-y-2">
                  {consult.alerts.map((alert, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-red-700">{alert}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tools Used */}
            {(consult.toolsUsed || []).length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Outils utilisés:</span>
                {consult.toolsUsed.map((t, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100 font-medium"
                  >
                    {t.tool_name}
                  </span>
                ))}
              </div>
            )}

            {/* Files */}
            {consult.files && consult.files.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Fichiers:</span>
                {consult.files.map((f, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-medium"
                  >
                    {f.filename || f.name || `Fichier ${i + 1}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

