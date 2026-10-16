import React, { useState } from 'react'
import { motion } from 'motion/react'
import {
  Users,
  UserPlus,
  Mail,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  Briefcase,
} from 'lucide-react'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { Modal } from '../common/Modal'

export function TeamDirectory({ members = [], onInviteMember }) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('Frontend Engineer')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleInviteSubmit = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setError('Please provide a valid student or institutional email.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const res = await onInviteMember({
        email: inviteEmail.trim(),
        name: inviteName.trim() || inviteEmail.split('@')[0],
        role: inviteRole,
      })

      if (res?.success) {
        setInviteEmail('')
        setInviteName('')
        setIsInviteModalOpen(false)
      } else {
        setError(res?.error || 'Failed to send workspace invitation.')
      }
    } catch (err) {
      setError(err.message || 'Error sending invitation.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Directory Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-nexus-surface border border-nexus-border rounded-xl">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-nexus-cyan" />
          <h3 className="font-display font-bold text-sm text-nexus-text uppercase tracking-wider">
            Project Engineering Roster
          </h3>
          <span className="text-xs font-mono text-nexus-muted">
            ({members.length} Enrolled Members)
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={UserPlus}
          onClick={() => setIsInviteModalOpen(true)}
        >
          Enlist Teammate
        </Button>
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {members.map((member, idx) => {
          const initials = (member.name || member.email)
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)

          const assigned = member.tasks_assigned ?? 5
          const completed = member.tasks_completed ?? 4
          const completionPct = assigned > 0 ? Math.round((completed / assigned) * 100) : 100
          const fairScore = member.fair_score ?? 88.5
          const timeliness = member.timeliness_rate ?? 90
          const status = member.status || 'Active'

          return (
            <motion.div
              key={member.id || member.email || idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              className="bg-nexus-surface border border-nexus-border hover:border-nexus-cyan/50 rounded-xl p-6 shadow-nexus-card hover:bg-nexus-surface-hover transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Member Top: Avatar, Name, Role, and Status */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl bg-nexus-elevated border border-nexus-border flex items-center justify-center text-sm font-mono font-bold text-nexus-lime shadow-inner"
                      style={{
                        borderColor: member.avatar_color || '#52E8D1',
                      }}
                    >
                      {initials}
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-base text-nexus-text leading-tight">
                        {member.name || 'Student Engineer'}
                      </h4>
                      <p className="text-xs text-nexus-muted font-mono mt-0.5 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-nexus-cyan" />
                        <span className="truncate max-w-[180px] sm:max-w-[220px]">
                          {member.email}
                        </span>
                      </p>
                    </div>
                  </div>

                  <Badge variant={status === 'Active' ? 'lime' : 'amber'} dot>
                    {status.toUpperCase()}
                  </Badge>
                </div>

                {/* Role Pill */}
                <div className="mb-5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-nexus-elevated border border-nexus-border text-xs font-mono text-nexus-cyan font-medium">
                    <Briefcase className="w-3 h-3 text-nexus-cyan" />
                    <span>{member.role || 'Contributor'}</span>
                  </span>
                </div>

                {/* Workload Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-nexus-muted flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-nexus-lime" />
                      <span>Deliverables Completed</span>
                    </span>
                    <span className="text-nexus-text font-bold">
                      {completed} / {assigned}{' '}
                      <span className="text-nexus-lime font-normal">({completionPct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-nexus-elevated rounded-full overflow-hidden border border-nexus-border">
                    <div
                      className="h-full bg-gradient-to-r from-nexus-cyan to-nexus-lime rounded-full"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Metrics Pill */}
              <div className="pt-4 border-t border-nexus-border grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-nexus-elevated border border-nexus-border">
                  <span className="text-nexus-muted text-[10px] uppercase tracking-wider block">
                    Timeliness Rate
                  </span>
                  <span className="text-nexus-cyan font-bold text-sm mt-0.5 block flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {timeliness}%
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-nexus-elevated border border-nexus-border">
                  <span className="text-nexus-muted text-[10px] uppercase tracking-wider block">
                    FairScore Rating
                  </span>
                  <span className="text-nexus-lime font-bold text-sm mt-0.5 block flex items-center gap-1">
                    <Award className="w-3 h-3" /> {fairScore}%
                  </span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Enlist Team Contributor"
        subtitle="Invite collaborator by institutional email. Unregistered users receive invitations mapped upon signup."
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-nexus-crimson/10 border border-nexus-crimson/40 text-xs font-mono text-nexus-crimson">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-nexus-muted">
              Student Email <span className="text-nexus-lime">*</span>
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@college.edu"
              className="w-full bg-nexus-surface border border-nexus-border rounded-lg px-3.5 py-2.5 text-sm text-nexus-text placeholder-nexus-muted/40 focus:outline-none focus:border-nexus-lime font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-nexus-muted">
              Full Name (Optional)
            </label>
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="e.g. Denesh Kumar"
              className="w-full bg-nexus-surface border border-nexus-border rounded-lg px-3.5 py-2.5 text-sm text-nexus-text placeholder-nexus-muted/40 focus:outline-none focus:border-nexus-lime font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-nexus-muted">
              Assigned Project Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full bg-nexus-surface border border-nexus-border rounded-lg px-3.5 py-2.5 text-sm text-nexus-text focus:outline-none focus:border-nexus-lime font-sans cursor-pointer"
            >
              <option value="Frontend Engineer">Frontend Engineer</option>
              <option value="Backend Architect">Backend Architect</option>
              <option value="Hardware & Embedded Lead">Hardware & Embedded Lead</option>
              <option value="QA & Testing Specialist">QA & Testing Specialist</option>
              <option value="Documentation & Research">Documentation & Research</option>
              <option value="UI/UX Designer">UI/UX Designer</option>
              <option value="General Contributor">General Contributor</option>
            </select>
          </div>

          <div className="pt-4 border-t border-nexus-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsInviteModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={UserPlus}
              loading={isSubmitting}
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
