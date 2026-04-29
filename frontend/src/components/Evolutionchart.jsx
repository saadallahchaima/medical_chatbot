import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart
} from 'recharts'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'

const SCORE_COLORS = {
  'CHADS2-VASc': '#10b981',
  'CURB-65': '#f59e0b',
  'Wells': '#14b8a6',
  'qSOFA': '#ef4444',
  'CHA2DS2-VASc': '#10b981',
  'default': '#8b5cf6',
}

export default function EvolutionChart({ scoreEvolution, consultations }) {
  const [selectedScore, setSelectedScore] = useState('all')

  // Extraire tous les noms de scores uniques
  const allScoreNames = [...new Set(
    scoreEvolution.flatMap((ev) => ev.scores.map((s) => s.name))
  )]

  // Préparer les données pour le graphique
  const chartData = scoreEvolution.map((ev) => {
    const dataPoint = {
      date: format(new Date(ev.date), 'dd/MM/yy'),
      fullDate: ev.date,
    }

    ev.scores.forEach((score) => {
      dataPoint[score.name] = score.value
    })

    return dataPoint
  })

  // Filtrer par score si sélectionné
  const filteredScoreNames = selectedScore === 'all'
    ? allScoreNames
    : [selectedScore]

  // Calculer les tendances
  const trends = calculateTrends(scoreEvolution, allScoreNames)

  if (scoreEvolution.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-emerald-100/60 shadow-soft">
        <Activity size={32} className="mx-auto mb-3 text-slate-300" />
        <p className="text-sm text-slate-500">Aucune donnée d'évolution disponible</p>
        <p className="text-xs text-slate-400 mt-1">
          Les scores de risque seront suivis automatiquement lors des consultations
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Score selector */}
      <div className="bg-white rounded-xl p-4 border border-emerald-100/60 shadow-soft flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Afficher:</span>
        <select
          value={selectedScore}
          onChange={(e) => setSelectedScore(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all"
        >
          <option value="all">Tous les scores</option>
          {allScoreNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Trend cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredScoreNames.map((scoreName) => {
          const trend = trends[scoreName]
          if (!trend) return null

          return (
            <TrendCard
              key={scoreName}
              scoreName={scoreName}
              trend={trend}
              color={SCORE_COLORS[scoreName] || SCORE_COLORS.default}
            />
          )
        })}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-emerald-100/60 shadow-soft">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              {filteredScoreNames.map((name) => (
                <linearGradient key={name} id={`gradient-${name}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SCORE_COLORS[name] || SCORE_COLORS.default} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={SCORE_COLORS[name] || SCORE_COLORS.default} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />

            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              style={{ fontSize: '11px' }}
            />

            <YAxis
              stroke="#94a3b8"
              style={{ fontSize: '11px' }}
            />

            <Tooltip
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #d1fae5',
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              }}
              labelStyle={{ color: '#64748b', marginBottom: '4px' }}
            />

            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
            />

            {filteredScoreNames.map((name) => (
              <Area
                key={name}
                type="monotone"
                dataKey={name}
                stroke={SCORE_COLORS[name] || SCORE_COLORS.default}
                strokeWidth={2.5}
                fill={`url(#gradient-${name})`}
                dot={{ fill: SCORE_COLORS[name] || SCORE_COLORS.default, r: 4, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Timeline of consultations with scores */}
      <div className="mt-6">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Historique des mesures</h3>
        <div className="flex flex-col gap-2">
          {scoreEvolution.slice().reverse().map((ev, i) => (
            <div
              key={i}
              className="bg-white rounded-xl px-4 py-3 border border-emerald-100/60 shadow-soft"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">
                  {format(new Date(ev.date), 'dd MMMM yyyy · HH:mm', { locale: enUS })}
                </span>
                <span className="text-xs text-slate-400">
                  {ev.scores.length} score{ev.scores.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ev.scores.map((score, j) => (
                  <div
                    key={j}
                    className="px-3 py-1.5 rounded-lg"
                    style={{
                      background: `${SCORE_COLORS[score.name] || SCORE_COLORS.default}10`,
                      border: `1px solid ${SCORE_COLORS[score.name] || SCORE_COLORS.default}25`,
                    }}
                  >
                    <span
                      className="text-xs font-semibold"
                      style={{ color: SCORE_COLORS[score.name] || SCORE_COLORS.default }}
                    >
                      {score.name}:
                    </span>
                    <span
                      className="ml-1 text-sm font-bold"
                      style={{ color: SCORE_COLORS[score.name] || SCORE_COLORS.default }}
                    >
                      {score.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TrendCard({ scoreName, trend, color }) {
  const Icon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus

  return (
    <div className="bg-white rounded-xl px-4 py-3 border border-emerald-100/60 shadow-soft">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500 font-medium">
          {scoreName}
        </span>
        <Icon
          size={14}
          style={{
            color: trend.direction === 'up' ? '#ef4444' : trend.direction === 'down' ? '#10b981' : '#94a3b8',
          }}
        />
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold" style={{ color }}>
          {trend.latest}
        </span>
        {trend.change !== 0 && (
          <span
            className="text-xs font-semibold"
            style={{
              color: trend.direction === 'up' ? '#ef4444' : '#10b981',
            }}
          >
            {trend.change > 0 ? '+' : ''}{trend.change}
          </span>
        )}
      </div>

      <p className="text-[10px] text-slate-400 mt-1">
        {trend.measurements} mesure{trend.measurements > 1 ? 's' : ''}
      </p>
    </div>
  )
}

function calculateTrends(scoreEvolution, scoreNames) {
  const trends = {}

  scoreNames.forEach((name) => {
    const values = scoreEvolution
      .flatMap((ev) => ev.scores)
      .filter((s) => s.name === name)
      .map((s) => s.value)

    if (values.length === 0) return

    const latest = values[values.length - 1]
    const previous = values.length > 1 ? values[values.length - 2] : latest
    const change = latest - previous

    trends[name] = {
      latest,
      previous,
      change,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      measurements: values.length,
    }
  })

  return trends
}
