import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  Award,
  HelpCircle,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  ShieldAlert,
} from 'lucide-react'
import { Navbar } from '../components/common/Navbar'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'
import { MetricCard } from '../components/common/MetricCard'
import { useAuth } from '../context/useAuth'
import {
  projectService,
  taskService,
  contributionService,
} from '../services/apiClient'
import {
  MOCK_PROJECTS,
  MOCK_TEAM_MEMBERS,
  MOCK_TASKS,
  MOCK_CONTRIBUTION_BREAKDOWN,
} from '../services/mockData'

// Contribution Components
import { ScoreFactorBreakdown } from '../components/contribution/ScoreFactorBreakdown'
import { ContributionNodeNetwork } from '../components/contribution/ContributionNodeNetwork'
import { TeamComparisonChart } from '../components/contribution/TeamComparisonChart'
import { ContributionTrendChart } from '../components/contribution/ContributionTrendChart'
import { ScoreExplainerModal } from '../components/contribution/ScoreExplainerModal'

// Animated Score Count-up Ticker Hook
function useCountUp(targetScore, duration = 1200) {
  const [currentScore, setCurrentScore] = useState(0)

  useEffect(() => {
    let startTimestamp = null
    const target = parseFloat(targetScore) || 0

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      // Ease-out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      setCurrentScore(parseFloat((easedProgress * target).toFixed(1)))

      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }

    const animId = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(animId)
  }, [targetScore, duration])

  return currentScore
}

