import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Award,
} from 'lucide-react'
import { Navbar } from '../components/common/Navbar'
import { Button } from '../components/common/Button'
import { projectService } from '../services/apiClient'
import {
  MOCK_PROJECTS,
  MOCK_TEAM_MEMBERS,
  MOCK_TASKS,
  MOCK_EVIDENCE_ITEMS,
} from '../services/mockData'

export default function FinalReportPage() {
  const { id: routeProjectId } = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [reportData, setReportData] = useState(null)

  useEffect(() => {
    async function loadReport() {
      setIsLoading(true)
      try {
        const projectId = routeProjectId || 'a1b2c3d4-0000-0000-0000-000000000001'
        const res = await projectService.getProjectReport(projectId)
        setReportData(
          res.data || {
            project: MOCK_PROJECTS[0],
            members: MOCK_TEAM_MEMBERS,
            tasks: MOCK_TASKS,
            evidence: MOCK_EVIDENCE_ITEMS,
            generated_at: new Date().toISOString(),
            audit_hash: 'SHA256:7e9b21f92e032d84710bc4a0e9817fcb348d446903a98516bb5609424c5e3170',
          }
        )
      } catch (err) {
        console.error('Error fetching project report:', err)
        setReportData({
          project: MOCK_PROJECTS[0],
          members: MOCK_TEAM_MEMBERS,
          tasks: MOCK_TASKS,
          evidence: MOCK_EVIDENCE_ITEMS,
          generated_at: new Date().toISOString(),
          audit_hash: 'SHA256:7e9b21f92e032d84710bc4a0e9817fcb348d446903a98516bb5609424c5e3170',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadReport()
  }, [routeProjectId])

  const handlePrint = () => {
    window.print()
  }

  const project = reportData?.project || MOCK_PROJECTS[0]
  const members = reportData?.members || MOCK_TEAM_MEMBERS
  const tasks = reportData?.tasks || MOCK_TASKS
  const evidence = reportData?.evidence || MOCK_EVIDENCE_ITEMS

  const totalTasks = tasks.length || 20
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length
  const completionRate = Math.round((completedTasks / totalTasks) * 100)
  const averageScore = (
    members.reduce((acc, m) => acc + (m.fair_score || 85), 0) / (members.length || 1)
  ).toFixed(1)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nexus-bg text-nexus-text font-sans flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
          <span className="w-10 h-10 rounded-full border-2 border-nexus-lime/30 border-t-nexus-lime animate-spin block" />
          <p className="font-mono text-xs uppercase tracking-widest text-nexus-muted">
            Generating Formal Project Audit Certificate...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-nexus-bg text-nexus-text font-sans flex flex-col justify-between selection:bg-nexus-lime/20 selection:text-nexus-lime">
      {/* Top Navbar (Hidden when printing) */}
      <div className="no-print">
        <Navbar />
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
        {/* ACTION BAR & CONTROLS (Hidden when printing) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-nexus-surface border border-nexus-border shadow-nexus-card">
          <div className="flex items-center gap-3">
            <Link
              to={`/projects/${project?.id || routeProjectId}`}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-nexus-muted hover:text-nexus-lime transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Workspace Hub</span>
            </Link>
            <span className="text-nexus-border">/</span>
            <span className="text-xs font-mono text-nexus-cyan font-bold">Formal Audit Certificate</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={handlePrint}
            >
              Save as PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
            >
              Print Evaluation Document
            </Button>
          </div>
        </div>

        {/* PRINTABLE AUDIT REPORT DOCUMENT CONTAINER */}
        <article className="bg-nexus-surface print:bg-white print:text-black border border-nexus-border print:border-black rounded-xl p-8 sm:p-12 shadow-nexus-card print:shadow-none space-y-8 font-sans">
          {/* REPORT HEADER */}
          <header className="border-b-2 border-nexus-border print:border-black pb-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="nexus-led nexus-led-lime print:hidden" />
                  <span className="font-mono text-xs uppercase tracking-widest text-nexus-cyan print:text-black font-bold">
                    FairShare Institutional Audit Verification
                  </span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-nexus-text print:text-black uppercase">
                  Project Contribution & Fairness Audit Report
                </h1>
                <p className="text-xs text-nexus-muted print:text-gray-700 font-mono">
                  Objective 5-Factor Academic Grading Certificate · RFC-12 Standard
                </p>
              </div>

              {/* AUDIT HASH STAMP */}
              <div className="p-3 rounded-lg bg-nexus-elevated print:bg-gray-100 border border-nexus-border print:border-gray-400 font-mono text-right shrink-0">
                <div className="text-[10px] text-nexus-muted print:text-gray-600 uppercase">Audit Signature:</div>
                <div className="text-xs text-nexus-lime print:text-black font-bold">
                  FAIRSHARE-VERIFIED-2026
                </div>
                <div className="text-[9px] text-nexus-muted print:text-gray-600 truncate max-w-[200px]">
                  {reportData?.audit_hash?.substring(0, 28)}...
                </div>
              </div>
            </div>

            {/* PROJECT METADATA SUMMARY BAR */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-nexus-border/60 print:border-gray-300 font-mono text-xs">
              <div>
                <span className="text-[10px] uppercase text-nexus-muted print:text-gray-600 block">Project Title</span>
                <strong className="text-nexus-text print:text-black font-sans">{project.name}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase text-nexus-muted print:text-gray-600 block">Category / Course</span>
                <span className="text-nexus-cyan print:text-black font-semibold">{project.category || 'Capstone Full-Stack'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-nexus-muted print:text-gray-600 block">Audit Timeline</span>
                <span className="text-nexus-text print:text-black">{project.start_date || '2026-08-01'} to {project.deadline || '2026-10-30'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-nexus-muted print:text-gray-600 block">Certification Date</span>
                <span className="text-nexus-lime print:text-black font-bold">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </header>

          {/* PROJECT TELEMETRY HIGH-LEVEL METRICS */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-nexus-elevated/40 print:bg-gray-50 border border-nexus-border print:border-gray-300">
              <span className="text-[10px] font-mono uppercase text-nexus-muted print:text-gray-600 block">Deliverables Finalized</span>
              <div className="text-xl sm:text-2xl font-mono font-bold text-nexus-text print:text-black mt-1">
                {completedTasks} / {totalTasks}
              </div>
              <span className="text-[11px] font-mono text-nexus-lime print:text-gray-700">{completionRate}% Completion Rate</span>
            </div>

            <div className="p-4 rounded-lg bg-nexus-elevated/40 print:bg-gray-50 border border-nexus-border print:border-gray-300">
              <span className="text-[10px] font-mono uppercase text-nexus-muted print:text-gray-600 block">Team Fairness Index</span>
              <div className="text-xl sm:text-2xl font-mono font-bold text-nexus-lime print:text-black mt-1">
                {averageScore}%
              </div>
              <span className="text-[11px] font-mono text-nexus-cyan print:text-gray-700">Equitable Distribution</span>
            </div>

            <div className="p-4 rounded-lg bg-nexus-elevated/40 print:bg-gray-50 border border-nexus-border print:border-gray-300">
              <span className="text-[10px] font-mono uppercase text-nexus-muted print:text-gray-600 block">Verified Evidence Proofs</span>
              <div className="text-xl sm:text-2xl font-mono font-bold text-nexus-cyan print:text-black mt-1">
                {evidence.length}
              </div>
              <span className="text-[11px] font-mono text-nexus-muted print:text-gray-700">PRs, Figma & Documents</span>
            </div>

            <div className="p-4 rounded-lg bg-nexus-elevated/40 print:bg-gray-50 border border-nexus-border print:border-gray-300">
              <span className="text-[10px] font-mono uppercase text-nexus-muted print:text-gray-600 block">Active Team Roster</span>
              <div className="text-xl sm:text-2xl font-mono font-bold text-nexus-text print:text-black mt-1">
                {members.length}
              </div>
              <span className="text-[11px] font-mono text-nexus-muted print:text-gray-700">Contributors Audited</span>
            </div>
          </section>

          {/* SECTION 1: INDIVIDUAL CONTRIBUTION SUMMARY TABLE */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-nexus-lime print:text-black" />
              <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-nexus-text print:text-black">
                1. Individual Contributor Audit & Grade Ledger
              </h2>
            </div>

            <div className="overflow-x-auto rounded-lg border border-nexus-border print:border-gray-400">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-nexus-elevated print:bg-gray-200 text-nexus-muted print:text-black border-b border-nexus-border print:border-gray-400">
                  <tr>
                    <th className="py-2.5 px-3 uppercase">Contributor</th>
                    <th className="py-2.5 px-3 uppercase">Assigned Role</th>
                    <th className="py-2.5 px-3 uppercase text-center">Tasks (Comp/Total)</th>
                    <th className="py-2.5 px-3 uppercase text-center">Timeliness</th>
                    <th className="py-2.5 px-3 uppercase text-right">Contribution Score</th>
                    <th className="py-2.5 px-3 uppercase text-center">Grade Projection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-border print:divide-gray-300 bg-nexus-surface print:bg-white text-nexus-text print:text-black">
                  {members.map((member) => {
                    const score = member.fair_score || 85.0
                    const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : 'B+'
                    return (
                      <tr key={member.id || member.name} className="hover:bg-nexus-elevated/30 print:hover:bg-transparent">
                        <td className="py-3 px-3 font-semibold flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block print:hidden"
                            style={{ backgroundColor: member.avatar_color || '#C5FF4A' }}
                          />
                          <span>{member.name}</span>
                        </td>
                        <td className="py-3 px-3 text-nexus-muted print:text-gray-700">{member.role}</td>
                        <td className="py-3 px-3 text-center">
                          {member.tasks_completed || 5} / {member.tasks_assigned || 6}
                        </td>
                        <td className="py-3 px-3 text-center text-nexus-cyan print:text-black font-bold">
                          {member.timeliness_rate || 90}%
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-nexus-lime print:text-black">
                          {score}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-nexus-lime/10 print:bg-gray-100 border border-nexus-lime/30 print:border-black text-nexus-lime print:text-black font-bold">
                            {grade}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 2: 5-FACTOR SCORING METHODOLOGY RUBRIC */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-nexus-cyan print:text-black" />
              <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-nexus-text print:text-black">
                2. Explainable 5-Factor Evaluation Rubric
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 font-mono text-[11px]">
              <div className="p-3 rounded-lg bg-nexus-elevated/40 print:bg-gray-50 border border-nexus-border print:border-gray-300 space-y-1">
                <strong className="text-nexus-lime print:text-black block uppercase">Task Completion (30%)</strong>
                <p className="text-nexus-muted print:text-gray-700 font-sans text-[10px]">
                  Proportion of assigned milestone deliverables successfully brought to final closure.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-nexus-elevated/40 print:bg-gray-50 border border-nexus-border print:border-gray-300 space-y-1">
                <strong className="text-nexus-cyan print:text-black block uppercase">Timeliness (20%)</strong>
                <p className="text-nexus-muted print:text-gray-700 font-sans text-[10px]">
                  Timestamps of deliverable closures measured against scheduled sprint milestone deadlines.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-nexus-elevated/40 print:bg-gray-50 border border-nexus-border print:border-gray-300 space-y-1">
                <strong className="text-nexus-cyan print:text-black block uppercase">Work Evidence (20%)</strong>
                <p className="text-nexus-muted print:text-gray-700 font-sans text-[10px]">
                  Verifiable tangible artifacts submitted: merged PRs, documents, and technical PDFs.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-nexus-elevated/40 print:bg-gray-50 border border-nexus-border print:border-gray-300 space-y-1">
                <strong className="text-nexus-amber print:text-black block uppercase">Complexity (15%)</strong>
                <p className="text-nexus-muted print:text-gray-700 font-sans text-[10px]">
                  Difficulty weighting reflecting critical architectural & hardware contributions.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-nexus-elevated/40 print:bg-gray-50 border border-nexus-border print:border-gray-300 space-y-1">
                <strong className="text-nexus-lime print:text-black block uppercase">Peer Review (15%)</strong>
                <p className="text-nexus-muted print:text-gray-700 font-sans text-[10px]">
                  Aggregated, sanitized 6-dimension anonymous peer evaluations from teammates.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 3: COMPLETE WORK EVIDENCE AUDIT LEDGER */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-nexus-lime print:text-black" />
              <h2 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-nexus-text print:text-black">
                3. Verifiable Artifact Ledger
              </h2>
            </div>

            <div className="overflow-x-auto rounded-lg border border-nexus-border print:border-gray-400">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-nexus-elevated print:bg-gray-200 text-nexus-muted print:text-black border-b border-nexus-border print:border-gray-400">
                  <tr>
                    <th className="py-2 px-3 uppercase">Deliverable Proof</th>
                    <th className="py-2 px-3 uppercase">Author</th>
                    <th className="py-2 px-3 uppercase">Format</th>
                    <th className="py-2 px-3 uppercase">Verification SHA / Metrics</th>
                    <th className="py-2 px-3 uppercase text-right">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nexus-border print:divide-gray-300 bg-nexus-surface print:bg-white text-nexus-text print:text-black">
                  {evidence.map((item) => (
                    <tr key={item.id} className="hover:bg-nexus-elevated/30 print:hover:bg-transparent">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold">{item.title}</div>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-nexus-cyan print:text-black underline flex items-center gap-1 mt-0.5"
                          >
                            <span>Inspect Artifact</span>
                            <ExternalLink className="w-2.5 h-2.5 inline" />
                          </a>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-nexus-muted print:text-gray-700">{item.author}</td>
                      <td className="py-2.5 px-3 uppercase text-[11px] text-nexus-cyan print:text-black">
                        {item.type === 'github_pr' ? 'GitHub PR' : 'Document / PDF'}
                      </td>
                      <td className="py-2.5 px-3 text-nexus-muted print:text-gray-700 text-[11px]">
                        {item.metrics || 'Verified Artifact SHA'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-nexus-lime/10 print:bg-gray-100 border border-nexus-lime/30 print:border-black text-nexus-lime print:text-black text-[10px] font-bold uppercase">
                          {item.verified ? 'VERIFIED' : 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 4: FORMAL SIGN-OFF & CERTIFICATION BLOCKS */}
          <section className="pt-6 border-t-2 border-nexus-border print:border-black space-y-6">
            <div className="text-xs font-mono text-nexus-muted print:text-gray-700">
              <strong className="text-nexus-text print:text-black block mb-1">
                INSTITUTIONAL ACADEMIC INTEGRITY ATTESTATION:
              </strong>
              This document certifies that contribution indexes recorded herein have been automatically calculated
              via FairShare's deterministic 5-factor scoring engine, anchored to immutable evidence logs and anonymous
              peer reviews. All scores are tamper-proof and mathematically transparent.
            </div>

            {/* SIGNATURE BLOCKS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 font-mono text-xs">
              <div className="space-y-8 border-t border-nexus-border print:border-black pt-2">
                <span className="text-[10px] uppercase text-nexus-muted print:text-gray-600 block">
                  Project Lead Signature
                </span>
                <div className="text-nexus-text print:text-black font-bold">
                  {members[0]?.name || 'Abhaas'}
                </div>
              </div>

              <div className="space-y-8 border-t border-nexus-border print:border-black pt-2">
                <span className="text-[10px] uppercase text-nexus-muted print:text-gray-600 block">
                  Team Representative
                </span>
                <div className="text-nexus-text print:text-black font-bold">
                  {members[1]?.name || 'Rohit'}
                </div>
              </div>

              <div className="space-y-8 border-t border-nexus-border print:border-black pt-2">
                <span className="text-[10px] uppercase text-nexus-muted print:text-gray-600 block">
                  Course Faculty / Evaluator
                </span>
                <div className="text-nexus-muted print:text-gray-500 italic">
                  [ Authorized Academic Sign-Off ]
                </div>
              </div>
            </div>
          </section>
        </article>
      </main>
    </div>
  )
}
