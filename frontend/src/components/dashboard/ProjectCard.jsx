import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Calendar,
  CheckCircle2,
  Users,
  Award,
  ArrowRight,
  BarChart3,
} from 'lucide-react'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'

export function ProjectCard({ project, index = 0 }) {
  const {
    id,
    name,
    description,
    category,
    deadline,
    my_role,
    total_tasks = 0,
    completed_tasks = 0,
    progress_percentage = 0,
    members_count = 1,
    fairness_score = 90,
    status = 'Active',
    days_remaining = 14,
  } = project

  // Calculate days remaining or display deadline status
  const isOverdue = days_remaining < 0
  const isCompleted = status === 'Completed' || progress_percentage === 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="group relative bg-nexus-surface border border-nexus-border hover:border-nexus-cyan/50 rounded-xl p-6 shadow-nexus-card hover:bg-nexus-surface-hover transition-all duration-300 nexus-corner-bracket flex flex-col justify-between"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-nexus-elevated border border-nexus-border text-nexus-cyan">
              {category || 'General Capstone'}
            </span>
            <span className="text-[10px] font-mono text-nexus-muted">
              Role: <strong className="text-nexus-text">{my_role || 'Contributor'}</strong>
            </span>
          </div>

          {/* Status Pill */}
          {isCompleted ? (
            <Badge variant="lime" dot>
              COMPLETED
            </Badge>
          ) : isOverdue ? (
            <Badge variant="crimson" dot>
              OVERDUE
            </Badge>
          ) : (
            <Badge variant={days_remaining <= 3 ? 'amber' : 'cyan'} dot>
              {days_remaining}D LEFT
            </Badge>
          )}
        </div>

        {/* Project Name & Description */}
        <Link to={`/projects/${id}`} className="block group-hover:text-nexus-lime transition-colors">
          <h3 className="font-display font-bold text-lg text-nexus-text leading-snug">
            {name}
          </h3>
        </Link>
        <p className="text-xs text-nexus-muted mt-2 line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Deliverables Progress Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-nexus-muted flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-nexus-lime" />
              <span>Deliverables</span>
            </span>
            <span className="text-nexus-text font-bold">
              {completed_tasks} / {total_tasks}{' '}
              <span className="text-nexus-lime font-normal">({progress_percentage}%)</span>
            </span>
          </div>
          <div className="w-full h-2 bg-nexus-elevated rounded-full overflow-hidden border border-nexus-border">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress_percentage}%` }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.1 }}
              className="h-full bg-gradient-to-r from-nexus-cyan to-nexus-lime rounded-full"
            />
          </div>
        </div>

        {/* Project Metadata Footer */}
        <div className="mt-4 pt-3 border-t border-nexus-border flex items-center justify-between text-xs font-mono text-nexus-muted">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-nexus-cyan" />
            <span>Due {deadline}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-nexus-lime" />
            <span className="text-nexus-lime font-bold">{fairness_score}% FairScore</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-4 border-t border-nexus-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-nexus-muted font-mono">
          <Users className="w-3.5 h-3.5 text-nexus-cyan" />
          <span>{members_count} Members</span>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/projects/${id}/contribution`}>
            <Button
              variant="secondary"
              size="sm"
              icon={BarChart3}
              title="Contribution Analytics"
            >
              Analytics
            </Button>
          </Link>
          <Link to={`/projects/${id}`}>
            <Button
              variant="primary"
              size="sm"
              icon={ArrowRight}
            >
              Workspace
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
