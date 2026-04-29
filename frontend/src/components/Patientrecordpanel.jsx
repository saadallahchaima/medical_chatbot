import { useState } from 'react'
import {
  FileText, Download, TrendingUp, AlertTriangle,
  Calendar, Activity, User, X, ChevronRight, Heart,
  Pill, ClipboardList, Stethoscope, Clock, ShieldAlert
} from 'lucide-react'
import { usePatientRecord } from '../hooks/usePatientRecord'
import { useSession } from '../hooks/useSession'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'

// Sous-composants
import ConsultationHistory from './Consultationhistory'
import EvolutionChart from './EvolutionChart'
import AlertsTimeline from './AlertsTimeline'
import PDFExportModal from './PDFExportModal'

const TABS = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
  { id: 'history', label: 'History', icon: Calendar },
  { id: 'evolution', label: 'Evolution', icon: TrendingUp },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
]

export default function PatientRecordPanel({ onClose }) {
  const { patientContext } = useSession()
  const patientId = patientContext?.id || 'default'

  const {
    record,
    consultations,
    scoreEvolution,
    alerts,
    deleteConsultation,
    markAlertAsRead,
    generateReport,
    getStats,
  } = usePatientRecord(patientId)

  const [activeTab, setActiveTab] = useState('overview')
  const [showExportModal, setShowExportModal] = useState(false)

  const stats = getStats()
  const unreadAlertsCount = alerts.filter((a) => !a.read).length

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20 text-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-emerald-100/60 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)' }}
          >
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">Patient Record</h2>
            <p className="text-[11px] text-slate-400">
              {patientContext?.age ? `${patientContext.age} yo` : 'Age not specified'}
              {patientContext?.sex ? ` • ${patientContext.sex === 'M' ? 'Male' : patientContext.sex === 'F' ? 'Female' : patientContext.sex}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            disabled={consultations.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-200 transition-all disabled:opacity-30 shadow-sm"
          >
            <Download size={14} /> Export PDF
          </button>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 px-4 sm:px-5 py-3 bg-white/60 backdrop-blur-sm border-b border-emerald-100/40">
        <StatCard
          label="Consultations"
          value={stats.totalConsultations}
          icon={Stethoscope}
          color="from-emerald-400 to-emerald-500"
        />
        <StatCard
          label="Alerts"
          value={unreadAlertsCount}
          icon={ShieldAlert}
          color={unreadAlertsCount > 0 ? "from-red-400 to-red-500" : "from-emerald-400 to-emerald-500"}
        />
        <StatCard
          label="Scores"
          value={scoreEvolution.length}
          icon={Activity}
          color="from-violet-400 to-violet-500"
        />
        <StatCard
          label="Follow-up (Days)"
          value={stats.dateRange ? calculateDaysDiff(stats.dateRange.first, stats.dateRange.last) : 1}
          icon={Clock}
          color="from-amber-400 to-amber-500"
        />
      </div>

      {/* Patient Info Card */}
      <div className="px-4 sm:px-5 py-3">
        <div className="bg-white rounded-2xl p-4 border border-emerald-100/60 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={14} className="text-rose-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Patient Information</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoField label="Name" value={record?.name || patientContext?.name || 'Not specified'} icon={User} />
            <InfoField label="Age" value={patientContext?.age ? `${patientContext.age} yo` : '--'} icon={Calendar} />
            <InfoField label="Sex" value={patientContext?.sex === 'M' ? 'Male' : patientContext?.sex === 'F' ? 'Female' : '--'} icon={User} />
            <InfoField label="Weight" value={patientContext?.weight_kg ? `${patientContext.weight_kg} kg` : '--'} icon={Activity} />
          </div>
          {(patientContext?.allergies?.length > 0 || patientContext?.current_medications?.length > 0) && (
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 gap-2">
              {patientContext?.allergies?.length > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />
                  <span className="text-xs text-red-600 font-medium">
                    Allergies: {patientContext.allergies.join(', ')}
                  </span>
                </div>
              )}
              {patientContext?.current_medications?.length > 0 && (
                <div className="flex items-center gap-2">
                  <Pill size={12} className="text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-emerald-600 font-medium">
                    Treatment: {patientContext.current_medications.join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 sm:px-5 pt-2 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 text-[11px] sm:text-xs font-bold tracking-wider uppercase rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600 bg-white shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-white/50'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 bg-white/40">
        {activeTab === 'overview' && (
          <OverviewTab
            consultations={consultations.slice(0, 3)}
            alerts={alerts.filter(a => !a.read).slice(0, 3)}
            onViewAll={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'history' && (
          <ConsultationHistory
            consultations={consultations}
            onDeleteConsultation={deleteConsultation}
            onGenerateReport={generateReport}
          />
        )}

        {activeTab === 'evolution' && (
          <EvolutionChart scoreEvolution={scoreEvolution} />
        )}

        {activeTab === 'alerts' && (
          <AlertsTimeline alerts={alerts} onMarkAsRead={markAlertAsRead} />
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <PDFExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          patientData={{ ...patientContext, consultations }}
        />
      )}
    </div>
  )
}

// ── STAT CARD ──
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-emerald-100/60 shadow-sm flex items-center gap-2 sm:gap-3">
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-sm flex-shrink-0`}>
        <Icon size={14} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}</p>
        <p className="text-base sm:text-lg font-bold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

