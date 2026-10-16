import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderPlus,
  Award,
  CheckCircle2,
  Clock,
  Terminal,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { projectService } from '../services/apiClient'
import { Navbar } from '../components/common/Navbar'
import { ProjectCard } from '../components/dashboard/ProjectCard'
import { UpcomingDeadlines } from '../components/dashboard/UpcomingDeadlines'
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed'
import { MetricCard } from '../components/common/MetricCard'
import { Button } from '../components/common/Button'

export default function DashboardPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [deadlines, setDeadlines] = useState([])
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [projRes, deadRes, actRes] = await Promise.all([
          projectService.listProjects(),
          projectService.getUpcomingDeadlines(),
          projectService.getActivityLogs('a1b2c3d4-0000-0000-0000-000000000001'),
        ])

        if (projRes?.success) setProjects(projRes.data)
        if (deadRes?.success) setDeadlines(deadRes.data)
        if (actRes?.success) setActivities(actRes.data)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Calculate HUD Metrics
  const activeCount = projects.filter((p) => p.status === 'Active').length
  const totalCompletedTasks = projects.reduce((acc, p) => acc + (p.completed_tasks || 0), 0)
  const avgFairScore =
    projects.length > 0
      ? (projects.reduce((acc, p) => acc + (p.fairness_score || 90), 0) / projects.length).toFixed(1)
      : '92.4'

  return (
    <div className="min-h-screen bg-nexus-bg text-nexus-text font-sans flex flex-col justify-between selection:bg-nexus-lime/20 selection:text-nexus-lime">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10 flex-1">
        {/* HUD HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-nexus-border">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-lime uppercase tracking-widest mb-1.5">
              <Terminal className="w-4 h-4" />
              <span>NEXUS Global Operations HUD</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-nexus-text uppercase">
              Welcome, <span className="text-nexus-lime">{user?.name || 'Engineer'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-nexus-muted mt-1 font-sans">
              Enrolled at <strong className="text-nexus-text">{user?.college || 'MIT Institute of Technology'}</strong> · Active telemetry synchronization enabled.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/projects/new">
              <Button variant="primary" icon={FolderPlus}>
                Enlist New Project
              </Button>
            </Link>
          </div>
        </div>

        {/* METRICS HUD ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title="Enrolled Projects"
            value={projects.length}
            subtitle={`${activeCount} active engineering workspaces`}
            icon={LayoutDashboard}
            trend="Active"
            trendPositive={true}
            variant="cyan"
          />
          <MetricCard
            title="Completed Deliverables"
            value={totalCompletedTasks}
            subtitle="Verified artifacts attached"
            icon={CheckCircle2}
            trend="+6 this cycle"
            trendPositive={true}
            variant="lime"
          />
          <MetricCard
            title="Approaching Milestones"
            value={deadlines.length}
            subtitle="Due in next 72 hours"
            icon={Clock}
            trend={deadlines.length > 0 ? 'Urgent' : 'Clear'}
            trendPositive={deadlines.length === 0}
            variant="amber"
          />
          <MetricCard
            title="Average FairScore"
            value={`${avgFairScore}%`}
            subtitle="5-factor academic fairness"
            icon={Award}
            trend="Top 5%"
            trendPositive={true}
            variant="lime"
          />
        </div>

        {/* MAIN TWO-COLUMN DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Active Projects Grid (8 cols) */}
          <section className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-nexus-border">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-nexus-lime" />
                <h2 className="font-display font-bold text-lg text-nexus-text uppercase tracking-wide">
                  Active Project Workspaces
                </h2>
              </div>
              <span className="text-xs font-mono text-nexus-muted">
                {projects.length} Total Enrolled
              </span>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-xs font-mono text-nexus-muted space-y-2">
                <div className="animate-spin w-6 h-6 border-2 border-nexus-lime border-t-transparent rounded-full mx-auto" />
                <p>Retrieving active node telemetry...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-nexus-surface border border-nexus-border rounded-xl p-12 text-center space-y-4">
                <FolderPlus className="w-10 h-10 text-nexus-muted mx-auto" />
                <h3 className="font-display font-bold text-lg text-nexus-text">No Projects Enlisted</h3>
                <p className="text-xs text-nexus-muted max-w-sm mx-auto">
                  Create your first collaborative academic project or hackathon workspace.
                </p>
                <Link to="/projects/new">
                  <Button variant="primary" icon={FolderPlus}>
                    Start Project Wizard
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((proj, idx) => (
                  <ProjectCard key={proj.id} project={proj} index={idx} />
                ))}
              </div>
            )}
          </section>

          {/* Right Column: Deadlines & Live Stream (4 cols) */}
          <aside className="lg:col-span-4 space-y-8">
            <UpcomingDeadlines deadlines={deadlines} />
            <RecentActivityFeed activities={activities} />
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-nexus-border py-6 px-4 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between text-xs text-nexus-muted gap-3">
        <div className="flex items-center gap-2">
          <span className="nexus-led nexus-led-lime" />
          <span>FairShare NEXUS Core · Global HUD</span>
        </div>
        <span className="font-mono text-[11px]">Academic Integrity & Transparency Standard</span>
      </footer>
    </div>
  )
}
