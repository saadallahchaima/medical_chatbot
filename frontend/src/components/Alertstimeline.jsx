import { AlertTriangle, CheckCircle, Info, AlertOctagon } from 'lucide-react'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertOctagon,
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
    label: 'Critique',
  },
  warning: {
    icon: AlertTriangle,
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
    label: 'Attention',
  },
  info: {
    icon: Info,
    color: '#10b981',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    label: 'Info',
  },
}

export default function AlertsTimeline({ alerts, onMarkAsRead }) {
  const sortedAlerts = [...alerts].sort((a, b) => new Date(b.date) - new Date(a.date))
  const unreadCount = alerts.filter((a) => !a.read).length

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-emerald-100/60 shadow-soft">
        <CheckCircle size={32} className="mx-auto mb-3 text-emerald-400" />
        <p className="text-sm text-slate-500">No alerts active</p>
        <p className="text-xs text-slate-400 mt-1">
          Les alertes critiques seront affichées ici automatiquement
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-emerald-100/60 p-4 sm:p-5 shadow-soft">
      {/* Header stats */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {alerts.length} alerte{alerts.length > 1 ? 's' : ''} au total
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {unreadCount > 0 ? (
              <span className="text-red-500 font-medium">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </span>
            ) : (
              'Toutes les alertes ont été lues'
            )}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => {
              alerts.forEach((alert) => {
                if (!alert.read) onMarkAsRead(alert.id)
              })
            }}
            className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-medium border border-emerald-200 hover:bg-emerald-100 transition-all"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-emerald-100" />

        {/* Alerts */}
        <div className="flex flex-col gap-4">
          {sortedAlerts.map((alert, index) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onMarkAsRead={() => onMarkAsRead(alert.id)}
              isLast={index === sortedAlerts.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function AlertCard({ alert, onMarkAsRead }) {
  const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info
  const Icon = config.icon

  return (
    <div className="relative pl-12">
      {/* Timeline dot */}
      <div
        className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-2"
        style={{
          background: alert.read ? '#f1f5f9' : config.bg,
          borderColor: alert.read ? '#e2e8f0' : config.color,
        }}
      >
        <Icon size={14} style={{ color: alert.read ? '#94a3b8' : config.color }} />
      </div>

      {/* Card */}
      <div
        className="rounded-xl px-4 py-3 transition-all"
        style={{
          background: alert.read ? '#f8fafc' : config.bg,
          border: `1px solid ${alert.read ? '#f1f5f9' : config.border}`,
          opacity: alert.read ? 0.7 : 1,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2 py-0.5 rounded-lg text-xs font-medium"
              style={{
                background: config.bg,
                color: config.color,
                border: `1px solid ${config.border}`,
              }}
            >
              {config.label}
            </span>
            <span className="text-[11px] text-slate-400">
              {format(new Date(alert.date), 'dd MMMM yyyy · HH:mm', { locale: enUS })}
            </span>
          </div>

          {!alert.read && (
            <button
              onClick={onMarkAsRead}
              className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[11px] font-medium border border-emerald-200 hover:bg-emerald-100 transition-all"
            >
              Marquer comme lu
            </button>
          )}
        </div>

        {/* Message */}
        <p className="text-[13px] text-slate-700 leading-relaxed">
          {alert.message}
        </p>

        {/* Footer metadata */}
        {alert.consultationId && (
          <div className="text-[10px] text-slate-400 mt-2">
            Consultation: {alert.consultationId.substring(0, 12)}...
          </div>
        )}
      </div>
    </div>
  )
}