// ── INFO FIELD ──
function InfoField({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
      <Icon size={12} className="text-slate-400 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 font-medium">{label}</p>
        <p className="text-xs font-semibold text-slate-700 truncate">{value}</p>
      </div>
    </div>
  )
}

// ── OVERVIEW TAB ──
function OverviewTab({ consultations, alerts, onViewAll }) {
  return (
    <div className="space-y-4">
      {/* Recent Consultations */}
      <section className="bg-white rounded-2xl p-4 border border-emerald-100/60 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-700">Recent Consultations</h3>
          </div>
          <button 
            onClick={() => onViewAll('history')} 
            className="text-xs text-emerald-500 hover:text-emerald-600 font-medium flex items-center gap-1"
          >
            View all <ChevronRight size={12} />
          </button>
        </div>

        <div className="space-y-2">
          {consultations.length > 0 ? consultations.map((c) => (
            <div
              key={c.id}
              onClick={() => onViewAll('history')}
              className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-transparent hover:border-emerald-200 cursor-pointer transition-all group"
            >
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm text-slate-700 font-medium line-clamp-2">{c.query}</p>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-400 flex-shrink-0 mt-0.5 transition-colors" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {format(new Date(c.date), 'dd MMMM yyyy', { locale: enUS })}
              </p>
            </div>
          )) : (
            <p className="text-sm text-slate-400 italic text-center py-4">No consultations recorded</p>
          )}
        </div>
      </section>

      {/* Recent Alerts */}
      <section className="bg-white rounded-2xl p-4 border border-emerald-100/60 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert size={16} className="text-red-400" />
          <h3 className="text-sm font-bold text-slate-700">Recent Alerts</h3>
        </div>
        <div className="space-y-2">
          {alerts.length > 0 ? alerts.map((a) => (
            <div key={a.id} className="p-3 rounded-xl bg-red-50/60 border border-red-100 flex gap-3">
              <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-700 leading-relaxed">{a.message}</p>
                <p className="text-[10px] text-red-400 mt-1">{format(new Date(a.date), 'p', { locale: enUS })}</p>
              </div>
            </div>
          )) : (
            <p className="text-sm text-slate-400 italic text-center py-4">No active alerts</p>
          )}
        </div>
      </section>
    </div>
  )
}

function calculateDaysDiff(start, end) {
  try {
    const diff = new Date(end) - new Date(start)
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  } catch (e) {
    return 1
  }
}

