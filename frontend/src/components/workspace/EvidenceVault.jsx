import React, { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  Vault,
  Search,
  Plus,
  GitPullRequest,
  Palette,
  FileText,
  ExternalLink,
  ShieldCheck,
  Eye,
  FileCheck2,
} from 'lucide-react'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { Modal } from '../common/Modal'

export function EvidenceVault({
  evidence = [],
  members = [],
  onOpenSubmitEvidence,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [memberFilter, setMemberFilter] = useState('ALL')
  const [inspectItem, setInspectItem] = useState(null)

  // Filter evidence
  const filteredEvidence = useMemo(() => {
    return evidence.filter((item) => {
      const matchesSearch =
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.task_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType =
        typeFilter === 'ALL' || item.type === typeFilter

      const matchesMember =
        memberFilter === 'ALL' || item.author === memberFilter

      return matchesSearch && matchesType && matchesMember
    })
  }, [evidence, searchQuery, typeFilter, memberFilter])

  // Icon selector based on type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'github_pr':
      case 'github':
        return GitPullRequest
      case 'figma':
        return Palette
      case 'document':
      case 'pdf':
        return FileText
      default:
        return FileCheck2
    }
  }

  const getTypeLabel = (type) => {
    switch (type) {
      case 'github_pr':
      case 'github':
        return 'GitHub PR'
      case 'figma':
        return 'Figma Design'
      case 'document':
      case 'pdf':
        return 'Document'
      default:
        return 'Deliverable'
    }
  }

  return (
    <div className="space-y-6">
      {/* Vault Control Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-nexus-surface border border-nexus-border rounded-xl">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-nexus-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search evidence vault..."
              className="w-full bg-nexus-elevated border border-nexus-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-nexus-text placeholder-nexus-muted/40 focus:outline-none focus:border-nexus-lime font-sans"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-nexus-elevated border border-nexus-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-nexus-muted focus:text-nexus-text focus:outline-none focus:border-nexus-lime cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="github_pr">GitHub PRs</option>
            <option value="figma">Figma Designs</option>
            <option value="document">Documents & PDFs</option>
          </select>

          {/* Member Filter */}
          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="bg-nexus-elevated border border-nexus-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-nexus-muted focus:text-nexus-text focus:outline-none focus:border-nexus-lime cursor-pointer"
          >
            <option value="ALL">All Contributors</option>
            {members.map((m) => (
              <option key={m.id || m.email} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Button */}
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={onOpenSubmitEvidence}
        >
          Submit Work Evidence
        </Button>
      </div>

      {/* Summary Banner */}
      <div className="p-4 bg-nexus-elevated/60 border border-nexus-border rounded-xl flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-nexus-lime" />
          <span className="text-nexus-text font-semibold">
            {filteredEvidence.length} Verifiable Deliverables Archived
          </span>
          <span className="text-nexus-muted hidden md:inline">
            · All items cryptographically timestamped for academic integrity audit
          </span>
        </div>
        <Badge variant="lime" dot>
          VAULT ACTIVE
        </Badge>
      </div>

      {/* Evidence Cards Grid */}
      {filteredEvidence.length === 0 ? (
        <div className="bg-nexus-surface border border-nexus-border rounded-xl p-12 text-center space-y-3">
          <Vault className="w-10 h-10 text-nexus-muted mx-auto" />
          <h4 className="font-display font-bold text-base text-nexus-text">No Evidence Artifacts Found</h4>
          <p className="text-xs text-nexus-muted max-w-sm mx-auto">
            Attach GitHub pull requests, Figma prototypes, or document uploads to verify your project deliverables.
          </p>
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={onOpenSubmitEvidence}
          >
            Submit First Artifact
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvidence.map((item, idx) => {
            const Icon = getTypeIcon(item.type)
            const typeLabel = getTypeLabel(item.type)

            return (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className="group relative bg-nexus-surface border border-nexus-border hover:border-nexus-cyan/60 rounded-xl p-5 shadow-nexus-card hover:bg-nexus-surface-hover transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Card Top: Type badge & Verification tag */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-nexus-elevated border border-nexus-border text-nexus-cyan">
                      <Icon className="w-3 h-3 text-nexus-cyan" />
                      <span>{typeLabel}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-nexus-lime">
                      <ShieldCheck className="w-3.5 h-3.5 text-nexus-lime" />
                      <span>VERIFIED</span>
                    </span>
                  </div>

                  {/* Artifact Title */}
                  <h4 className="font-display font-bold text-base text-nexus-text group-hover:text-nexus-cyan transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h4>

                  {/* Associated Task */}
                  {item.task_title && (
                    <div className="mt-2 text-xs text-nexus-muted line-clamp-1">
                      Deliverable: <strong className="text-nexus-text">{item.task_title}</strong>
                    </div>
                  )}

                  {/* Metrics snippet */}
                  {item.metrics && (
                    <div className="mt-3 p-2 rounded bg-nexus-elevated border border-nexus-border font-mono text-[11px] text-nexus-lime">
                      {item.metrics}
                    </div>
                  )}
                </div>

                {/* Card Footer: Author & Inspect / Open URL */}
                <div className="mt-5 pt-3.5 border-t border-nexus-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono text-nexus-muted">
                    <div className="w-5 h-5 rounded-full bg-nexus-elevated border border-nexus-border flex items-center justify-center text-[9px] text-nexus-lime font-bold">
                      {item.author?.[0] || 'A'}
                    </div>
                    <span className="truncate max-w-[100px]">{item.author || 'Contributor'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectItem(item)}
                      className="p-1.5 rounded hover:bg-nexus-elevated text-nexus-muted hover:text-nexus-cyan transition-colors cursor-pointer"
                      title="Inspect Deliverable Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded hover:bg-nexus-elevated text-nexus-lime hover:text-[#d5ff6b] transition-colors"
                        title="Open External Resource"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Proof Inspector Modal */}
      {inspectItem && (
        <Modal
          isOpen={Boolean(inspectItem)}
          onClose={() => setInspectItem(null)}
          title="Deliverable Proof Inspector"
          subtitle="Verifiable evidence record attached to academic project audit."
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-nexus-surface border border-nexus-border space-y-3">
              <div>
                <span className="text-nexus-muted uppercase tracking-wider text-[10px]">
                  Artifact Title
                </span>
                <p className="font-display font-bold text-base text-nexus-text mt-0.5 font-sans">
                  {inspectItem.title}
                </p>
              </div>

              <div>
                <span className="text-nexus-muted uppercase tracking-wider text-[10px]">
                  Associated Task Deliverable
                </span>
                <p className="text-nexus-cyan text-sm font-sans mt-0.5">
                  {inspectItem.task_title || 'General Milestone'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-nexus-border">
                <div>
                  <span className="text-nexus-muted uppercase tracking-wider text-[10px]">
                    Submitted By
                  </span>
                  <p className="text-nexus-text font-bold mt-0.5">
                    {inspectItem.author || 'Team Member'}
                  </p>
                </div>
                <div>
                  <span className="text-nexus-muted uppercase tracking-wider text-[10px]">
                    Status
                  </span>
                  <p className="text-nexus-lime font-bold mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </p>
                </div>
              </div>

              {inspectItem.metrics && (
                <div className="pt-2 border-t border-nexus-border">
                  <span className="text-nexus-muted uppercase tracking-wider text-[10px]">
                    Verification Metrics
                  </span>
                  <p className="text-nexus-lime mt-0.5">{inspectItem.metrics}</p>
                </div>
              )}

              {inspectItem.url && (
                <div className="pt-2 border-t border-nexus-border">
                  <span className="text-nexus-muted uppercase tracking-wider text-[10px]">
                    Direct Link
                  </span>
                  <a
                    href={inspectItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-nexus-cyan hover:underline truncate mt-0.5 flex items-center gap-1"
                  >
                    <span className="truncate">{inspectItem.url}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setInspectItem(null)}
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
