import React, { useState } from 'react'
import { motion } from 'motion/react'
import {
  Users,
  X,
  Star,
  CheckCircle2,
  ShieldCheck,
  Lock,
  MessageSquare,
  AlertCircle,
  Send,
} from 'lucide-react'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { contributionService } from '../../services/apiClient'
import { useAuth } from '../../context/useAuth'

const RATING_DIMENSIONS = [
  {
    key: 'participation',
    label: '1. Active Participation',
    description: 'Involvement in discussions, sprint planning, and problem-solving sessions.',
  },
  {
    key: 'responsibility',
    label: '2. Ownership & Responsibility',
    description: 'Reliability in taking initiative and completing assigned deliverables.',
  },
  {
    key: 'quality',
    label: '3. Quality of Deliverables',
    description: 'Standard, thoroughness, test coverage, and documentation of work.',
  },
  {
    key: 'collaboration',
    label: '4. Teamwork & Collaboration',
    description: 'Willingness to assist peers, unblock blockers, and share knowledge.',
  },
  {
    key: 'communication',
    label: '5. Clear Communication',
    description: 'Prompt status updates, transparent blockers, and constructive dialogue.',
  },
  {
    key: 'timeliness',
    label: '6. Milestone Timeliness',
    description: 'Adherence to internal commitments, review timelines, and milestone cutoffs.',
  },
]

const SCORE_LABELS = {
  1: { text: 'Needs Improvement', color: '#FF4D4D' },
  2: { text: 'Marginal', color: '#F59E0B' },
  3: { text: 'Competent / Solid', color: '#52E8D1' },
  4: { text: 'Commendable', color: '#C5FF4A' },
  5: { text: 'Exemplary Standard', color: '#C5FF4A' },
}

