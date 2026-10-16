import React from 'react'
import { Activity, GitPullRequest, CheckCircle2, FileUp, Clock } from 'lucide-react'
import { Badge } from '../common/Badge'

export function RecentActivityFeed({ activities = [] }) {
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'evidence':
        return <GitPullRequest className="w-3.5 h-3.5 text-nexus-cyan" />
      case 'task':
        return <CheckCircle2 className="w-3.5 h-3.5 text-nexus-lime" />
      default:
        return <FileUp className="w-3.5 h-3.5 text-nexus-amber" />
    }
  }

  return (
    <div className="bg-nexus-surface border border-nexus-border rounded-xl p-6 shadow-nexus-card nexus-corner-bracket space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-nexus-border">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-nexus-cyan" />
          <h3 className="font-display font-bold text-base text-nexus-text uppercase tracking-wide">
            Global Activity Stream
          </h3>
        </div>
        <Badge variant="cyan" dot>
          LIVE FEED
        </Badge>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-3 font-mono text-xs">
        {activities.map((act) => (
          <div
            key={act.id}
            className="p-3 rounded-lg bg-nexus-elevated border border-nexus-border flex items-start gap-3 hover:border-nexus-cyan/40 transition-colors"
          >
            <div className="w-7 h-7 rounded bg-nexus-surface border border-nexus-border flex items-center justify-center shrink-0 mt-0.5">
              {getCategoryIcon(act.category)}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="font-bold text-nexus-text">
                  {act.user}{' '}
                  <span className="font-normal text-nexus-muted">{act.action}</span>
                </span>
                <span className="text-[10px] text-nexus-muted flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {act.timestamp}
                </span>
              </div>
              <p className="text-[11px] text-nexus-cyan font-sans">{act.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
