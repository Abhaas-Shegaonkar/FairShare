import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { TrendingUp, Clock, Sparkles } from 'lucide-react'

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-nexus-elevated border border-nexus-border rounded-lg p-3 shadow-nexus-elevated font-mono text-xs space-y-1.5 z-50">
        <p className="font-bold text-nexus-text border-b border-nexus-border pb-1">
          Snapshot: {label}
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
              {item.value}%
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const LINE_COLORS = ['#C5FF4A', '#52E8D1', '#F59E0B', '#FF4D4D', '#A78BFA']

export function ContributionTrendChart({
  trendData = [],
  members = [],
}) {
  // If trendData is empty, fallback to 4-week progression
  const displayData =
    trendData && trendData.length > 0
      ? trendData
      : [
          { week: 'W1', Abhaas: 88, Rohit: 85, Denesh: 80, Aditya: 70 },
          { week: 'W2', Abhaas: 91, Rohit: 87, Denesh: 82, Aditya: 72 },
          { week: 'W3', Abhaas: 93, Rohit: 90, Denesh: 81, Aditya: 71 },
          { week: 'W4', Abhaas: 94.2, Rohit: 91.5, Denesh: 83, Aditya: 72.8 },
        ]

  // Identify member keys present in the first data point (except 'week')
  const memberKeys =
    displayData.length > 0
      ? Object.keys(displayData[0]).filter((k) => k !== 'week')
      : members.length > 0
      ? members.map((m) => m.name)
      : ['Abhaas', 'Rohit', 'Denesh', 'Aditya']

  return (
    <div className="bg-nexus-surface border border-nexus-border rounded-xl p-6 shadow-nexus-card space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-nexus-border">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-nexus-lime" />
            <h3 className="font-display text-base font-bold uppercase tracking-wider text-nexus-text">
              Weekly Progression & Velocity
            </h3>
          </div>
          <p className="text-xs text-nexus-muted font-sans mt-0.5">
            Consistency index tracking continuous deliverable velocity over sprint milestones.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-nexus-elevated border border-nexus-border text-[11px] font-mono text-nexus-muted self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-nexus-lime" />
          <span>4-Week Audit Window</span>
        </div>
      </div>

      {/* RECHARTS CONTAINER */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={displayData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1C2A29"
              vertical={false}
            />
            <XAxis
              dataKey="week"
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
              domain={[60, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontFamily: 'JetBrains Mono',
                fontSize: '11px',
                paddingTop: '8px',
              }}
            />
            {memberKeys.map((memberKey, index) => (
              <Line
                key={memberKey}
                type="monotone"
                dataKey={memberKey}
                name={memberKey}
                stroke={LINE_COLORS[index % LINE_COLORS.length]}
                strokeWidth={index === 0 ? 3 : 2}
                dot={{
                  r: 4,
                  strokeWidth: 2,
                  fill: '#080B0D',
                  stroke: LINE_COLORS[index % LINE_COLORS.length],
                }}
                activeDot={{
                  r: 6,
                  fill: LINE_COLORS[index % LINE_COLORS.length],
                  stroke: '#080B0D',
                  strokeWidth: 2,
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* FOOTER INSIGHT */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-nexus-muted border-t border-nexus-border/60 gap-2">
        <span className="flex items-center gap-1.5 text-nexus-lime">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Consistent weekly milestones maximize anti-cramming weighting</span>
        </span>
        <span>Sprint Velocity: +6.2 pts ({members.length || 4} members tracked)</span>
      </div>
    </div>
  )
}
