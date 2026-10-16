import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Users,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react'

export const FACTOR_DETAILS = {
  'Task Completion': {
    icon: CheckCircle2,
    color: '#C5FF4A',
    badgeVariant: 'lime',
    defaultWeight: 30,
    formula: 'Score = (Completed Tasks / Total Assigned Tasks) × 100',
    rationale:
      'Measures the proportion of deliverables successfully brought to completion. Abandoned or unassigned items reduce this factor.',
    antiGaming:
      'Creating trivial micro-tasks right before deadline is mitigated by complexity weighting in the backend algorithm.',
    example:
      'If you were assigned 6 tasks and completed 6 of them, your completion score is 100%. At 30% weight, this contributes 30.0 points.',
  },
  'Timeliness': {
    icon: Clock,
    color: '#52E8D1',
    badgeVariant: 'cyan',
    defaultWeight: 20,
    formula: 'Score = ∑ (On-Time Task Weights) / Total Completed Weight × 100',
    rationale:
      'Evaluates whether deliverables were completed on or before the internal milestone deadline, fostering steady progress rather than last-minute cramming.',
    antiGaming:
      'Late submissions receive fractional credit (70% within 48h, 40% thereafter) rather than 0%, encouraging students to still finalize deliverables.',
    example:
      'Completing deliverables 12 hours ahead of cutoff earns full timeliness credit. Late milestones slightly reduce the timeliness index without penalizing completion.',
  },
  'Work Evidence': {
    icon: ShieldCheck,
    color: '#52E8D1',
    badgeVariant: 'cyan',
    defaultWeight: 20,
    formula: 'Score = (Tasks with Verified Artifacts / Total Completed Tasks) × 100',
    rationale:
      'Ensures accountability by requiring tangible proof of work: GitHub pull requests, Figma designs, Google Docs, or uploaded technical PDF schematics.',
    antiGaming:
      'Every uploaded link or file is logged with an immutable SHA/URL timestamp. Self-claims without proof trigger an "Evidence Missing" warning.',
    example:
      'Tasks verified by linked GitHub PRs or uploaded project schematics receive full evidence verification status.',
  },
  'Work Volume': {
    icon: Layers,
    color: '#52E8D1',
    badgeVariant: 'cyan',
    defaultWeight: 20,
    formula: 'Score = (Individual Output Velocity / Team Target Baseline) × 100',
    rationale:
      'Captures the tangible output generated—such as commit volume, merged PRs, and finalized documentation assets.',
    antiGaming:
      'Git merge metrics are analyzed for meaningful diffs; automated empty commits or dummy line changes are filtered.',
    example:
      'Consistently producing substantial code or documentation relative to project scope maintains a strong work volume metric.',
  },
  'Task Complexity': {
    icon: Activity,
    color: '#F59E0B',
    badgeVariant: 'amber',
    defaultWeight: 15,
    formula: 'Score = Weighted Average of Deliverable Difficulty (Simple: 1x, Medium: 1.5x, Complex: 2.5x)',
    rationale:
      'Rewards taking on high-risk, technically challenging components such as IoT firmware, neural networks, or backend architectures over cosmetic fixes.',
    antiGaming:
      'Deliverable complexity is agreed upon collaboratively by the team when milestones are created.',
    example:
      'Spearheading 2 "Complex" architectural tasks provides greater impact than 4 "Simple" text update tasks.',
  },
  'Peer Review': {
    icon: Users,
    color: '#C5FF4A',
    badgeVariant: 'lime',
    defaultWeight: 15,
    formula: 'Score = (Sum of 6-Dimension Teammate Ratings / 30.0) × 100',
    rationale:
      'Gathers anonymous 360-degree feedback from peers across Participation, Responsibility, Quality, Collaboration, Communication, and Timeliness.',
    antiGaming:
      'Anti-self-review safeguards strictly prevent rating oneself. Outlier anomaly clipping eliminates retaliatory or collusive scores.',
    example:
      'An average rating of 4.8 out of 5 across all dimensions converts to a 96% peer satisfaction metric.',
  },
  'Participation': {
    icon: Sparkles,
    color: '#C5FF4A',
    badgeVariant: 'lime',
    defaultWeight: 10,
    formula: 'Score = (Activity Stream Contributions / Expected Weekly Activity) × 100',
    rationale:
      'Tracks continuous participation in milestone check-ins, discussions, and iterative task updates throughout the project lifecycle.',
    antiGaming:
      'Spamming events within a short timeframe is rate-limited; only distributed, multi-day engagement receives full credit.',
    example:
      'Active weekly contributions and timely reviews for teammates maintain top participation scores.',
  },
}