export default function ContributionPage() {
  const { id: routeProjectId } = useParams()
  const { user } = useAuth()

  // State management
  const [isLoading, setIsLoading] = useState(true)
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [contributionData, setContributionData] = useState(MOCK_CONTRIBUTION_BREAKDOWN)
  const [trendData, setTrendData] = useState(MOCK_CONTRIBUTION_BREAKDOWN.trend_data)
  
  // Selected Member for inspection
  const [selectedMemberId, setSelectedMemberId] = useState(null)

  // Score Explainer Modal state
  const [isExplainerOpen, setIsExplainerOpen] = useState(false)
  const [explainerFactor, setExplainerFactor] = useState('Task Completion')

  // Load project & contribution analytics
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const projectId = routeProjectId || 'a1b2c3d4-0000-0000-0000-000000000001'

        // Parallel data loading with fallbacks
        const [projRes, tasksRes, membersRes, trendsRes] = await Promise.all([
          projectService.getProject(projectId),
          taskService.getTasks(projectId),
          contributionService.getTeamComparison(projectId),
          contributionService.getTrends(projectId),
        ])

        const currentProj = projRes.data || MOCK_PROJECTS[0]
        setProject(currentProj)

        const currentMembers = membersRes.data || currentProj.members || MOCK_TEAM_MEMBERS
        setMembers(currentMembers)

        setTasks(tasksRes.data || MOCK_TASKS)
        setTrendData(trendsRes.data || MOCK_CONTRIBUTION_BREAKDOWN.trend_data)

        // Set initial selected member (logged-in user or first member)
        const initialMember =
          currentMembers.find((m) => m.email === user?.email || m.name === user?.name) ||
          currentMembers[0]
        const initialMemberId = initialMember?.id || initialMember?.user_id || initialMember?.name
        setSelectedMemberId(initialMemberId)

        // Load contribution breakdown for member
        const contribRes = await contributionService.getContributionScore(
          projectId,
          initialMember?.id || initialMember?.user_id || 'default'
        )
        setContributionData(contribRes.data || MOCK_CONTRIBUTION_BREAKDOWN)
      } catch (err) {
        console.error('Error fetching contribution analytics:', err)
        setProject(MOCK_PROJECTS[0])
        setMembers(MOCK_TEAM_MEMBERS)
        setTasks(MOCK_TASKS)
        setContributionData(MOCK_CONTRIBUTION_BREAKDOWN)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [routeProjectId, user])

  // Handle member tab switch
  const handleSelectMember = async (member) => {
    const memberId = member.id || member.user_id || member.name
    setSelectedMemberId(memberId)

    const projectId = routeProjectId || project?.id || 'a1b2c3d4-0000-0000-0000-000000000001'
    const targetUserId = member.id || member.user_id
    if (targetUserId) {
      try {
        const res = await contributionService.getContributionScore(projectId, targetUserId)
        if (res && res.data && res.data.factors) {
          setContributionData(res.data)
          return
        }
      } catch (err) {
        console.warn('Failed to fetch contribution score for selected member, using proportional fallback:', err)
      }
    }

    // Fallback: Calculate or adjust member-specific scores dynamically
    const memberScore = member.fair_score ?? member.overall_score ?? member.score ?? 90.0
    const ratio = memberScore / 94.2

    const memberFactors = MOCK_CONTRIBUTION_BREAKDOWN.factors.map((f) => ({
      ...f,
      score: Math.min(100, Math.round(f.score * ratio)),
    }))

    setContributionData({
      ...MOCK_CONTRIBUTION_BREAKDOWN,
      overall_score: memberScore,
      tier: memberScore >= 90 ? 'High Contributor' : memberScore >= 80 ? 'Core Contributor' : 'Standard Contributor',
      grade_projection: memberScore >= 90 ? 'A+' : memberScore >= 80 ? 'A' : 'B+',
      factors: memberFactors,
    })
  }

  // Open explainer with specific factor
  const handleOpenExplainer = (factorName) => {
    setExplainerFactor(factorName)
    setIsExplainerOpen(true)
  }

  const activeMember =
    members.find(
      (m) =>
        (m.id && m.id === selectedMemberId) ||
        (m.user_id && m.user_id === selectedMemberId) ||
        m.name === selectedMemberId
    ) ||
    members[0] ||
    MOCK_TEAM_MEMBERS[0]

  const overallScore = contributionData?.overall_score || 94.2
  const animatedScore = useCountUp(overallScore, 1000)

  // Derived metrics
  const completedTasksCount = tasks.filter((t) => t.status === 'Completed').length
  const totalTasksCount = tasks.length || 20
  const completionPercentage = Math.round((completedTasksCount / totalTasksCount) * 100)
  const totalEvidenceCount = tasks.reduce((acc, t) => acc + (t.evidence?.length || 0), 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nexus-bg text-nexus-text font-sans flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
          <div className="relative">
            <span className="w-12 h-12 rounded-full border-2 border-nexus-lime/30 border-t-nexus-lime animate-spin block" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-nexus-cyan animate-ping" />
            </div>
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-nexus-muted">
            Resolving Cryptographic Contribution Index...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-nexus-bg text-nexus-text font-sans flex flex-col justify-between selection:bg-nexus-lime/20 selection:text-nexus-lime">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {/* BREADCRUMB & LIVE SYNC STATUS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to={`/projects/${routeProjectId || project?.id}`}
              className="inline-flex items-center gap-2 text-xs font-mono text-nexus-muted hover:text-nexus-lime transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>Return to Workspace</span>
            </Link>
            <span className="text-nexus-border">/</span>
            <span className="text-xs font-mono text-nexus-cyan">Contribution Analytics</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="nexus-led nexus-led-lime animate-pulse" />
            <span className="text-xs font-mono text-nexus-lime uppercase tracking-widest">
              5-Factor Audit Ledger Live
            </span>
          </div>
        </div>

        {/* HEADER HERO BANNER */}
        <div className="p-6 bg-nexus-surface border border-nexus-border rounded-xl shadow-nexus-card space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-nexus-elevated border border-nexus-border text-nexus-cyan font-bold">
                  {project?.category || 'IoT & Full-Stack'}
                </span>
                <Badge variant="lime" dot>
                  EXPLAINABLE SCORING
                </Badge>
                <span className="text-xs font-mono text-nexus-muted">
                  Project: <strong className="text-nexus-text">{project?.name}</strong>
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-nexus-text uppercase flex items-center gap-3">
                <BarChart3 className="w-7 h-7 text-nexus-lime shrink-0" />
                <span>FairShare Contribution Engine</span>
              </h1>
              <p className="text-xs sm:text-sm text-nexus-muted mt-1 font-sans max-w-3xl">
                Multi-dimensional contribution evaluation derived strictly from verifiable task completions,
                on-time delivery milestones, repository evidence, and anonymous peer feedback.
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="primary"
                size="sm"
                icon={HelpCircle}
                onClick={() => handleOpenExplainer('Task Completion')}
              >
                Why did I get this score?
              </Button>
              <Link to={`/projects/${routeProjectId || project?.id}/report`}>
                <Button variant="secondary" size="sm" icon={FileSpreadsheet}>
                  Final Audit Report
                </Button>
              </Link>
              <Link to={`/projects/${routeProjectId || project?.id}`}>
                <Button variant="ghost" size="sm">
                  Workspace Hub
                </Button>
              </Link>
            </div>
          </div>

          {/* TEAMMATE SELECTOR TABS */}
          <div className="pt-4 border-t border-nexus-border/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-nexus-muted">
                Inspect Teammate Score Breakdown:
              </span>
              <span className="text-[11px] font-mono text-nexus-cyan">
                Viewing: {activeMember.name} ({activeMember.role})
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const memberKey = member.id || member.user_id || member.name
                const isSelected =
                  selectedMemberId === memberKey ||
                  selectedMemberId === member.id ||
                  selectedMemberId === member.user_id ||
                  selectedMemberId === member.name
                const displayScore =
                  member.fair_score ?? member.overall_score ?? member.score ?? 85
                return (
                  <button
                    key={memberKey}
                    type="button"
                    onClick={() => handleSelectMember(member)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-nexus-lime/15 border-nexus-lime text-nexus-lime shadow-nexus-glow'
                        : 'bg-nexus-elevated border-nexus-border text-nexus-muted hover:text-nexus-text hover:border-nexus-border-bright'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: member.avatar_color || '#C5FF4A' }}
                    />
                    <span className="font-bold">{member.name}</span>
                    <span className="opacity-70 text-[10px]">({displayScore}%)</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* PRIMARY METRIC HUD (With Spotlight & Animated Score Ticker) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* PRIMARY SCORE TILE (SPOTLIGHT) */}
          <div className="sm:col-span-2 lg:col-span-1 group relative bg-nexus-surface border border-nexus-lime/40 rounded-xl p-5 shadow-nexus-card hover:border-nexus-lime transition-all overflow-hidden">
            {/* Subtle radial spotlight background */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-nexus-lime/10 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-nexus-muted">
                Contribution Score
              </span>
              <Award className="w-4 h-4 text-nexus-lime" />
            </div>

            <div className="flex items-baseline gap-1 my-1">
              <span className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-nexus-lime">
                {animatedScore}%
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono mt-3 pt-2 border-t border-nexus-border/60">
              <span className="text-nexus-cyan font-bold">{contributionData.tier}</span>
              <span className="px-1.5 py-0.5 rounded bg-nexus-lime/10 border border-nexus-lime/30 text-nexus-lime text-[11px] font-bold">
                PROJ: {contributionData.grade_projection}
              </span>
            </div>
          </div>

          {/* DELIVERABLES FINALIZED */}
          <MetricCard
            title="Deliverables Finalized"
            value={
              contributionData?.breakdown?.task_completion?.label ||
              `${activeMember.tasks_completed || 6} Tasks`
            }
            subtitle={`${activeMember.tasks_completed || completedTasksCount} completed (${completionPercentage}% team velocity)`}
            icon={CheckCircle2}
            trend="+100%"
            trendPositive={true}
            variant="cyan"
          />

          {/* ON-TIME DELIVERY RATE */}
          <MetricCard
            title="On-Time Delivery Rate"
            value={
              contributionData?.breakdown?.timeliness?.score !== undefined
                ? `${Math.round(contributionData.breakdown.timeliness.score)}%`
                : `${activeMember.timeliness_rate || 96}%`
            }
            subtitle={
              contributionData?.breakdown?.timeliness?.label ||
              "Completed on or before deadline timestamps"
            }
            icon={Clock}
            trend="Strict"
            trendPositive={true}
            variant="lime"
          />

          {/* VERIFIED EVIDENCE ARTIFACTS */}
          <MetricCard
            title="Verified Evidence Vault"
            value={
              activeMember.evidence_count !== undefined
                ? `${activeMember.evidence_count} Artifacts`
                : contributionData?.breakdown?.work_evidence?.points !== undefined
                ? `${contributionData.breakdown.work_evidence.points} Points`
                : `${totalEvidenceCount} Artifacts`
            }
            subtitle={
              contributionData?.breakdown?.work_evidence?.label ||
              "GitHub PRs, Figma links & technical PDFs"
            }
            icon={ShieldCheck}
            trend="Verified"
            trendPositive={true}
            variant="cyan"
          />

          {/* TEAMMATE EVALUATION */}
          <MetricCard
            title="Peer Evaluation Avg"
            value={
              contributionData?.breakdown?.peer_feedback?.label
                ? contributionData.breakdown.peer_feedback.label.includes('/')
                  ? `${contributionData.breakdown.peer_feedback.label.split(' ')[0]} / 5.0`
                  : contributionData.breakdown.peer_feedback.label
                : activeMember.peer_score
                ? `${activeMember.peer_score} / 5.0`
                : activeMember.rating
                ? `${activeMember.rating} / 5.0`
                : "4.8 / 5.0"
            }
            subtitle={
              contributionData?.breakdown?.peer_feedback?.details ||
              "Anonymous 6-dimension teammate rating"
            }
            icon={Users}
            trend="Exemplary"
            trendPositive={true}
            variant="lime"
          />
        </div>

        {/* 5-FACTOR CONTRIBUTION BREAKDOWN */}
        <ScoreFactorBreakdown
          factors={contributionData.factors}
          overallScore={overallScore}
          onOpenExplainer={handleOpenExplainer}
        />

        {/* DISTINCTIVE FEATURE: NEXUS CONTRIBUTION NODE NETWORK */}
        <ContributionNodeNetwork
          project={project}
          members={members}
          tasks={tasks}
          onNodeSelect={(node) => {
            if (node.type === 'member') {
              handleSelectMember(node.raw)
            }
          }}
        />

        {/* RECHARTS DATA VISUALIZATIONS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* TEAM CONTRIBUTION COMPARISON */}
          <TeamComparisonChart members={members} />

          {/* WEEKLY PROGRESSION TRENDS */}
          <ContributionTrendChart
            trendData={trendData}
            members={members}
          />
        </div>

        {/* ACADEMIC FAIRNESS & ANTI-GAMING GUARANTEE */}
        <div className="p-6 rounded-xl bg-nexus-surface border border-nexus-border shadow-nexus-card space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-nexus-border">
            <div className="p-2 rounded-lg bg-nexus-cyan/10 border border-nexus-cyan/30 text-nexus-cyan">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display text-base font-bold uppercase tracking-wider text-nexus-text">
                FairShare Objective Grading & Anti-Gaming Protocol
              </h4>
              <p className="text-xs text-nexus-muted font-sans">
                Principles and automated safeguards governing your contribution index.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans text-nexus-muted">
            <div className="p-3.5 rounded-lg bg-nexus-elevated/40 border border-nexus-border space-y-1.5">
              <span className="font-display font-semibold uppercase text-nexus-text flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-nexus-lime" />
                Evidence-Anchored
              </span>
              <p>
                Self-reported claims require verifiable proof—pull requests, merged diffs, design links,
                or timestamped documents—preventing inflated verbal assertions.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-nexus-elevated/40 border border-nexus-border space-y-1.5">
              <span className="font-display font-semibold uppercase text-nexus-text flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-nexus-cyan" />
                Anti-Cramming Weighting
              </span>
              <p>
                Milestones submitted consistently week-over-week are weighted higher than last-minute
                bulk submissions before final cutoff dates.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-nexus-elevated/40 border border-nexus-border space-y-1.5">
              <span className="font-display font-semibold uppercase text-nexus-text flex items-center gap-1.5">
                <Users className="w-4 h-4 text-nexus-lime" />
                Anonymous Peer Shield
              </span>
              <p>
                Peer ratings are strictly aggregated across 6 dimensions with outlier anomaly detection to
                prevent collusion or retaliatory marks.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* SCORE EXPLAINER MODAL ("Why did I get this score?") */}
      <ScoreExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
        initialFactor={explainerFactor}
        overallScore={overallScore}
      />
    </div>
  )
}
