import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  CheckCircle2,
  Clock,
  Users,
  Award,
  ShieldCheck,
  ArrowRight,
  BarChart3,
  Paperclip,
  Lock,
  Unlock,
  Sparkles,
} from 'lucide-react'
import { MetricCard } from '../common/MetricCard'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'

export function OverviewTab({
  project,
  tasks = [],
  evidence = [],
  members = [],
  onSwitchTab,
  onOpenPeerFeedback,
}) {
  const {
    id,
    description,
    category,
    deadline = '2026-10-30',
    total_tasks = 20,
    completed_tasks = 18,
    progress_percentage = 90,
    days_remaining = 14,
    fairness_score = 92.4,
  } = project || {}

  // Workload summary per member
  const memberWorkloads = members.map((member) => {
    const memberTasks = tasks.filter((t) => {
      const assigned = typeof t.assigned_to === 'object' ? t.assigned_to?.name : t.assigned_to
      return assigned === member.name
    })
    const assignedCount = memberTasks.length || member.tasks_assigned || 4
    const completedCount = memberTasks.filter((t) => t.status === 'Completed').length || member.tasks_completed || 3
    const proofCount = memberTasks.filter((t) => t.has_evidence || t.evidence_count > 0 || (t.evidence && t.evidence.length > 0)).length
    const proofRate = completedCount > 0 ? Math.round((proofCount / completedCount) * 100) : 100

    return {
      ...member,
      assignedCount,
      completedCount,
      proofCount,
      proofRate,
      completionRate: assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 100,
    }
  })

  // Peer review unlock calculation (3 days before deadline)
  const isPeerReviewUnlocked = days_remaining <= 3

  return (
    <div className="space-y-8">
      {/* HUD Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Milestone Completion"
          value={`${progress_percentage}%`}
          subtitle={`${completed_tasks} of ${total_tasks} deliverables finalized`}
          icon={CheckCircle2}
          trend="+4 this cycle"
          trendPositive={true}
          variant="lime"
        />
        <MetricCard
          title="Timeline Cutoff"
          value={days_remaining < 0 ? 'Overdue' : `${days_remaining} Days`}
          subtitle={`Final defense: ${deadline}`}
          icon={Clock}
          trend={days_remaining <= 3 ? 'Urgent' : 'Nominal'}
          trendPositive={days_remaining > 3}
          variant={days_remaining <= 3 ? 'amber' : 'cyan'}
        />
        <MetricCard
          title="Active Engineering Roster"
          value={members.length || 4}
          subtitle="Cross-functional contributors"
          icon={Users}
          trend="100% active"
          trendPositive={true}
          variant="cyan"
        />
        <MetricCard
          title="Project FairScore"
          value={`${fairness_score}%`}
          subtitle="Objective 5-factor contribution score"
          icon={Award}
          trend="Balanced"
          trendPositive={true}
          variant="lime"
        />
      </div>

      {/* PEER REVIEW WINDOW BANNER (Specified in frontend.md) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-nexus-card ${
          isPeerReviewUnlocked
            ? 'bg-nexus-lime/10 border-nexus-lime/50 text-nexus-text'
            : 'bg-nexus-surface border-nexus-border text-nexus-muted'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
              isPeerReviewUnlocked
                ? 'bg-nexus-lime/20 border-nexus-lime text-nexus-lime'
                : 'bg-nexus-elevated border-nexus-border text-nexus-muted'
            }`}
          >
            {isPeerReviewUnlocked ? (
              <Unlock className="w-5 h-5 text-nexus-lime" />
            ) : (
              <Lock className="w-5 h-5 text-nexus-muted" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-bold text-base text-nexus-text">
                {isPeerReviewUnlocked
                  ? 'Peer Feedback Evaluation Window Active'
                  : 'Peer Feedback Review Window: Unlocks 3 Days Before Final Cutoff'}
              </h4>
              <Badge variant={isPeerReviewUnlocked ? 'lime' : 'amber'} dot>
                {isPeerReviewUnlocked ? 'UNLOCKED' : 'SCHEDULED'}
              </Badge>
            </div>
            <p className="text-xs text-nexus-muted mt-1 max-w-2xl font-sans">
              FairShare protects against free-riding by having teammates rate participation, responsibility,
              code quality, and communication anonymously.
              {!isPeerReviewUnlocked && (
                <span> Window opens automatically when milestone countdown hits 72 hours.</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <Button
            variant={isPeerReviewUnlocked ? 'primary' : 'secondary'}
            size="sm"
            icon={Sparkles}
            onClick={onOpenPeerFeedback}
          >
            {isPeerReviewUnlocked ? 'Submit Peer Reviews' : 'Preview Peer Review'}
          </Button>
        </div>
      </motion.div>

      {/* TWO-COLUMN WORKLOAD & HIGHLIGHTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Team Workload & Verification Matrix (8 cols) */}
        <section className="lg:col-span-8 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-nexus-border">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-nexus-cyan" />
              <h3 className="font-display font-bold text-base text-nexus-text uppercase tracking-wide">
                Teammate Workload & Verification Rates
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onSwitchTab('roster')}
              className="text-xs font-mono text-nexus-cyan hover:text-nexus-lime flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Roster</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memberWorkloads.map((member, idx) => (
              <div
                key={member.id || idx}
                className="bg-nexus-surface border border-nexus-border rounded-xl p-4 space-y-3.5 shadow-nexus-card hover:border-nexus-border-bright transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-display font-bold text-sm text-nexus-text">
                      {member.name}
                    </h4>
                    <span className="text-[11px] font-mono text-nexus-muted">
                      {member.role || 'Contributor'}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-nexus-lime font-bold">
                    {member.fair_score || '91.5'}% FairScore
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-nexus-muted">
                    <span>Deliverable Progress</span>
                    <span className="text-nexus-text">
                      {member.completedCount} / {member.assignedCount} tasks ({member.completionRate}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-nexus-elevated rounded-full overflow-hidden border border-nexus-border">
                    <div
                      className="h-full bg-gradient-to-r from-nexus-cyan to-nexus-lime rounded-full"
                      style={{ width: `${member.completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Evidence Rate */}
                <div className="pt-2 border-t border-nexus-border flex items-center justify-between text-xs font-mono">
                  <span className="text-nexus-muted flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-nexus-lime" />
                    <span>Evidence Attached:</span>
                  </span>
                  <span className="text-nexus-lime font-bold">
                    {member.proofRate}% of tasks verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Quick Operations & Analytics CTA (4 cols) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Quick Operations Navigation */}
          <div className="bg-nexus-surface border border-nexus-border rounded-xl p-5 shadow-nexus-card space-y-4">
            <h4 className="font-display font-bold text-sm text-nexus-text uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-nexus-lime" />
              <span>Workspace Fast Actions</span>
            </h4>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onSwitchTab('tasks')}
                className="w-full p-3 rounded-lg bg-nexus-elevated hover:bg-nexus-surface-hover border border-nexus-border hover:border-nexus-lime text-left text-xs font-mono flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-nexus-lime" />
                  <span className="text-nexus-text group-hover:text-nexus-lime font-semibold">
                    Launch Cyber-Kanban Board
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-nexus-muted group-hover:text-nexus-lime" />
              </button>

              <button
                type="button"
                onClick={() => onSwitchTab('evidence')}
                className="w-full p-3 rounded-lg bg-nexus-elevated hover:bg-nexus-surface-hover border border-nexus-border hover:border-nexus-cyan text-left text-xs font-mono flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Paperclip className="w-4 h-4 text-nexus-cyan" />
                  <span className="text-nexus-text group-hover:text-nexus-cyan font-semibold">
                    Open Evidence Vault ({evidence.length})
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-nexus-muted group-hover:text-nexus-cyan" />
              </button>

              <Link
                to={`/projects/${id}/contribution`}
                className="block w-full p-3 rounded-lg bg-nexus-lime/10 hover:bg-nexus-lime/20 border border-nexus-lime/40 hover:border-nexus-lime text-left text-xs font-mono flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-nexus-lime" />
                  <span className="text-nexus-lime font-bold">
                    5-Factor Contribution Analytics
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-nexus-lime" />
              </Link>
            </div>
          </div>

          {/* Project Details Card */}
          <div className="bg-nexus-surface border border-nexus-border rounded-xl p-5 shadow-nexus-card space-y-3 text-xs font-mono">
            <span className="text-[10px] uppercase tracking-wider text-nexus-muted block">
              Project Briefing
            </span>
            <p className="text-nexus-text font-sans leading-relaxed text-xs">
              {description || 'Academic collaboration workspace initialized for objective milestone tracking.'}
            </p>
            <div className="pt-3 border-t border-nexus-border space-y-2 text-nexus-muted">
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="text-nexus-cyan font-bold">{category || 'General'}</span>
              </div>
              <div className="flex justify-between">
                <span>Final Submission:</span>
                <span className="text-nexus-text">{deadline}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
