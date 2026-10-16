import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  FolderPlus,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle2,
  Trash2,
  Plus,
  Zap,
} from 'lucide-react'
import { projectService } from '../services/apiClient'
import { Navbar } from '../components/common/Navbar'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'

export default function CreateProjectPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('IoT & Full-Stack')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [deadline, setDeadline] = useState('2026-11-30')
  const [members, setMembers] = useState([
    { email: 'rohit@college.edu', role: 'Backend Architect' },
    { email: 'denesh@college.edu', role: 'IoT Hardware Lead' },
  ])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('')

  const categories = [
    'IoT & Full-Stack',
    'AI & Machine Learning',
    'Robotics & Embedded',
    'Web3 & Security',
    'Mobile & Cloud',
    'Data Science & Capstone',
  ]

  const addMember = () => {
    if (!newMemberEmail) return
    setMembers([
      ...members,
      {
        email: newMemberEmail,
        role: newMemberRole || 'Software Engineer',
      },
    ])
    setNewMemberEmail('')
    setNewMemberRole('')
  }

  const removeMember = (indexToRemove) => {
    setMembers(members.filter((_, i) => i !== indexToRemove))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        name,
        description,
        category,
        start_date: startDate,
        deadline,
        members,
      }

      const res = await projectService.createProject(payload)
      if (res?.success) {
        // Navigate to the newly created project workspace or dashboard
        const projectId = res.data?.id || res.data?.project_id || 'a1b2c3d4-0000-0000-0000-000000000001'
        navigate(`/projects/${projectId}`)
      }
    } catch (err) {
      console.error('Failed to create project:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-nexus-bg text-nexus-text font-sans flex flex-col justify-between selection:bg-nexus-lime/20 selection:text-nexus-lime">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Top Header */}
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nexus-surface border border-nexus-border text-xs font-mono text-nexus-lime">
            <span className="nexus-led nexus-led-lime" />
            <span>NEXUS WORKSPACE ONBOARDING</span>
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl uppercase tracking-tight text-nexus-text">
            Enlist Academic Project
          </h1>
          <p className="text-xs sm:text-sm text-nexus-muted">
            Configure your team workspace, establish milestones, and invite collaborators.
          </p>
        </div>

        {/* 3-Step Wizard Navigation Indicator */}
        <div className="grid grid-cols-3 gap-2 mb-8">
          {[
            { num: 1, label: 'Identity', icon: FolderPlus },
            { num: 2, label: 'Timeline', icon: Calendar },
            { num: 3, label: 'Team', icon: Users },
          ].map((s) => {
            const Icon = s.icon
            const isCurrent = step === s.num
            const isCompleted = step > s.num
            return (
              <div
                key={s.num}
                className={`p-3 rounded-lg border text-center transition-all ${
                  isCurrent
                    ? 'bg-nexus-surface border-nexus-lime shadow-nexus-glow text-nexus-lime'
                    : isCompleted
                    ? 'bg-nexus-surface/60 border-nexus-border text-nexus-cyan'
                    : 'bg-nexus-surface/30 border-nexus-border text-nexus-muted'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-nexus-lime" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="text-xs font-mono font-bold uppercase hidden sm:inline">
                    {s.num}. {s.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Wizard Form Container */}
        <div className="bg-nexus-surface border border-nexus-border rounded-xl p-6 sm:p-8 shadow-nexus-card nexus-corner-bracket">
          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(step + 1); }}>
            <AnimatePresence mode="wait">
              {/* STEP 1: PROJECT IDENTITY */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="border-b border-nexus-border pb-3">
                    <h2 className="font-display font-bold text-lg text-nexus-text uppercase">
                      Step 1: Project Identity & Domain
                    </h2>
                    <p className="text-xs text-nexus-muted mt-1">
                      Give your capstone or hackathon project a clear, descriptive technical title.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-nexus-muted uppercase">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Smart Water Management System"
                      className="w-full px-4 py-2.5 bg-nexus-elevated border border-nexus-border rounded-lg text-xs font-mono text-nexus-text focus:outline-none focus:border-nexus-lime focus:ring-1 focus:ring-nexus-lime transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-nexus-muted uppercase">
                      Category & Domain *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`p-2.5 rounded-lg border text-left text-xs font-mono transition-all cursor-pointer ${
                            category === cat
                              ? 'bg-nexus-elevated border-nexus-cyan text-nexus-cyan shadow-nexus-cyan-glow'
                              : 'bg-nexus-surface border-nexus-border text-nexus-muted hover:text-nexus-text hover:border-nexus-border-bright'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-nexus-muted uppercase">
                      Abstract / Description
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief overview of problem statement, architecture stack, and deliverables..."
                      className="w-full px-4 py-2 bg-nexus-elevated border border-nexus-border rounded-lg text-xs font-mono text-nexus-text focus:outline-none focus:border-nexus-lime focus:ring-1 focus:ring-nexus-lime transition-colors"
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 2: TIMELINE & MILESTONES */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="border-b border-nexus-border pb-3">
                    <h2 className="font-display font-bold text-lg text-nexus-text uppercase">
                      Step 2: Milestone Timeline & Cutoffs
                    </h2>
                    <p className="text-xs text-nexus-muted mt-1">
                      Establish baseline dates for the timeliness algorithm.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-nexus-muted uppercase">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-nexus-elevated border border-nexus-border rounded-lg text-xs font-mono text-nexus-text focus:outline-none focus:border-nexus-lime focus:ring-1 focus:ring-nexus-lime transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-mono text-nexus-muted uppercase">
                        Final Capstone Deadline *
                      </label>
                      <input
                        type="date"
                        required
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full px-4 py-2.5 bg-nexus-elevated border border-nexus-border rounded-lg text-xs font-mono text-nexus-text focus:outline-none focus:border-nexus-lime focus:ring-1 focus:ring-nexus-lime transition-colors"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-nexus-elevated border border-nexus-border space-y-2 text-xs font-mono">
                    <div className="flex items-center gap-2 text-nexus-amber font-bold">
                      <Calendar className="w-4 h-4" />
                      <span>TIMELINESS WEIGHTING IMPACT</span>
                    </div>
                    <p className="text-nexus-muted text-[11px] font-sans">
                      Deliverables completed ahead of this deadline earn full 20% timeliness points.
                      Work checked in past midnight on the deadline incurs gradual score decay.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: TEAM ENLISTMENT */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="border-b border-nexus-border pb-3">
                    <h2 className="font-display font-bold text-lg text-nexus-text uppercase">
                      Step 3: Team Roster & Invitations
                    </h2>
                    <p className="text-xs text-nexus-muted mt-1">
                      Enlist teammates. If they don't have an account yet, FairShare will queue an automatic invite.
                    </p>
                  </div>

                  {/* Add Teammate Input Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                    <div className="sm:col-span-6 space-y-1">
                      <label className="text-[11px] font-mono text-nexus-muted uppercase">
                        Teammate Academic Email
                      </label>
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="teammate@college.edu"
                        className="w-full px-3 py-2 bg-nexus-elevated border border-nexus-border rounded-lg text-xs font-mono text-nexus-text focus:outline-none focus:border-nexus-lime"
                      />
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-[11px] font-mono text-nexus-muted uppercase">
                        Project Role
                      </label>
                      <input
                        type="text"
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        placeholder="e.g. Backend Architect"
                        className="w-full px-3 py-2 bg-nexus-elevated border border-nexus-border rounded-lg text-xs font-mono text-nexus-text focus:outline-none focus:border-nexus-lime"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Button
                        type="button"
                        variant="cyan"
                        size="md"
                        icon={Plus}
                        onClick={addMember}
                        fullWidth
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Current Member Roster */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-mono text-nexus-muted uppercase">
                      Enlisted Collaborators ({members.length + 1})
                    </span>

                    {/* Creator Pill */}
                    <div className="p-3 rounded-lg bg-nexus-elevated border border-nexus-border flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-nexus-lime" />
                        <span className="text-nexus-text font-bold">You (Project Creator)</span>
                      </div>
                      <Badge variant="lime">CREATOR / LEAD</Badge>
                    </div>

                    {/* Added Members */}
                    {members.map((m, idx) => (
                      <div
                        key={m.email}
                        className="p-3 rounded-lg bg-nexus-elevated border border-nexus-border flex items-center justify-between text-xs font-mono"
                      >
                        <div className="space-y-0.5">
                          <div className="text-nexus-text">{m.email}</div>
                          <div className="text-[10px] text-nexus-cyan">{m.role}</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeMember(idx)}
                          className="p-1 text-nexus-muted hover:text-nexus-crimson cursor-pointer"
                          aria-label="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stepper Navigation Controls */}
            <div className="mt-8 pt-6 border-t border-nexus-border flex items-center justify-between gap-4">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="secondary"
                  icon={ArrowLeft}
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
              ) : (
                <Link to="/dashboard">
                  <Button variant="ghost">Cancel</Button>
                </Link>
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  variant="primary"
                  icon={ArrowRight}
                  onClick={() => {
                    if (step === 1 && !name) {
                      setName('Smart Water Management System')
                    }
                    setStep(step + 1)
                  }}
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  loading={isLoading}
                  icon={Zap}
                >
                  Finalize & Launch Workspace
                </Button>
              )}
            </div>
          </form>
        </div>
      </main>

      <footer className="border-t border-nexus-border py-6 px-4 max-w-7xl mx-auto w-full text-center text-xs text-nexus-muted font-mono">
        FairShare Project Initialization Protocol · Step {step} of 3
      </footer>
    </div>
  )
}
