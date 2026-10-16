import React, { useState } from 'react'
import { motion } from 'motion/react'
import {
  AlertTriangle,
  Paperclip,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '../common/Badge'

export function TaskCard({
  task,
  onStatusChange,
  onAttachEvidence,
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)

  const {
    id,
    title,
    description,
    status = 'Todo',
    priority = 'Medium',
    assigned_to,
    due_date,
    deadline,
    completed_at,
    evidence = [],
    evidence_count = 0,
    has_evidence,
  } = task

  const targetDate = due_date || deadline || '2026-10-30'
  const isCompleted = status === 'Completed'
  const isInProgress = status === 'In Progress'
  const hasProof = has_evidence || evidence_count > 0 || (evidence && evidence.length > 0)

  // Priority color styling
  const priorityVariants = {
    Critical: 'crimson',
    High: 'amber',
    Medium: 'cyan',
    Low: 'surface',
  }
  const priorityVariant = priorityVariants[priority] || 'surface'

  // Deadline urgency check
  const calculateDaysLeft = (dateStr) => {
    try {
      const target = new Date(dateStr)
      const now = new Date()
      const diffTime = target - now
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    } catch {
      return 10
    }
  }
  const daysLeft = calculateDaysLeft(targetDate)

  // Assignee initials
  const assigneeName = typeof assigned_to === 'object' ? assigned_to?.name : assigned_to || 'Unassigned'
  const initials = assigneeName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Next status progression helper
  const handleAdvanceStatus = () => {
    if (status === 'Todo') {
      onStatusChange(id, 'In Progress')
    } else if (status === 'In Progress') {
      onStatusChange(id, 'Completed')
    } else {
      onStatusChange(id, 'Todo')
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={`group relative bg-nexus-surface border rounded-xl p-4 shadow-nexus-card transition-all duration-200 ${
        isCompleted
          ? 'border-nexus-lime/30 hover:border-nexus-lime/60 bg-nexus-surface/80'
          : isInProgress
          ? 'border-nexus-cyan/40 hover:border-nexus-cyan/70'
          : 'border-nexus-border hover:border-nexus-border-bright'
      }`}
    >
      {/* Top Header: Priority & Status Badge */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <Badge variant={priorityVariant}>
            {priority.toUpperCase()}
          </Badge>
          {isCompleted && (
            <Badge variant="lime" dot>
              DONE
            </Badge>
          )}
          {isInProgress && (
            <Badge variant="cyan" dot>
              ACTIVE
            </Badge>
          )}
        </div>

        {/* Evidence Status Indicator */}
        <div>
          {hasProof ? (
            <div
              className="flex items-center gap-1 text-[11px] font-mono text-nexus-lime px-2 py-0.5 rounded bg-nexus-lime/10 border border-nexus-lime/30"
              title="Verified evidence artifact attached"
            >
              <ShieldCheck className="w-3 h-3 text-nexus-lime" />
              <span>Verified ({evidence_count || evidence.length})</span>
            </div>
          ) : isCompleted ? (
            <div
              className="flex items-center gap-1 text-[11px] font-mono text-nexus-amber px-2 py-0.5 rounded bg-nexus-amber/10 border border-nexus-amber/30 animate-pulse"
              title="Deliverable finalized without verifiable proof"
            >
              <AlertTriangle className="w-3 h-3 text-nexus-amber" />
              <span>Evidence Missing</span>
            </div>
          ) : (
            <span className="text-[10px] font-mono text-nexus-muted">No Evidence</span>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h4
        onClick={() => setIsExpanded(!isExpanded)}
        className={`font-display font-semibold text-sm leading-snug cursor-pointer transition-colors ${
          isCompleted ? 'text-nexus-text/90 line-through decoration-nexus-muted/50' : 'text-nexus-text hover:text-nexus-lime'
        }`}
      >
        {title}
      </h4>

      {/* Accordion Description & Details */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-nexus-border text-xs text-nexus-muted space-y-2.5"
        >
          <p className="leading-relaxed">{description || 'No additional technical specification provided.'}</p>

          {/* Attached Artifacts */}
          {evidence && evidence.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-nexus-cyan flex items-center gap-1">
                <Paperclip className="w-3 h-3" /> Attached Deliverables:
              </span>
              {evidence.map((ev, i) => (
                <a
                  key={ev.id || i}
                  href={ev.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded bg-nexus-elevated border border-nexus-border hover:border-nexus-cyan text-xs text-nexus-text hover:text-nexus-cyan transition-colors"
                >
                  <span className="truncate pr-2">{ev.title}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              ))}
            </div>
          )}

          {completed_at && (
            <div className="text-[10px] font-mono text-nexus-lime pt-1">
              Finalized: {new Date(completed_at).toLocaleString()}
            </div>
          )}
        </motion.div>
      )}

      {/* Assignee & Deadline Row */}
      <div className="mt-3.5 pt-2.5 border-t border-nexus-border flex items-center justify-between text-xs">
        {/* Assignee Avatar */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full bg-nexus-elevated border border-nexus-border flex items-center justify-center text-[10px] font-mono font-bold text-nexus-cyan"
            title={`Assigned to ${assigneeName}`}
          >
            {initials}
          </div>
          <span className="text-xs text-nexus-muted truncate max-w-[100px] sm:max-w-[130px]">
            {assigneeName}
          </span>
        </div>

        {/* Due Date Indicator */}
        <div
          className={`flex items-center gap-1 text-[11px] font-mono ${
            isCompleted
              ? 'text-nexus-muted'
              : daysLeft <= 2
              ? 'text-nexus-crimson font-bold'
              : daysLeft <= 5
              ? 'text-nexus-amber'
              : 'text-nexus-muted'
          }`}
          title={`Target Date: ${targetDate}`}
        >
          <Clock className="w-3 h-3" />
          <span>
            {isCompleted ? 'Done' : daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-3 pt-2.5 border-t border-nexus-border/60 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1">
          {/* Quick status cycle button */}
          <button
            type="button"
            onClick={handleAdvanceStatus}
            className="px-2 py-1 rounded text-[11px] font-mono bg-nexus-elevated hover:bg-nexus-surface-hover border border-nexus-border hover:border-nexus-lime text-nexus-text hover:text-nexus-lime transition-colors flex items-center gap-1 cursor-pointer"
            title={`Move to next state`}
          >
            <span>{status === 'Todo' ? 'Start' : status === 'In Progress' ? 'Complete' : 'Reopen'}</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </button>

          {/* Status selector toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="p-1 rounded text-nexus-muted hover:text-nexus-text hover:bg-nexus-elevated transition-colors cursor-pointer"
              title="Change Status"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isStatusDropdownOpen && (
              <div
                className="absolute left-0 bottom-full mb-1 z-30 w-32 bg-nexus-elevated border border-nexus-border-bright rounded-lg shadow-nexus-elevated p-1 text-xs font-mono"
                onMouseLeave={() => setIsStatusDropdownOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    onStatusChange(id, 'Todo')
                    setIsStatusDropdownOpen(false)
                  }}
                  className={`w-full text-left px-2 py-1 rounded hover:bg-nexus-surface transition-colors cursor-pointer ${
                    status === 'Todo' ? 'text-nexus-cyan font-bold' : 'text-nexus-text'
                  }`}
                >
                  To Do
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onStatusChange(id, 'In Progress')
                    setIsStatusDropdownOpen(false)
                  }}
                  className={`w-full text-left px-2 py-1 rounded hover:bg-nexus-surface transition-colors cursor-pointer ${
                    status === 'In Progress' ? 'text-nexus-cyan font-bold' : 'text-nexus-text'
                  }`}
                >
                  In Progress
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onStatusChange(id, 'Completed')
                    setIsStatusDropdownOpen(false)
                  }}
                  className={`w-full text-left px-2 py-1 rounded hover:bg-nexus-surface transition-colors cursor-pointer ${
                    status === 'Completed' ? 'text-nexus-lime font-bold' : 'text-nexus-text'
                  }`}
                >
                  Completed
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Attach Evidence Button */}
          <button
            type="button"
            onClick={() => onAttachEvidence(task)}
            className="px-2 py-1 rounded text-[11px] font-mono bg-nexus-cyan/10 hover:bg-nexus-cyan/20 border border-nexus-cyan/30 text-nexus-cyan hover:border-nexus-cyan transition-colors flex items-center gap-1 cursor-pointer"
            title="Attach work evidence to this deliverable"
          >
            <Paperclip className="w-2.5 h-2.5" />
            <span>Proof</span>
          </button>

          {/* Expand Details Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-nexus-muted hover:text-nexus-text hover:bg-nexus-elevated transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse' : 'Expand Details'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
