import React from 'react'
import { Link } from 'react-router-dom'
import { Clock, CheckCircle2, ChevronRight } from 'lucide-react'
import { Badge } from '../common/Badge'

export function UpcomingDeadlines({ deadlines = [] }) {
  const priorityBadges = {
    Critical: 'crimson',
    High: 'amber',
    Medium: 'cyan',
    Low: 'surface',
  }

  return (
    <div className="bg-nexus-surface border border-nexus-border rounded-xl p-6 shadow-nexus-card nexus-corner-bracket space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-nexus-border">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-nexus-amber" />
          <h3 className="font-display font-bold text-base text-nexus-text uppercase tracking-wide">
            Approaching Deadlines
          </h3>
        </div>
        <span className="text-[11px] font-mono text-nexus-muted">Next 72 Hours</span>
      </div>

      {/* Deadlines List */}
      {deadlines.length === 0 ? (
        <div className="py-8 text-center text-xs text-nexus-muted space-y-1 font-mono">
          <CheckCircle2 className="w-6 h-6 text-nexus-lime mx-auto mb-2 opacity-80" />
          <p>No critical deliverables approaching within 72h.</p>
          <p className="text-[10px] text-nexus-muted">All active milestones on schedule.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deadlines.map((item) => {
            const badgeVariant = priorityBadges[item.priority] || 'amber'
            return (
              <div
                key={item.id}
                className="group p-3.5 rounded-lg bg-nexus-elevated border border-nexus-border hover:border-nexus-amber/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={badgeVariant} dot>
                      {item.priority}
                    </Badge>
                    <span className="text-[11px] font-mono text-nexus-muted">
                      {item.project_name}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-nexus-text group-hover:text-nexus-amber transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-mono">
                  <div className="text-right">
                    <div className="text-nexus-amber font-bold flex items-center gap-1 sm:justify-end">
                      <Clock className="w-3 h-3 text-nexus-amber" />
                      <span>{item.hours_left ? `${item.hours_left}h left` : item.due_date}</span>
                    </div>
                    <div className="text-[10px] text-nexus-muted">Due {item.due_date}</div>
                  </div>

                  <Link
                    to="/projects/a1b2c3d4-0000-0000-0000-000000000001"
                    className="p-1.5 rounded-md bg-nexus-surface border border-nexus-border text-nexus-muted group-hover:text-nexus-text group-hover:border-nexus-amber/40 transition-colors"
                    title="View Deliverable"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
