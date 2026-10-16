import React, { useState } from 'react'
import { motion } from 'motion/react'
import {
  HelpCircle,
  X,
  Calculator,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { FACTOR_DETAILS } from './factorDetails'

export { FACTOR_DETAILS }

export function ScoreExplainerModal({
  isOpen,
  onClose,
  initialFactor = null,
  overallScore = 94.2,
}) {
  const [activeTabOverride, setActiveTabOverride] = useState(null)

  if (!isOpen) return null

  const selectedFactorName = activeTabOverride || initialFactor || 'Task Completion'
  const factorKeys = Object.keys(FACTOR_DETAILS)
  const currentDetail = FACTOR_DETAILS[selectedFactorName] || FACTOR_DETAILS['Task Completion']
  const CurrentIcon = currentDetail.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-nexus-bg/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl bg-nexus-surface border border-nexus-border rounded-xl shadow-nexus-elevated overflow-hidden font-sans my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="explainer-title"
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-nexus-elevated border-b border-nexus-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-nexus-lime/10 border border-nexus-lime/30 text-nexus-lime">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="explainer-title"
                className="font-display text-base font-bold uppercase tracking-wider text-nexus-text"
              >
                FairScore Algorithm & Mathematical Rubric
              </h2>
              <p className="text-xs text-nexus-muted font-mono">
                5-Factor Objective Grading Standard · Version 2.4
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTabOverride(null)
              onClose?.()
            }}
            className="p-1.5 rounded-lg text-nexus-muted hover:text-nexus-text hover:bg-nexus-surface transition-colors cursor-pointer"
            aria-label="Close explainer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* OVERALL SCORE SUMMARY BANNER */}
        <div className="px-6 py-3 bg-nexus-bg/50 border-b border-nexus-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="nexus-led nexus-led-lime" />
            <span className="font-mono text-nexus-muted">Projected Contribution Score:</span>
            <span className="font-mono font-bold text-nexus-lime text-sm">
              {overallScore}%
            </span>
          </div>
          <Badge variant="cyan" dot>
            EVIDENCE-BASED AUDIT
          </Badge>
        </div>

        {/* FACTOR SELECTOR TABS */}
        <div className="p-4 bg-nexus-elevated/40 border-b border-nexus-border overflow-x-auto scrollbar-none">
          <div className="flex space-x-2 min-w-max">
            {factorKeys.map((name) => {
              const item = FACTOR_DETAILS[name]
              const Icon = item.icon
              const isSelected = selectedFactorName === name

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setActiveTabOverride(name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-nexus-lime/20 text-nexus-lime border border-nexus-lime/50 font-bold shadow-sm'
                      : 'bg-nexus-surface text-nexus-muted hover:text-nexus-text border border-nexus-border'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* DETAIL CONTENT */}
        <div className="p-6 space-y-5 text-sm">
          {/* Factor Header */}
          <div className="flex items-start justify-between gap-4 pb-3 border-b border-nexus-border/60">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-lg border"
                style={{
                  backgroundColor: `${currentDetail.color}15`,
                  borderColor: `${currentDetail.color}40`,
                  color: currentDetail.color,
                }}
              >
                <CurrentIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold uppercase text-nexus-text">
                  {selectedFactorName}
                </h3>
                <span className="text-xs font-mono text-nexus-muted">
                  Standard Evaluation Weight: {currentDetail.defaultWeight}%
                </span>
              </div>
            </div>
            <Badge variant={currentDetail.badgeVariant}>ACTIVE FACTOR</Badge>
          </div>

          {/* Formula Card */}
          <div className="p-4 bg-nexus-bg rounded-lg border border-nexus-border space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-cyan font-semibold">
              <Calculator className="w-3.5 h-3.5" />
              <span>MATHEMATICAL FORMULA</span>
            </div>
            <code className="block font-mono text-xs text-nexus-lime bg-nexus-elevated/80 px-3 py-2 rounded border border-nexus-border/80">
              {currentDetail.formula}
            </code>
          </div>

          {/* Rationale & Example */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-nexus-surface rounded-lg border border-nexus-border space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-mono text-nexus-text font-bold uppercase">
                <HelpCircle className="w-3.5 h-3.5 text-nexus-cyan" />
                <span>Evaluation Criteria</span>
              </div>
              <p className="text-xs text-nexus-muted leading-relaxed font-sans">
                {currentDetail.rationale}
              </p>
            </div>

            <div className="p-4 bg-nexus-surface rounded-lg border border-nexus-border space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-mono text-nexus-lime font-bold uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Practical Calculation</span>
              </div>
              <p className="text-xs text-nexus-muted leading-relaxed font-sans">
                {currentDetail.example}
              </p>
            </div>
          </div>

          {/* Anti-Gaming Safeguard Alert */}
          <div className="p-4 bg-nexus-amber/10 border border-nexus-amber/30 rounded-lg flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-nexus-amber shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-mono font-bold text-nexus-amber uppercase tracking-wider">
                Academic Anti-Gaming Safeguards
              </h4>
              <p className="text-xs text-nexus-muted leading-relaxed">
                {currentDetail.antiGaming}
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-4 bg-nexus-elevated border-t border-nexus-border flex items-center justify-between">
          <span className="text-[11px] font-mono text-nexus-muted">
            All calculations comply with FairShare Institutional Grading RFC-12
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close Rubric
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