export function PeerFeedbackModal({
  isOpen,
  onClose,
  project,
  members = [],
  onFeedbackSubmitted,
}) {
  const { user } = useAuth()

  // Eligible teammates excluding self
  const currentUserId = user?.id || 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0'
  const currentUserEmail = user?.email || 'abhaas@college.edu'

  const eligibleReviewees = members.filter(
    (m) => m.id !== currentUserId && m.email !== currentUserEmail
  )

  const [selectedRevieweeId, setSelectedRevieweeId] = useState(
    eligibleReviewees[0]?.id || eligibleReviewees[0]?.name || null
  )

  const [ratings, setRatings] = useState({
    participation: 5,
    responsibility: 5,
    quality: 4,
    collaboration: 5,
    communication: 4,
    timeliness: 5,
  })

  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  if (!isOpen) return null

  const activeReviewee =
    eligibleReviewees.find(
      (m) => m.id === selectedRevieweeId || m.name === selectedRevieweeId
    ) || eligibleReviewees[0]

  const calculateAverageRating = () => {
    const values = Object.values(ratings)
    const sum = values.reduce((a, b) => a + b, 0)
    return (sum / values.length).toFixed(1)
  }

  const handleRatingChange = (dimensionKey, score) => {
    setRatings((prev) => ({
      ...prev,
      [dimensionKey]: score,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!activeReviewee) return

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const payload = {
        reviewer_id: currentUserId,
        reviewee_id: activeReviewee.id || activeReviewee.name,
        ratings,
        feedback: comments.trim(),
        submitted_at: new Date().toISOString(),
      }

      await contributionService.submitPeerFeedback(
        project?.id || 'a1b2c3d4-0000-0000-0000-000000000001',
        payload
      )

      setSubmitSuccess(true)
      onFeedbackSubmitted?.()

      setTimeout(() => {
        setSubmitSuccess(false)
        setComments('')
        onClose()
      }, 1800)
    } catch (err) {
      console.error('Peer feedback submission failed:', err)
      setErrorMessage('Submission encountered an error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
        aria-labelledby="peer-feedback-title"
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-nexus-elevated border-b border-nexus-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-nexus-lime/10 border border-nexus-lime/30 text-nexus-lime">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="peer-feedback-title"
                className="font-display text-base font-bold uppercase tracking-wider text-nexus-text"
              >
                Anonymous 360° Teammate Evaluation
              </h2>
              <p className="text-xs text-nexus-muted font-mono">
                6-Dimension Collaborative Equity Metric · Blind Review
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-nexus-muted hover:text-nexus-text hover:bg-nexus-surface transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECURITY & ANONYMITY BANNER */}
        <div className="px-6 py-3 bg-nexus-bg/60 border-b border-nexus-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-nexus-cyan">
            <Lock className="w-3.5 h-3.5" />
            <span className="font-mono">Double-Blind Cryptographic Anonymity Enforced</span>
          </div>
          <div className="flex items-center gap-2">
            {project?.days_remaining > 3 && (
              <Badge variant="amber" dot>
                DEMO EVALUATION ACTIVE · 72H WINDOW SCHEDULED
              </Badge>
            )}
            <Badge variant="cyan" dot>
              ANTI-SELF-REVIEW ACTIVE
            </Badge>
          </div>
        </div>

        {submitSuccess ? (
          /* SUCCESS STATE */
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-nexus-lime/10 border border-nexus-lime text-nexus-lime flex items-center justify-center shadow-nexus-glow">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-display text-lg font-bold text-nexus-text uppercase">
              Peer Review Recorded Anonymously
            </h3>
            <p className="text-xs text-nexus-muted max-w-md font-sans">
              Thank you for contributing to fair grading. Your ratings for{' '}
              <strong className="text-nexus-text">{activeReviewee?.name}</strong> have been
              anonymized and factored into the 360° peer review ledger.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* SELECT TEAMMATE TO REVIEW */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-nexus-muted">
                Select Teammate to Evaluate:
              </label>
              {eligibleReviewees.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {eligibleReviewees.map((member) => {
                    const isSelected =
                      (activeReviewee?.id || activeReviewee?.name) === (member.id || member.name)
                    return (
                      <button
                        key={member.id || member.name}
                        type="button"
                        onClick={() => setSelectedRevieweeId(member.id || member.name)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-nexus-lime/15 border-nexus-lime text-nexus-lime shadow-sm'
                            : 'bg-nexus-elevated border-nexus-border text-nexus-muted hover:text-nexus-text'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: member.avatar_color || '#52E8D1' }}
                        />
                        <span className="font-bold">{member.name}</span>
                        <span className="opacity-60 text-[10px]">({member.role})</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-nexus-bg border border-nexus-border text-xs text-nexus-muted">
                  No other active teammates found in this workspace roster.
                </div>
              )}
            </div>

            {/* LIVE SCORE SUMMARY FOR REVIEWEE */}
            {activeReviewee && (
              <div className="p-3.5 rounded-lg bg-nexus-bg border border-nexus-border/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="nexus-led nexus-led-lime" />
                  <span className="text-xs font-mono text-nexus-muted">
                    Rating for <strong className="text-nexus-text">{activeReviewee.name}</strong>:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-nexus-muted">Composite Index:</span>
                  <span className="font-display font-bold text-base text-nexus-lime">
                    {calculateAverageRating()} / 5.0
                  </span>
                </div>
              </div>
            )}

            {/* 6 RATING DIMENSIONS */}
            <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
              {RATING_DIMENSIONS.map((dimension) => {
                const currentScore = ratings[dimension.key] || 5
                const scoreInfo = SCORE_LABELS[currentScore] || SCORE_LABELS[5]

                return (
                  <div
                    key={dimension.key}
                    className="p-3.5 rounded-lg bg-nexus-elevated/40 border border-nexus-border/70 hover:border-nexus-border space-y-2 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-display text-xs font-semibold uppercase text-nexus-text tracking-wide">
                          {dimension.label}
                        </span>
                        <p className="text-[11px] text-nexus-muted font-sans mt-0.5">
                          {dimension.description}
                        </p>
                      </div>

                      {/* 1 to 5 clickable buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                        {[1, 2, 3, 4, 5].map((starValue) => {
                          const isActive = starValue <= currentScore
                          return (
                            <button
                              key={starValue}
                              type="button"
                              onClick={() => handleRatingChange(dimension.key, starValue)}
                              className={`p-1.5 rounded transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-nexus-lime/10 text-nexus-lime hover:scale-110'
                                  : 'text-nexus-border-bright hover:text-nexus-muted'
                              }`}
                              title={`${starValue} / 5`}
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  isActive ? 'fill-nexus-lime text-nexus-lime' : ''
                                }`}
                              />
                            </button>
                          )
                        })}
                        <span
                          className="text-[10px] font-mono px-2 py-0.5 rounded border ml-1 min-w-[70px] text-center"
                          style={{
                            color: scoreInfo.color,
                            borderColor: `${scoreInfo.color}40`,
                            backgroundColor: `${scoreInfo.color}10`,
                          }}
                        >
                          {currentScore} · {scoreInfo.text}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* QUALITATIVE FEEDBACK NOTES */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono uppercase tracking-wider text-nexus-muted flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-nexus-cyan" />
                  <span>Constructive Feedback Notes (Optional & Anonymous)</span>
                </label>
                <span className="text-[10px] font-mono text-nexus-muted">
                  {comments.length}/500
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share constructive observations regarding strengths or collaborative opportunities..."
                className="w-full bg-nexus-bg border border-nexus-border rounded-lg p-3 text-xs text-nexus-text placeholder-nexus-muted focus:outline-none focus:border-nexus-lime transition-colors resize-none font-sans"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-nexus-crimson/10 border border-nexus-crimson/40 text-nexus-crimson text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ACTIONS */}
            <div className="pt-2 flex items-center justify-between border-t border-nexus-border/60">
              <span className="text-[11px] font-mono text-nexus-muted flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-nexus-lime" />
                <span>Confidential peer audit log</span>
              </span>

              <div className="flex items-center gap-2.5">
                <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  icon={Send}
                  loading={isSubmitting}
                  disabled={!activeReviewee || isSubmitting}
                >
                  Submit Anonymous Review
                </Button>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}
