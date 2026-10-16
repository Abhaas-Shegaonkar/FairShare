import React, { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  Activity,
  CheckCircle2,
  GitPullRequest,
  UserPlus,
  Clock,
} from 'lucide-react'

export function ActivityTimeline({ activities = [] }) {
  const [filterCategory, setFilterCategory] = useState('ALL')

  const filteredActivities = useMemo(() => {
    if (filterCategory === 'ALL') return activities
    return activities.filter((act) => act.category === filterCategory)
  }, [activities, filterCategory])

  const getEventIcon = (category, action) => {
    if (category === 'evidence' || action?.includes('evidence') || action?.includes('pull request')) {
      return { icon: GitPullRequest, color: 'text-nexus-cyan', bg: 'bg-nexus-cyan/10 border-nexus-cyan/30' }
    }
    if (category === 'member' || action?.includes('joined') || action?.includes('invited')) {
      return { icon: UserPlus, color: 'text-nexus-amber', bg: 'bg-nexus-amber/10 border-nexus-amber/30' }
    }
    return { icon: CheckCircle2, color: 'text-nexus-lime', bg: 'bg-nexus-lime/10 border-nexus-lime/30' }
  }

  return (
    <div className="space-y-6">
      {/* Header and Filter Control */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-nexus-surface border border-nexus-border rounded-xl">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-nexus-cyan" />
          <h3 className="font-display font-bold text-sm text-nexus-text uppercase tracking-wider">
            Immutable Project Event Stream
          </h3>
          <span className="text-xs font-mono text-nexus-muted">
            ({filteredActivities.length} Operations Logged)
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {['ALL', 'task', 'evidence', 'member'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase transition-colors cursor-pointer ${
                filterCategory === cat
                  ? 'bg-nexus-elevated border border-nexus-lime text-nexus-lime font-bold'
                  : 'bg-nexus-elevated border border-nexus-border text-nexus-muted hover:text-nexus-text'
              }`}
            >
              {cat === 'ALL' ? 'All Events' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="bg-nexus-surface border border-nexus-border rounded-xl p-6 shadow-nexus-card">
        {filteredActivities.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-nexus-muted">
            No activity logged for this filter category.
          </div>
        ) : (
          <div className="relative border-l border-nexus-border/80 ml-4 space-y-6">
            {filteredActivities.map((act, idx) => {
              const { icon: Icon, color, bg } = getEventIcon(act.category, act.action)

              return (
                <motion.div
                  key={act.id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                  className="relative pl-7 group"
                >
                  {/* Timeline Dot with Icon */}
                  <div
                    className={`absolute -left-3.5 top-0 w-7 h-7 rounded-full border flex items-center justify-center ${bg} shadow-sm group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                  </div>

                  {/* Activity Details Card */}
                  <div className="p-3.5 rounded-lg bg-nexus-elevated border border-nexus-border/80 group-hover:border-nexus-border-bright transition-colors space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 font-mono">
                        <strong className="text-nexus-text font-bold">
                          {act.user || act.actor_name || 'Contributor'}
                        </strong>
                        <span className="text-nexus-muted">
                          {act.action || act.action_type || 'updated project state'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-nexus-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {act.timestamp}
                      </span>
                    </div>

                    {act.detail && (
                      <p className="text-xs text-nexus-text/90 font-sans pl-0.5">
                        {act.detail}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
