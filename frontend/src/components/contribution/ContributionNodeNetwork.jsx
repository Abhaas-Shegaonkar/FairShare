import React, { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  FolderGit2,
  Users,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Filter,
  Info,
} from 'lucide-react'
import { Badge } from '../common/Badge'

export function ContributionNodeNetwork({
  project = {
    name: 'Smart Water Management System',
    category: 'IoT & Full-Stack',
    fairness_score: 94.2,
  },
  members = [
    {
      id: 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0',
      name: 'Abhaas',
      role: 'Frontend Lead',
      fair_score: 94.2,
      tasks_completed: 6,
      avatar_color: '#C5FF4A',
    },
    {
      id: 'd4e70dc5-0abf-5a1f-0505-1a2f78f4ea01',
      name: 'Rohit',
      role: 'Backend Architect',
      fair_score: 91.5,
      tasks_completed: 5,
      avatar_color: '#52E8D1',
    },
    {
      id: 'e5f81ed6-1bc0-6b2a-1616-2b3a89a5fb12',
      name: 'Denesh',
      role: 'IoT & Hardware Lead',
      fair_score: 83.0,
      tasks_completed: 4,
      avatar_color: '#F59E0B',
    },
    {
      id: 'f6a92fe7-2cd1-7c3b-2727-3c4b90b6ac23',
      name: 'Aditya',
      role: 'QA & Documentation',
      fair_score: 72.8,
      tasks_completed: 3,
      avatar_color: '#FF4D4D',
    },
  ],
  tasks = [
    {
      id: 'task-001',
      title: 'Real-Time Flow Telemetry',
      status: 'Completed',
      priority: 'High',
      complexity: 'Complex',
      assigned_to: 'Abhaas',
      assigned_user_id: 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0',
      evidence_count: 1,
      evidence: [
        {
          id: 'ev-01',
          type: 'github_pr',
          title: 'PR #42: Telemetry WebSockets',
          url: 'https://github.com/fairshare/water-mgmt/pull/42',
          verified: true,
          metrics: '+480 lines · 4 commits',
        },
      ],
    },
    {
      id: 'task-002',
      title: 'Sensor Anomaly API',
      status: 'Completed',
      priority: 'Critical',
      complexity: 'Complex',
      assigned_to: 'Rohit',
      assigned_user_id: 'd4e70dc5-0abf-5a1f-0505-1a2f78f4ea01',
      evidence_count: 1,
      evidence: [
        {
          id: 'ev-02',
          type: 'github_pr',
          title: 'PR #44: Anomaly Detection',
          url: 'https://github.com/fairshare/water-mgmt/pull/44',
          verified: true,
          metrics: '+620 lines · 6 commits',
        },
      ],
    },
    {
      id: 'task-003',
      title: 'LoRa Firmware Sleep Cycle',
      status: 'Completed',
      priority: 'Medium',
      complexity: 'Medium',
      assigned_to: 'Denesh',
      assigned_user_id: 'e5f81ed6-1bc0-6b2a-1616-2b3a89a5fb12',
      evidence_count: 1,
      evidence: [
        {
          id: 'ev-03',
          type: 'document',
          title: 'LoRa Benchmarks.pdf',
          url: 'https://storage.supabase.co/water-mgmt/benchmarks.pdf',
          verified: true,
          metrics: 'PDF (2.4 MB)',
        },
      ],
    },
    {
      id: 'task-004',
      title: 'Cypress Integration Tests',
      status: 'In Progress',
      priority: 'Medium',
      complexity: 'Medium',
      assigned_to: 'Aditya',
      assigned_user_id: 'f6a92fe7-2cd1-7c3b-2727-3c4b90b6ac23',
      evidence_count: 0,
      evidence: [],
    },
  ],
  onNodeSelect,
}) {
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('ALL')
  const [hoveredNodeId, setHoveredNodeId] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)

  // Filter members based on user selection
  const filteredMembers = useMemo(() => {
    if (selectedMemberFilter === 'ALL') return members
    return members.filter((m) => m.id === selectedMemberFilter || m.name === selectedMemberFilter)
  }, [members, selectedMemberFilter])

  // Filter tasks based on filtered members
  const filteredTasks = useMemo(() => {
    const memberIds = new Set(filteredMembers.map((m) => m.id))
    const memberNames = new Set(filteredMembers.map((m) => m.name))
    return tasks.filter(
      (t) => memberIds.has(t.assigned_user_id) || memberNames.has(t.assigned_to)
    )
  }, [tasks, filteredMembers])

  // Compute graph geometry
  const graphData = useMemo(() => {
    const width = 1100
    const height = 540

    // 1. Hub Node (Tier 0)
    const hubNode = {
      id: 'hub-project',
      tier: 0,
      type: 'hub',
      x: 100,
      y: height / 2,
      label: project?.name || 'Project Hub',
      sublabel: project?.category || 'Central Repository',
      score: project?.fairness_score || 94.2,
      color: '#52E8D1',
    }

    // 2. Member Nodes (Tier 1)
    const memberSpacing = height / (filteredMembers.length + 1)
    const memberNodes = filteredMembers.map((m, idx) => ({
      id: `member-${m.id || m.name}`,
      tier: 1,
      type: 'member',
      x: 340,
      y: memberSpacing * (idx + 1),
      label: m.name,
      sublabel: m.role || 'Contributor',
      score: m.fair_score || 85,
      color: m.avatar_color || '#C5FF4A',
      raw: m,
    }))

    // 3. Task Nodes (Tier 2)
    const taskSpacing = height / (filteredTasks.length + 1)
    const taskNodes = filteredTasks.map((t, idx) => {
      // Find matching member for color
      const member = filteredMembers.find(
        (m) => m.id === t.assigned_user_id || m.name === t.assigned_to
      )
      return {
        id: `task-${t.id}`,
        tier: 2,
        type: 'task',
        x: 670,
        y: taskSpacing * (idx + 1),
        label: t.title,
        sublabel: `${t.priority} · ${t.status}`,
        status: t.status,
        color: t.status === 'Completed' ? '#C5FF4A' : '#F59E0B',
        memberId: member ? `member-${member.id || member.name}` : null,
        raw: t,
      }
    })

    // 4. Evidence Leaf Nodes (Tier 3)
    const evidenceNodes = []
    let evIdx = 0
    const totalEvidenceCount = filteredTasks.reduce(
      (acc, t) => acc + (t.evidence?.length || 0),
      0
    )
    const evSpacing = height / (Math.max(totalEvidenceCount, 1) + 1)

    filteredTasks.forEach((t) => {
      if (t.evidence && t.evidence.length > 0) {
        t.evidence.forEach((ev) => {
          evIdx++
          evidenceNodes.push({
            id: `ev-${ev.id}`,
            tier: 3,
            type: 'evidence',
            x: 960,
            y: evSpacing * evIdx,
            label: ev.title || 'Verified Artifact',
            sublabel: ev.type === 'github_pr' ? 'GitHub PR' : 'Document',
            verified: ev.verified,
            color: '#52E8D1',
            taskId: `task-${t.id}`,
            url: ev.url,
            raw: ev,
          })
        })
      }
    })

    // Connections (Edges)
    const edges = []

    // Hub -> Members
    memberNodes.forEach((mn) => {
      edges.push({
        id: `e-hub-${mn.id}`,
        source: hubNode,
        target: mn,
        color: '#52E8D1',
        active: true,
      })
    })

    // Members -> Tasks
    taskNodes.forEach((tn) => {
      const parentMember = memberNodes.find((mn) => mn.id === tn.memberId)
      if (parentMember) {
        edges.push({
          id: `e-${parentMember.id}-${tn.id}`,
          source: parentMember,
          target: tn,
          color: tn.color,
          active: tn.status === 'Completed',
        })
      }
    })

    // Tasks -> Evidence
    evidenceNodes.forEach((en) => {
      const parentTask = taskNodes.find((tn) => tn.id === en.taskId)
      if (parentTask) {
        edges.push({
          id: `e-${parentTask.id}-${en.id}`,
          source: parentTask,
          target: en,
          color: '#52E8D1',
          active: true,
        })
      }
    })

    return {
      width,
      height,
      nodes: [hubNode, ...memberNodes, ...taskNodes, ...evidenceNodes],
      edges,
    }
  }, [filteredMembers, filteredTasks, project])

  // Identify active lineage on hover
  const activeLineageIds = useMemo(() => {
    if (!hoveredNodeId) return null
    const ids = new Set([hoveredNodeId])

    // Find the hovered node
    const targetNode = graphData.nodes.find((n) => n.id === hoveredNodeId)
    if (!targetNode) return ids

    if (targetNode.type === 'evidence') {
      ids.add(targetNode.taskId)
      const task = graphData.nodes.find((n) => n.id === targetNode.taskId)
      if (task) {
        ids.add(task.memberId)
        ids.add('hub-project')
      }
    } else if (targetNode.type === 'task') {
      ids.add(targetNode.memberId)
      ids.add('hub-project')
      // and child evidence
      graphData.nodes
        .filter((n) => n.taskId === targetNode.id)
        .forEach((n) => ids.add(n.id))
    } else if (targetNode.type === 'member') {
      ids.add('hub-project')
      // and child tasks & their evidence
      const memberTasks = graphData.nodes.filter((n) => n.memberId === targetNode.id)
      memberTasks.forEach((t) => {
        ids.add(t.id)
        graphData.nodes.filter((n) => n.taskId === t.id).forEach((e) => ids.add(e.id))
      })
    } else if (targetNode.type === 'hub') {
      // highlight all
      graphData.nodes.forEach((n) => ids.add(n.id))
    }

    return ids
  }, [hoveredNodeId, graphData])

  const activeInspectorNode = selectedNode || graphData.nodes.find((n) => n.id === hoveredNodeId) || graphData.nodes[0]

  return (
    <div className="bg-nexus-surface border border-nexus-border rounded-xl p-6 shadow-nexus-card space-y-5">
      {/* HEADER & CONTROL BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-nexus-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="nexus-led nexus-led-cyan animate-pulse" />
            <h3 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wider text-nexus-text">
              NEXUS Contribution Node Network
            </h3>
            <Badge variant="cyan" dot>
              LIVE TOPOLOGY
            </Badge>
          </div>
          <p className="text-xs text-nexus-muted font-sans mt-0.5">
            Cryptographically-anchored connected graph: Project Hub → Teammate → Task Deliverables → Verified Proofs.
          </p>
        </div>

        {/* MEMBER FILTER SWITCHER */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-nexus-muted mr-1">
            <Filter className="w-3.5 h-3.5 text-nexus-cyan" />
            <span>Filter Branch:</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedMemberFilter('ALL')
              setSelectedNode(null)
            }}
            className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
              selectedMemberFilter === 'ALL'
                ? 'bg-nexus-lime/10 border-nexus-lime text-nexus-lime font-bold'
                : 'bg-nexus-elevated border-nexus-border text-nexus-muted hover:text-nexus-text'
            }`}
          >
            All Members
          </button>
          {members.map((m) => (
            <button
              key={m.id || m.name}
              type="button"
              onClick={() => {
                setSelectedMemberFilter(m.id || m.name)
                setSelectedNode(null)
              }}
              className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
                selectedMemberFilter === (m.id || m.name)
                  ? 'bg-nexus-cyan/10 border-nexus-cyan text-nexus-cyan font-bold'
                  : 'bg-nexus-elevated border-nexus-border text-nexus-muted hover:text-nexus-text'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* SVG CANVAS CONTAINER */}
      <div className="relative w-full overflow-x-auto rounded-lg bg-nexus-bg border border-nexus-border/80 shadow-inner">
        <svg
          viewBox={`0 0 ${graphData.width} ${graphData.height}`}
          className="w-full min-w-[850px] h-auto block select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Dark technical grid pattern */}
            <pattern
              id="nexus-canvas-grid"
              width="30"
              height="30"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 30 0 L 0 0 0 30"
                fill="none"
                stroke="#11191B"
                strokeWidth="1"
              />
            </pattern>

            {/* Cyan radial glow filter */}
            <filter id="cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Lime radial glow filter */}
            <filter id="lime-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Background */}
          <rect
            width={graphData.width}
            height={graphData.height}
            fill="url(#nexus-canvas-grid)"
          />

          {/* Column Tier Guides & Labels */}
          <g className="font-mono text-[10px] uppercase fill-nexus-muted/40 tracking-widest">
            <text x="100" y="32" textAnchor="middle">
              Tier 0 · Project Root
            </text>
            <text x="340" y="32" textAnchor="middle">
              Tier 1 · Team Nodes
            </text>
            <text x="670" y="32" textAnchor="middle">
              Tier 2 · Deliverables
            </text>
            <text x="960" y="32" textAnchor="middle">
              Tier 3 · Evidence Vault
            </text>
            <line
              x1="220"
              y1="40"
              x2="220"
              y2={graphData.height - 20}
              stroke="#1C2A29"
              strokeDasharray="4 4"
              opacity="0.4"
            />
            <line
              x1="505"
              y1="40"
              x2="505"
              y2={graphData.height - 20}
              stroke="#1C2A29"
              strokeDasharray="4 4"
              opacity="0.4"
            />
            <line
              x1="815"
              y1="40"
              x2="815"
              y2={graphData.height - 20}
              stroke="#1C2A29"
              strokeDasharray="4 4"
              opacity="0.4"
            />
          </g>

          {/* EDGES (Cubic Bezier curves) */}
          <g>
            {graphData.edges.map((edge) => {
              const isSourceInLineage = activeLineageIds
                ? activeLineageIds.has(edge.source.id)
                : false
              const isTargetInLineage = activeLineageIds
                ? activeLineageIds.has(edge.target.id)
                : false
              const isHighlighted = isSourceInLineage && isTargetInLineage

              const strokeOpacity = activeLineageIds
                ? isHighlighted
                  ? 0.95
                  : 0.12
                : 0.45

              const strokeColor = isHighlighted ? '#C5FF4A' : edge.color
              const strokeWidth = isHighlighted ? 2.5 : 1.5

              // Bezier control points
              const dx = (edge.target.x - edge.source.x) / 2
              const pathD = `M ${edge.source.x} ${edge.source.y} C ${edge.source.x + dx} ${edge.source.y}, ${edge.target.x - dx} ${edge.target.y}, ${edge.target.x} ${edge.target.y}`

              return (
                <g key={edge.id}>
                  {/* Base edge path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeOpacity={strokeOpacity}
                    className="transition-all duration-300"
                  />

                  {/* Flowing animated pulse particle along edge */}
                  {edge.active && (!activeLineageIds || isHighlighted) && (
                    <motion.circle
                      r={isHighlighted ? 3 : 2}
                      fill={isHighlighted ? '#C5FF4A' : '#52E8D1'}
                      initial={{ offsetDistance: '0%' }}
                      animate={{ offsetDistance: '100%' }}
                      style={{
                        offsetPath: `path("${pathD}")`,
                      }}
                      transition={{
                        duration: 3 + (edge.id.charCodeAt(edge.id.length - 1) % 3),
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  )}
                </g>
              )
            })}
          </g>

          {/* NODES */}
          <g>
            {graphData.nodes.map((node) => {
              const isHighlighted = activeLineageIds
                ? activeLineageIds.has(node.id)
                : true
              const isSelected = selectedNode?.id === node.id
              const isHovered = hoveredNodeId === node.id

              const opacity = isHighlighted ? 1 : 0.25

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  opacity={opacity}
                  className="cursor-pointer transition-opacity duration-300"
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={() => {
                    setSelectedNode(node)
                    onNodeSelect?.(node)
                  }}
                >
                  {/* Selection / Hover ring */}
                  {(isSelected || isHovered) && (
                    <circle
                      r={node.type === 'hub' ? 34 : node.type === 'member' ? 26 : 20}
                      fill="none"
                      stroke={node.color}
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      className="animate-spin"
                      style={{ animationDuration: '8s' }}
                    />
                  )}

                  {/* NODE TYPE: 1. PROJECT HUB */}
                  {node.type === 'hub' && (
                    <g>
                      <circle
                        r="26"
                        fill="#11191B"
                        stroke="#52E8D1"
                        strokeWidth="2"
                        filter="url(#cyan-glow)"
                      />
                      <circle r="18" fill="#162225" />
                      <FolderGit2 className="w-5 h-5 text-nexus-cyan -translate-x-2.5 -translate-y-2.5 pointer-events-none" />
                      <text
                        y="42"
                        textAnchor="middle"
                        className="font-display font-bold text-xs uppercase fill-nexus-text tracking-wider"
                      >
                        {node.label}
                      </text>
                      <text
                        y="54"
                        textAnchor="middle"
                        className="font-mono text-[9px] fill-nexus-cyan font-bold"
                      >
                        SCORE: {node.score}%
                      </text>
                    </g>
                  )}

                  {/* NODE TYPE: 2. TEAM MEMBER */}
                  {node.type === 'member' && (
                    <g>
                      <circle
                        r="20"
                        fill="#11191B"
                        stroke={node.color}
                        strokeWidth="2"
                        filter="url(#lime-glow)"
                      />
                      <circle r="14" fill="#162225" />
                      <Users
                        className="w-4 h-4 -translate-x-2 -translate-y-2 pointer-events-none"
                        style={{ color: node.color }}
                      />
                      <text
                        y="34"
                        textAnchor="middle"
                        className="font-display font-bold text-[11px] uppercase fill-nexus-text"
                      >
                        {node.label}
                      </text>
                      <text
                        y="46"
                        textAnchor="middle"
                        className="font-mono text-[9px] fill-nexus-muted"
                      >
                        {node.sublabel} · {node.score}%
                      </text>
                    </g>
                  )}

                  {/* NODE TYPE: 3. DELIVERABLE TASK */}
                  {node.type === 'task' && (
                    <g>
                      <rect
                        x="-14"
                        y="-14"
                        width="28"
                        height="28"
                        rx="6"
                        fill="#11191B"
                        stroke={node.color}
                        strokeWidth="1.5"
                      />
                      {node.status === 'Completed' ? (
                        <CheckCircle2
                          className="w-3.5 h-3.5 text-nexus-lime -translate-x-1.75 -translate-y-1.75 pointer-events-none"
                        />
                      ) : (
                        <Clock
                          className="w-3.5 h-3.5 text-nexus-amber -translate-x-1.75 -translate-y-1.75 pointer-events-none"
                        />
                      )}
                      <text
                        x="20"
                        y="2"
                        className="font-sans font-medium text-[11px] fill-nexus-text"
                      >
                        {node.label.length > 24
                          ? `${node.label.substring(0, 22)}...`
                          : node.label}
                      </text>
                      <text
                        x="20"
                        y="15"
                        className="font-mono text-[9px] fill-nexus-muted"
                      >
                        {node.sublabel}
                      </text>
                    </g>
                  )}

                  {/* NODE TYPE: 4. EVIDENCE LEAF */}
                  {node.type === 'evidence' && (
                    <g>
                      <circle
                        r="12"
                        fill="#11191B"
                        stroke="#52E8D1"
                        strokeWidth="1.5"
                      />
                      <ShieldCheck className="w-3 h-3 text-nexus-cyan -translate-x-1.5 -translate-y-1.5 pointer-events-none" />
                      <text
                        x="18"
                        y="2"
                        className="font-mono text-[10px] font-bold fill-nexus-cyan"
                      >
                        {node.label.length > 20
                          ? `${node.label.substring(0, 18)}...`
                          : node.label}
                      </text>
                      <text
                        x="18"
                        y="14"
                        className="font-mono text-[8px] fill-nexus-lime uppercase"
                      >
                        VERIFIED PROOF ↗
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {/* TELEMETRY INSPECTOR DOCK */}
      <div className="p-4 rounded-lg bg-nexus-elevated border border-nexus-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-nexus-surface border border-nexus-border text-nexus-cyan">
            {activeInspectorNode.type === 'hub' ? (
              <FolderGit2 className="w-5 h-5" />
            ) : activeInspectorNode.type === 'member' ? (
              <Users className="w-5 h-5 text-nexus-lime" />
            ) : activeInspectorNode.type === 'task' ? (
              <CheckCircle2 className="w-5 h-5 text-nexus-amber" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-nexus-cyan" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-nexus-surface border border-nexus-border text-nexus-muted">
                {activeInspectorNode.type === 'hub'
                  ? 'PROJECT ROOT NODE'
                  : activeInspectorNode.type === 'member'
                  ? 'TEAM MEMBER NODE'
                  : activeInspectorNode.type === 'task'
                  ? 'DELIVERABLE NODE'
                  : 'VERIFIED PROOF LEAF'}
              </span>
              <span className="font-display font-bold text-sm text-nexus-text">
                {activeInspectorNode.label}
              </span>
            </div>
            <p className="text-xs text-nexus-muted font-sans mt-0.5">
              {activeInspectorNode.type === 'hub'
                ? `Total team fairness projection: ${activeInspectorNode.score}%. All node connections verified.`
                : activeInspectorNode.type === 'member'
                ? `${activeInspectorNode.sublabel} · Personal Contribution: ${activeInspectorNode.score}% · ${activeInspectorNode.raw?.tasks_completed || 5} deliverables completed.`
                : activeInspectorNode.type === 'task'
                ? `Deliverable status: ${activeInspectorNode.status} · Assigned to ${activeInspectorNode.raw?.assigned_to} · Priority: ${activeInspectorNode.raw?.priority}.`
                : `Verified Artifact: ${activeInspectorNode.raw?.metrics || 'Cryptographic SHA timestamp recorded.'}`}
            </p>
          </div>
        </div>

        {/* Action Button for Evidence Link or Filter */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          {activeInspectorNode.url ? (
            <a
              href={activeInspectorNode.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-nexus-cyan/10 border border-nexus-cyan text-nexus-cyan hover:bg-nexus-cyan/20 transition-colors"
            >
              <span>Inspect External Artifact</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="text-[11px] font-mono text-nexus-muted flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-nexus-cyan" />
              <span>Hover or click nodes to trace lineage</span>
            </span>
          )}
        </div>
      </div>

      {/* LEGEND BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-nexus-border/60 text-xs font-mono text-nexus-muted">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-nexus-cyan inline-block shadow-[0_0_8px_#52E8D1]" />
            <span>Tier 0: Project Hub</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-nexus-lime inline-block shadow-[0_0_8px_#C5FF4A]" />
            <span>Tier 1: Team Member</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-nexus-amber inline-block" />
            <span>Tier 2: Deliverable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-nexus-cyan inline-block" />
            <span>Tier 3: Verified Proof</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-nexus-lime">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Continuous SHA telemetry edge stream active</span>
        </div>
      </div>
    </div>
  )
}
