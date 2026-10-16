import React from 'react'
import { motion } from 'motion/react'
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Layers,
  Activity,
  Users,
  Sparkles,
  HelpCircle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '../common/Badge'

const FACTOR_ICONS = {
  'Task Completion': CheckCircle2,
  'Timeliness': Clock,
  'Work Evidence': ShieldCheck,
  'Work Volume': Layers,
  'Task Complexity': Activity,
  'Peer Review': Users,
  'Participation': Sparkles,
}

export function ScoreFactorBreakdown({
  factors = [],
  overallScore = 94.2,
  onOpenExplainer,
}) {
  const totalWeightedSum = factors
    .reduce((acc, f) => acc + (f.score * (f.weight || 20)) / 100, 0)
    .toFixed(1)

  return (
    <div className="bg-nexus-surface border border-nexus-border rounded-xl p-6 shadow-nexus-card space-y-6">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-nexus-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="nexus-led nexus-led-lime" />
            <h2 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wider text-nexus-text">
              5-Factor Contribution Formula
            </h2>
          </div>
          <p className="text-xs text-nexus-muted font-sans mt-0.5">
            Transparent mathematical weighting based on verifiable artifacts and peer accountability.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenExplainer?.('Task Completion')}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-nexus-cyan hover:text-nexus-lime transition-colors cursor-pointer group self-start sm:self-auto"
        >
          <HelpCircle className="w-4 h-4 text-nexus-cyan group-hover:rotate-12 transition-transform" />
          <span>How is this calculated?</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* FACTORS LIST */}
      <div className="space-y-4">
        {factors.map((factor, index) => {
          const Icon = FACTOR_ICONS[factor.name] || Activity
          const weight = factor.weight || 20
          const weightedContribution = ((factor.score * weight) / 100).toFixed(1)

          // Color selection based on score
          const isHigh = factor.score >= 90
          const isMedium = factor.score >= 75
          const barColor = isHigh
            ? 'bg-nexus-lime'
            : isMedium
            ? 'bg-nexus-cyan'
            : 'bg-nexus-amber'

          return (
            <motion.div
              key={factor.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onOpenExplainer?.(factor.name)}
              className="p-4 rounded-lg bg-nexus-elevated/40 border border-nexus-border hover:border-nexus-lime/40 hover:bg-nexus-elevated/70 transition-all cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-nexus-surface border border-nexus-border text-nexus-cyan group-hover:text-nexus-lime group-hover:border-nexus-lime/30 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold text-sm text-nexus-text uppercase group-hover:text-nexus-lime transition-colors">
                        {factor.name}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-nexus-surface border border-nexus-border text-nexus-muted">
                        {weight}% Weight
                      </span>
                    </div>
                    {factor.description && (
                      <p className="text-xs text-nexus-muted mt-0.5 font-sans">
                        {factor.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Score numbers */}
                <div className="flex items-center sm:flex-col sm:items-end justify-between text-right shrink-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-base font-bold text-nexus-text">
                      {factor.score}%
                    </span>
                    <span className="text-xs font-mono text-nexus-muted">
                      ({weightedContribution} pts)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-nexus-cyan group-hover:text-nexus-lime transition-colors flex items-center gap-0.5">
                    Inspect Formula <ChevronRight className="w-3 h-3 inline" />
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-nexus-bg rounded-full h-2 overflow-hidden border border-nexus-border/60">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(factor.score, 100)}%` }}
                  transition={{ duration: 0.6, delay: 0.1 + index * 0.05, ease: 'easeOut' }}
                  className={`h-full ${barColor} rounded-full`}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* COMBINED TOTAL BANNER */}
      <div className="p-4 rounded-lg bg-nexus-bg border border-nexus-lime/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-nexus-lime/10 border border-nexus-lime/30 text-nexus-lime">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-nexus-muted">
              Cumulative Weighted Total
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl font-bold text-nexus-lime">
                {overallScore}%
              </span>
              <span className="text-xs font-mono text-nexus-muted">
                (Calculated Sum: {totalWeightedSum} pts / 100.0)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="lime" dot>
            EXEMPLARY GRADE PROJECTION
          </Badge>
        </div>
      </div>
    </div>
  )
}
