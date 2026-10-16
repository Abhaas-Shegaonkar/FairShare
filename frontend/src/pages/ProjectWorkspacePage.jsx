import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  LayoutDashboard,
  Columns,
  Paperclip,
  Activity,
  Users,
  BarChart3,
  FileSpreadsheet,
  ArrowLeft,
  Plus,
} from 'lucide-react'
import { ProjectProvider } from '../context/ProjectContext'
import { useProject } from '../context/useProject'
import { Navbar } from '../components/common/Navbar'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'

// 5 Workspace Sub-Modules
import { OverviewTab } from '../components/workspace/OverviewTab'
import { TaskBoard } from '../components/workspace/TaskBoard'
import { EvidenceVault } from '../components/workspace/EvidenceVault'
import { ActivityTimeline } from '../components/workspace/ActivityTimeline'
import { TeamDirectory } from '../components/workspace/TeamDirectory'

// Modals
import { CreateTaskModal } from '../components/workspace/CreateTaskModal'
import { SubmitEvidenceModal } from '../components/workspace/SubmitEvidenceModal'
import { PeerFeedbackModal } from '../components/feedback/PeerFeedbackModal'

function WorkspaceInner() {
  const {
    projectId,
    project,
    tasks,
    evidence,
    activities,
    activeTab,
    setActiveTab,
    isLoading,
    changeTaskStatus,
    addTask,
    addEvidence,
    uploadFile,
    inviteMember,
  } = useProject()

  // Modal states
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [isSubmitEvidenceModalOpen, setIsSubmitEvidenceModalOpen] = useState(false)
  const [selectedTaskForEvidence, setSelectedTaskForEvidence] = useState(null)
  const [isPeerFeedbackModalOpen, setIsPeerFeedbackModalOpen] = useState(false)

  const handleOpenAttachEvidence = (task) => {
    setSelectedTaskForEvidence(task)
    setIsSubmitEvidenceModalOpen(true)
  }

  const handleOpenGeneralSubmitEvidence = () => {
    setSelectedTaskForEvidence(null)
    setIsSubmitEvidenceModalOpen(true)
  }

  const tabItems = [
    { id: 'overview', label: '1. Overview', icon: LayoutDashboard },
    {
      id: 'tasks',
      label: '2. Tasks & Kanban',
      icon: Columns,
      badge: tasks.filter((t) => t.status !== 'Completed').length,
    },
    {
      id: 'evidence',
      label: '3. Evidence Vault',
      icon: Paperclip,
      badge: evidence.length,
    },
    {
      id: 'activity',
      label: '4. Activity Stream',
      icon: Activity,
      dot: true,
    },
    {
      id: 'roster',
      label: '5. Team Roster',
      icon: Users,
      badge: project?.members?.length || 4,
    },
  ]

  const daysLeft = project?.days_remaining ?? 14
  const isOverdue = daysLeft < 0
  const isCompleted = project?.status === 'Completed' || project?.progress_percentage === 100

  return (
    <div className="min-h-screen bg-nexus-bg text-nexus-text font-sans flex flex-col justify-between selection:bg-nexus-lime/20 selection:text-nexus-lime">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
        {/* BACK TO HUD & TOP BREADCRUMB */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-mono text-nexus-muted hover:text-nexus-lime transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Return to Global HUD</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="nexus-led nexus-led-lime" />
            <span className="text-xs font-mono text-nexus-lime uppercase tracking-widest hidden sm:inline">
              NEXUS Node Sync Active
            </span>
          </div>
        </div>

        {/* WORKSPACE PROJECT HEADER */}
        <div className="p-6 bg-nexus-surface border border-nexus-border rounded-xl shadow-nexus-card space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              {/* Project Category & Status Row */}
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-nexus-elevated border border-nexus-border text-nexus-cyan font-bold">
                  {project?.category || 'IoT & Full-Stack'}
                </span>
                <span className="text-xs font-mono text-nexus-muted">
                  Role: <strong className="text-nexus-text">{project?.my_role || 'Frontend Lead'}</strong>
                </span>
                {isCompleted ? (
                  <Badge variant="lime" dot>
                    COMPLETED
                  </Badge>
                ) : isOverdue ? (
                  <Badge variant="crimson" dot>
                    OVERDUE
                  </Badge>
                ) : (
                  <Badge variant={daysLeft <= 3 ? 'amber' : 'cyan'} dot>
                    {daysLeft}D REMAINING
                  </Badge>
                )}
              </div>

              {/* Project Title */}
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-nexus-text uppercase">
                {project?.name || 'Smart Water Management System'}
              </h1>
              <p className="text-xs sm:text-sm text-nexus-muted mt-1 font-sans line-clamp-2 max-w-3xl">
                {project?.description ||
                  'Collaborative engineering workspace with objective 5-factor contribution tracking.'}
              </p>
            </div>

            {/* Quick Action Navigation CTAs */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link to={`/projects/${projectId}/contribution`}>
                <Button variant="secondary" size="sm" icon={BarChart3}>
                  Contribution Analytics
                </Button>
              </Link>
              <Link to={`/projects/${projectId}/report`}>
                <Button variant="secondary" size="sm" icon={FileSpreadsheet}>
                  Final Audit Report
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setIsCreateTaskModalOpen(true)}
              >
                New Deliverable
              </Button>
            </div>
          </div>
        </div>

        {/* WORKSPACE 5-TAB NAVIGATION (Animated via layoutId) */}
        <div className="border-b border-nexus-border">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2 scrollbar-none" aria-label="Workspace Tabs">
            {tabItems.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer flex-shrink-0 ${
                    isActive ? 'text-nexus-lime font-bold' : 'text-nexus-muted hover:text-nexus-text hover:bg-nexus-surface/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>

                  {tab.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-nexus-lime/20 text-nexus-lime border border-nexus-lime/40'
                          : 'bg-nexus-elevated text-nexus-muted border border-nexus-border'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}

                  {tab.dot && (
                    <span className="nexus-led nexus-led-cyan w-1.5 h-1.5" />
                  )}

                  {/* Motion Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="active-workspace-tab"
                      className="absolute inset-0 border border-nexus-lime/50 bg-nexus-lime/5 rounded-lg -z-10 shadow-sm"
                      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* TAB CONTENT PANELS */}
        <div className="pt-2">
          {isLoading ? (
            <div className="py-20 text-center space-y-3 font-mono text-xs text-nexus-muted">
              <div className="animate-spin w-6 h-6 border-2 border-nexus-lime border-t-transparent rounded-full mx-auto" />
              <p>Synchronizing project workspace state...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'overview' && (
                  <OverviewTab
                    project={project}
                    tasks={tasks}
                    evidence={evidence}
                    members={project?.members || []}
                    onSwitchTab={setActiveTab}
                    onOpenPeerFeedback={() => setIsPeerFeedbackModalOpen(true)}
                  />
                )}

                {activeTab === 'tasks' && (
                  <TaskBoard
                    tasks={tasks}
                    members={project?.members || []}
                    onStatusChange={changeTaskStatus}
                    onAttachEvidence={handleOpenAttachEvidence}
                    onOpenCreateTask={() => setIsCreateTaskModalOpen(true)}
                  />
                )}

                {activeTab === 'evidence' && (
                  <EvidenceVault
                    evidence={evidence}
                    members={project?.members || []}
                    onOpenSubmitEvidence={handleOpenGeneralSubmitEvidence}
                  />
                )}

                {activeTab === 'activity' && (
                  <ActivityTimeline activities={activities} />
                )}

                {activeTab === 'roster' && (
                  <TeamDirectory
                    members={project?.members || []}
                    onInviteMember={inviteMember}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* CREATE TASK MODAL */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        members={project?.members || []}
        onCreateTask={addTask}
      />

      {/* SUBMIT EVIDENCE MODAL */}
      <SubmitEvidenceModal
        isOpen={isSubmitEvidenceModalOpen}
        onClose={() => {
          setIsSubmitEvidenceModalOpen(false)
          setSelectedTaskForEvidence(null)
        }}
        tasks={tasks}
        selectedTask={selectedTaskForEvidence}
        onAttachEvidence={addEvidence}
        onUploadFile={uploadFile}
      />

      {/* PEER REVIEW MODAL */}
      <PeerFeedbackModal
        isOpen={isPeerFeedbackModalOpen}
        onClose={() => setIsPeerFeedbackModalOpen(false)}
        project={project}
        members={project?.members || []}
      />

      {/* FOOTER */}
      <footer className="border-t border-nexus-border py-6 px-4 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between text-xs text-nexus-muted gap-3">
        <div className="flex items-center gap-2">
          <span className="nexus-led nexus-led-lime" />
          <span>FairShare NEXUS Core · Workspace Hub</span>
        </div>
        <span className="font-mono text-[11px]">Milestone Tracking & Evidence Verification Standard</span>
      </footer>
    </div>
  )
}

export default function ProjectWorkspacePage() {
  const { id } = useParams()
  const activeProjectId = id || 'a1b2c3d4-0000-0000-0000-000000000001'

  return (
    <ProjectProvider projectId={activeProjectId}>
      <WorkspaceInner />
    </ProjectProvider>
  )
}
