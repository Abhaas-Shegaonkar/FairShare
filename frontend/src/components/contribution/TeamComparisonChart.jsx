import React, { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { Users, ShieldCheck } from 'lucide-react'

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-nexus-elevated border border-nexus-border rounded-lg p-3 shadow-nexus-elevated font-mono text-xs space-y-1.5 z-50">
        <p className="font-bold text-nexus-text border-b border-nexus-border pb-1">
          {label}
        </p>
        {payload.map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5" style={{ color: item.color }}>
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: item.color }}
              />
              {item.name}:
            </span>
            <span className="font-bold text-nexus-text">
              {item.value}
              {item.dataKey.includes('score') || item.dataKey.includes('rate') ? '%' : ''}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function TeamComparisonChart({ members = [] }) {
  const [viewMode, setViewMode] = useState('scores') // 'scores' or 'deliverables'

  // Prepare chart dataset
  const chartData = members.map((m) => ({
    name: m.name,
    fair_score: m.fair_score ?? m.score ?? 85,
    timeliness_rate: m.timeliness_rate || 80,
    tasks_completed: m.tasks_completed || 0,
    tasks_assigned: m.tasks_assigned || 0,
    role: m.role || 'Contributor',
  }))

  return (
    <div className="bg-nexus-surface border border-nexus-border rounded-xl p-6 shadow-nexus-card space-y-4">
      {/* HEADER & TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-nexus-border">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-nexus-cyan" />
            <h3 className="font-display text-base font-bold uppercase tracking-wider text-nexus-text">
              Teammate Comparative Analysis
            </h3>
          </div>
          <p className="text-xs text-nexus-muted font-sans mt-0.5">
            Objective peer distribution designed to encourage collaborative equity.
          </p>
        </div>

        {/* View Toggle */}
        <div className="inline-flex p-1 bg-nexus-elevated rounded-lg border border-nexus-border text-xs font-mono self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('scores')}
            className={`px-3 py-1 rounded transition-colors cursor-pointer ${
              viewMode === 'scores'
                ? 'bg-nexus-surface text-nexus-lime font-bold shadow-sm'
                : 'text-nexus-muted hover:text-nexus-text'
            }`}
          >
            Scores & Timeliness (%)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('deliverables')}
            className={`px-3 py-1 rounded transition-colors cursor-pointer ${
              viewMode === 'deliverables'
                ? 'bg-nexus-surface text-nexus-cyan font-bold shadow-sm'
                : 'text-nexus-muted hover:text-nexus-text'
            }`}
          >
            Deliverables (Count)
          </button>
        </div>
      </div>

      {/* RECHARTS CONTAINER */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1C2A29"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="#9AA7A1"
              fontSize={11}
              fontFamily="JetBrains Mono"
              tickLine={false}
              axisLine={{ stroke: '#1C2A29' }}
            />
            <YAxis
              stroke="#9AA7A1"
              fontSize={11}
              fontFamily="JetBrains Mono"
              tickLine={false}
              axisLine={{ stroke: '#1C2A29' }}
              domain={viewMode === 'scores' ? [50, 100] : [0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontFamily: 'JetBrains Mono',
                fontSize: '11px',
                paddingTop: '8px',
              }}
            />
            {viewMode === 'scores' ? (
              <>
                <Bar
                  dataKey="fair_score"
                  name="FairScore"
                  fill="#C5FF4A"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="timeliness_rate"
                  name="Timeliness Rate"
                  fill="#52E8D1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </>
            ) : (
              <>
                <Bar
                  dataKey="tasks_completed"
                  name="Completed Tasks"
                  fill="#C5FF4A"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="tasks_assigned"
                  name="Assigned Tasks"
                  fill="#273E3B"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* FOOTER NOTICE */}
      <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-nexus-muted border-t border-nexus-border/60">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-nexus-cyan" />
          <span>Non-punitive metric normalization applied</span>
        </span>
        <span className="text-nexus-cyan font-semibold">Active Roster: {members.length} Members</span>
      </div>
    </div>
  )
}
