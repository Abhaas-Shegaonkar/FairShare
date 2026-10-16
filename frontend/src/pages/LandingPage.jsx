import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ShieldCheck,
  Sliders,
  ArrowRight,
  Users,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react'
import { Navbar } from '../components/common/Navbar'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'

export default function LandingPage() {
  // Simulator factor state (0 to 100)
  const [factors, setFactors] = useState({
    completion: 100, // 30% weight
    timeliness: 95,  // 20% weight
    volume: 90,      // 20% weight
    complexity: 92,  // 15% weight
    peerReview: 94,  // 15% weight
  })

  // Presets for quick evaluation
  const setPreset = (type) => {
    if (type === 'mvp') {
      setFactors({ completion: 100, timeliness: 98, volume: 95, complexity: 95, peerReview: 96 })
    } else if (type === 'balanced') {
      setFactors({ completion: 85, timeliness: 82, volume: 80, complexity: 75, peerReview: 85 })
    } else if (type === 'slacker') {
      setFactors({ completion: 35, timeliness: 40, volume: 25, complexity: 20, peerReview: 30 })
    }
  }

  // Calculate composite 5-factor score
  const calculatedScore = useMemo(() => {
    const raw =
      factors.completion * 0.3 +
      factors.timeliness * 0.2 +
      factors.volume * 0.2 +
      factors.complexity * 0.15 +
      factors.peerReview * 0.15
    return parseFloat(raw.toFixed(1))
  }, [factors])

  const tier = useMemo(() => {
    if (calculatedScore >= 90) return { label: 'Team MVP / High Contributor', color: 'lime', grade: 'A+' }
    if (calculatedScore >= 75) return { label: 'Solid Core Contributor', color: 'cyan', grade: 'A' }
    if (calculatedScore >= 60) return { label: 'Moderate Participation', color: 'amber', grade: 'B' }
    return { label: 'Free-Rider / Critical Deficit', color: 'crimson', grade: 'C / Incomplete' }
  }, [calculatedScore])

  return (
    <div className="min-h-screen bg-nexus-bg text-nexus-text font-sans flex flex-col justify-between selection:bg-nexus-lime/20 selection:text-nexus-lime">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 border-b border-nexus-border nexus-grid-pattern nexus-radar-gradient">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Top Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-nexus-surface border border-nexus-border-bright text-xs font-mono text-nexus-cyan shadow-nexus-cyan-glow">
                <span className="nexus-led nexus-led-lime" />
                <span>NEXUS ALGORITHM v2.0 · ZERO FREE-RIDERS</span>
              </div>
            </div>

            {/* Hero Main Headline */}
            <div className="text-center max-w-4xl mx-auto space-y-6">
              <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-nexus-text uppercase leading-none">
                Making Every Contribution <br />
                <span className="text-nexus-lime">Count</span>
              </h1>
              <p className="text-nexus-muted text-base sm:text-xl max-w-2xl mx-auto font-sans leading-relaxed">
                Transparent, evidence-based project management for student groups and hackathon teams.
                Say goodbye to subjective grading and unequal group project marks.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link to="/projects/a1b2c3d4-0000-0000-0000-000000000001">
                  <Button variant="primary" size="lg" icon={Zap} className="w-full sm:w-auto">
                    Launch Workspace Demo
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="cyan" size="lg" icon={Users} className="w-full sm:w-auto">
                    Enlist Student Team
                  </Button>
                </Link>
              </div>

              {/* Live Ticker */}
              <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
                <div className="bg-nexus-surface/60 border border-nexus-border rounded-lg p-3">
                  <div className="text-lg font-mono font-bold text-nexus-lime">2,480+</div>
                  <div className="text-[11px] text-nexus-muted font-sans">Tasks Verified</div>
                </div>
                <div className="bg-nexus-surface/60 border border-nexus-border rounded-lg p-3">
                  <div className="text-lg font-mono font-bold text-nexus-cyan">1,290+</div>
                  <div className="text-[11px] text-nexus-muted font-sans">Pull Requests Linked</div>
                </div>
                <div className="bg-nexus-surface/60 border border-nexus-border rounded-lg p-3">
                  <div className="text-lg font-mono font-bold text-nexus-text">4,900+</div>
                  <div className="text-[11px] text-nexus-muted font-sans">Peer Reviews</div>
                </div>
                <div className="bg-nexus-surface/60 border border-nexus-border rounded-lg p-3">
                  <div className="text-lg font-mono font-bold text-nexus-lime">99.4%</div>
                  <div className="text-[11px] text-nexus-muted font-sans">Fairness Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE 5-FACTOR SCORE SIMULATOR */}
        <section className="py-20 border-b border-nexus-border bg-nexus-surface/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-nexus-lime uppercase tracking-widest mb-2">
                <Sliders className="w-4 h-4" />
                <span>Interactive Mathematical Engine</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase text-nexus-text">
                Test the 5-Factor Scoring Simulator
              </h2>
              <p className="text-sm text-nexus-muted mt-2">
                FairShare replaces arbitrary grading with an objective, verifiable formula. Drag the factor sliders
                below to see live score recalculations.
              </p>

              {/* Preset Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                <span className="text-xs font-mono text-nexus-muted mr-1">PRESETS:</span>
                <button
                  type="button"
                  onClick={() => setPreset('mvp')}
                  className="px-3 py-1 rounded bg-nexus-surface border border-nexus-lime/40 text-xs font-mono text-nexus-lime hover:bg-nexus-lime/10 cursor-pointer transition-colors"
                >
                  Team MVP (96%)
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('balanced')}
                  className="px-3 py-1 rounded bg-nexus-surface border border-nexus-cyan/40 text-xs font-mono text-nexus-cyan hover:bg-nexus-cyan/10 cursor-pointer transition-colors"
                >
                  Balanced Contributor (84%)
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('slacker')}
                  className="px-3 py-1 rounded bg-nexus-surface border border-nexus-crimson/40 text-xs font-mono text-nexus-crimson hover:bg-nexus-crimson/10 cursor-pointer transition-colors"
                >
                  Free-Rider Student (32%)
                </button>
              </div>
            </div>

            {/* Simulator Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Sliders (7 Cols) */}
              <div className="lg:col-span-7 bg-nexus-surface border border-nexus-border rounded-xl p-6 md:p-8 space-y-6 nexus-corner-bracket shadow-nexus-card">
                {/* Factor 1: Task Completion */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-nexus-text font-bold uppercase">1. Task Completion Rate (30% Weight)</span>
                    <span className="text-nexus-lime font-bold">{factors.completion}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={factors.completion}
                    onChange={(e) => setFactors({ ...factors, completion: Number(e.target.value) })}
                    className="w-full h-2 bg-nexus-elevated rounded-lg appearance-none cursor-pointer accent-[#C5FF4A]"
                  />
                  <p className="text-[11px] text-nexus-muted">
                    Measures assigned tasks finalized without abandonment or handover.
                  </p>
                </div>

                {/* Factor 2: Timeliness */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-nexus-text font-bold uppercase">2. Timeliness & Deadlines (20% Weight)</span>
                    <span className="text-nexus-cyan font-bold">{factors.timeliness}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={factors.timeliness}
                    onChange={(e) => setFactors({ ...factors, timeliness: Number(e.target.value) })}
                    className="w-full h-2 bg-nexus-elevated rounded-lg appearance-none cursor-pointer accent-[#52E8D1]"
                  />
                  <p className="text-[11px] text-nexus-muted">
                    Timeliness curve penalizes last-minute scrambles and rewarded early deliverable check-ins.
                  </p>
                </div>

                {/* Factor 3: Work Volume */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-nexus-text font-bold uppercase">3. Work Volume & Commits (20% Weight)</span>
                    <span className="text-nexus-lime font-bold">{factors.volume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={factors.volume}
                    onChange={(e) => setFactors({ ...factors, volume: Number(e.target.value) })}
                    className="w-full h-2 bg-nexus-elevated rounded-lg appearance-none cursor-pointer accent-[#C5FF4A]"
                  />
                  <p className="text-[11px] text-nexus-muted">
                    Verified GitHub commits, PR lines, and artifact volume verified in repository.
                  </p>
                </div>

                {/* Factor 4: Task Complexity */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-nexus-text font-bold uppercase">4. Task Complexity (15% Weight)</span>
                    <span className="text-nexus-amber font-bold">{factors.complexity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={factors.complexity}
                    onChange={(e) => setFactors({ ...factors, complexity: Number(e.target.value) })}
                    className="w-full h-2 bg-nexus-elevated rounded-lg appearance-none cursor-pointer accent-[#F59E0B]"
                  />
                  <p className="text-[11px] text-nexus-muted">
                    Difficulty ratings assigned to tasks (Critical/Complex vs Simple clerical chores).
                  </p>
                </div>

                {/* Factor 5: Peer Review */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-nexus-text font-bold uppercase">5. Peer Review Evaluation (15% Weight)</span>
                    <span className="text-nexus-cyan font-bold">{factors.peerReview}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={factors.peerReview}
                    onChange={(e) => setFactors({ ...factors, peerReview: Number(e.target.value) })}
                    className="w-full h-2 bg-nexus-elevated rounded-lg appearance-none cursor-pointer accent-[#52E8D1]"
                  />
                  <p className="text-[11px] text-nexus-muted">
                    Anonymous peer feedback across communication, collaboration, and reliability.
                  </p>
                </div>
              </div>

              {/* Right Column: Score HUD Result (5 Cols) */}
              <div className="lg:col-span-5 bg-nexus-elevated border border-nexus-border-bright rounded-xl p-8 space-y-6 nexus-corner-bracket shadow-nexus-elevated">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-widest text-nexus-muted">
                    CALCULATED FAIR SCORE
                  </span>
                  <Badge variant={tier.color} dot>
                    {tier.grade}
                  </Badge>
                </div>

                {/* Big Score Display */}
                <div className="text-center py-6 bg-nexus-surface rounded-lg border border-nexus-border">
                  <motion.div
                    key={calculatedScore}
                    initial={{ scale: 0.9, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl font-mono font-bold tracking-tight text-nexus-text"
                  >
                    {calculatedScore}
                    <span className="text-3xl text-nexus-lime">%</span>
                  </motion.div>
                  <div className="mt-2 text-xs font-mono font-semibold uppercase text-nexus-muted">
                    Status: <span className="text-nexus-text">{tier.label}</span>
                  </div>
                </div>

                {/* Factor Contribution Micro-Bars */}
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between text-nexus-muted">
                    <span>Task Completion (30%)</span>
                    <span className="text-nexus-text">{(factors.completion * 0.3).toFixed(1)} pts</span>
                  </div>
                  <div className="flex justify-between text-nexus-muted">
                    <span>Timeliness (20%)</span>
                    <span className="text-nexus-text">{(factors.timeliness * 0.2).toFixed(1)} pts</span>
                  </div>
                  <div className="flex justify-between text-nexus-muted">
                    <span>Work Volume (20%)</span>
                    <span className="text-nexus-text">{(factors.volume * 0.2).toFixed(1)} pts</span>
                  </div>
                  <div className="flex justify-between text-nexus-muted">
                    <span>Complexity (15%)</span>
                    <span className="text-nexus-text">{(factors.complexity * 0.15).toFixed(1)} pts</span>
                  </div>
                  <div className="flex justify-between text-nexus-muted">
                    <span>Peer Review (15%)</span>
                    <span className="text-nexus-text">{(factors.peerReview * 0.15).toFixed(1)} pts</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-nexus-border">
                  <Link to="/signup">
                    <Button variant="primary" fullWidth icon={ArrowRight}>
                      Start Earning Fair Marks
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM VS SOLUTION MATRIX */}
        <section className="py-20 border-b border-nexus-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase text-nexus-text">
                Traditional Chaos vs. FairShare Nexus
              </h2>
              <p className="text-sm text-nexus-muted mt-2">
                Why standard student team projects fail, and how FairShare provides mathematical proof of work.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Problem Column */}
              <div className="bg-nexus-surface/50 border border-nexus-crimson/30 rounded-xl p-8 space-y-6">
                <div className="flex items-center gap-3 text-nexus-crimson">
                  <XCircle className="w-6 h-6" />
                  <h3 className="font-display font-bold text-xl uppercase">Traditional Group Projects</h3>
                </div>
                <ul className="space-y-4 text-xs font-sans text-nexus-muted">
                  <li className="flex items-start gap-3">
                    <span className="text-nexus-crimson font-mono font-bold">•</span>
                    <span><strong>Free-Rider Dilemma:</strong> One or two students do 90% of the engineering while inactive teammates claim equal credit.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-nexus-crimson font-mono font-bold">•</span>
                    <span><strong>Subjective Grading:</strong> Faculty have no visibility into internal Git commits or milestone breakdowns, issuing a single blanket mark.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-nexus-crimson font-mono font-bold">•</span>
                    <span><strong>Lost Evidence:</strong> Links to PRs, Figma boards, and research papers get scattered across Discord and WhatsApp chats.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-nexus-crimson font-mono font-bold">•</span>
                    <span><strong>Late Blame Games:</strong> No early warnings for overdue tasks until 48 hours before final submission.</span>
                  </li>
                </ul>
              </div>

              {/* Solution Column */}
              <div className="bg-nexus-surface/50 border border-nexus-lime/30 rounded-xl p-8 space-y-6 nexus-corner-bracket shadow-nexus-glow">
                <div className="flex items-center gap-3 text-nexus-lime">
                  <CheckCircle2 className="w-6 h-6" />
                  <h3 className="font-display font-bold text-xl uppercase">The FairShare NEXUS Standard</h3>
                </div>
                <ul className="space-y-4 text-xs font-sans text-nexus-text">
                  <li className="flex items-start gap-3">
                    <span className="text-nexus-lime font-mono font-bold">•</span>
                    <span><strong>5-Factor Mathematical Model:</strong> Transparent scoring based on completion, timeliness, volume, complexity, and peer review.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-nexus-lime font-mono font-bold">•</span>
                    <span><strong>Verifiable Evidence Vault:</strong> Every task must link to an immutable artifact (GitHub PR, Figma design, or PDF documentation).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-nexus-lime font-mono font-bold">•</span>
                    <span><strong>Auditable Professor Reports:</strong> Export clean printable PDF ledgers with individualized contribution percentages for grading committees.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-nexus-lime font-mono font-bold">•</span>
                    <span><strong>Confidential Peer Feedback:</strong> Teammates evaluate work ethic and participation without fear of public retaliation.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 4-STEP WORKFLOW */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase text-nexus-text">
                The 4-Step Academic Workflow
              </h2>
              <p className="text-sm text-nexus-muted mt-2">
                From project kickoff to defense presentation in 4 seamless stages.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-nexus-surface border border-nexus-border rounded-xl p-6 space-y-3 nexus-corner-bracket">
                <div className="w-10 h-10 rounded-lg bg-nexus-elevated border border-nexus-border-bright flex items-center justify-center font-mono font-bold text-nexus-lime">
                  01
                </div>
                <h4 className="font-display font-bold text-base text-nexus-text uppercase">Create & Assign</h4>
                <p className="text-xs text-nexus-muted leading-relaxed">
                  Set deadlines, break down deliverables into prioritized milestones, and assign tasks to teammates.
                </p>
              </div>

              <div className="bg-nexus-surface border border-nexus-border rounded-xl p-6 space-y-3 nexus-corner-bracket">
                <div className="w-10 h-10 rounded-lg bg-nexus-elevated border border-nexus-border-bright flex items-center justify-center font-mono font-bold text-nexus-cyan">
                  02
                </div>
                <h4 className="font-display font-bold text-base text-nexus-text uppercase">Submit Evidence</h4>
                <p className="text-xs text-nexus-muted leading-relaxed">
                  Attach GitHub pull requests, architecture diagrams, and test results as tamper-proof verification.
                </p>
              </div>

              <div className="bg-nexus-surface border border-nexus-border rounded-xl p-6 space-y-3 nexus-corner-bracket">
                <div className="w-10 h-10 rounded-lg bg-nexus-elevated border border-nexus-border-bright flex items-center justify-center font-mono font-bold text-nexus-amber">
                  03
                </div>
                <h4 className="font-display font-bold text-base text-nexus-text uppercase">Track Activity</h4>
                <p className="text-xs text-nexus-muted leading-relaxed">
                  Live chronological event stream captures who completed what deliverable, maintaining complete transparency.
                </p>
              </div>

              <div className="bg-nexus-surface border border-nexus-border rounded-xl p-6 space-y-3 nexus-corner-bracket">
                <div className="w-10 h-10 rounded-lg bg-nexus-elevated border border-nexus-border-bright flex items-center justify-center font-mono font-bold text-nexus-lime">
                  04
                </div>
                <h4 className="font-display font-bold text-base text-nexus-text uppercase">Generate Audit Report</h4>
                <p className="text-xs text-nexus-muted leading-relaxed">
                  Download printable academic evidence report with individualized scores for project mentors and faculty.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-nexus-border py-10 bg-nexus-surface/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-nexus-muted">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-nexus-lime" />
            <span className="font-display font-bold uppercase text-nexus-text">FairShare NEXUS</span>
            <span>· Academic Collaboration Platform</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <Link to="/login" className="hover:text-nexus-lime transition-colors">Terminal Login</Link>
            <Link to="/signup" className="hover:text-nexus-lime transition-colors">Enlist Team</Link>
            <Link to="/projects/a1b2c3d4-0000-0000-0000-000000000001" className="hover:text-nexus-cyan transition-colors">Workspace Demo</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
