import React, { useState } from 'react'
import {
  FilePlus,
  AlertCircle,
} from 'lucide-react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'

export function CreateTaskModal({ isOpen, onClose, members = [], onCreateTask }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [assignedTo, setAssignedTo] = useState(members[0]?.name || 'Abhaas')
  const [dueDate, setDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Deliverable title is required.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const selectedMember = members.find((m) => m.name === assignedTo) || members[0]
      const defaultDate = new Date()
      defaultDate.setDate(defaultDate.getDate() + 7)
      const formattedDate = dueDate || defaultDate.toISOString().split('T')[0]

      const taskPayload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        assigned_to: assignedTo,
        assigned_user_id: selectedMember?.id || 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0',
        due_date: formattedDate,
        deadline: formattedDate,
      }

      const res = await onCreateTask(taskPayload)
      if (res?.success) {
        setTitle('')
        setDescription('')
        setPriority('Medium')
        setDueDate('')
        onClose()
      } else {
        setError(res?.error || 'Failed to create deliverable.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while creating deliverable.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enlist Project Deliverable"
      subtitle="Define actionable milestone, assign ownership, and configure deadline."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-nexus-crimson/10 border border-nexus-crimson/40 text-xs font-mono text-nexus-crimson">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Deliverable Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider text-nexus-muted">
            Deliverable Title <span className="text-nexus-lime">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Implement WebSocket Telemetry Stream"
            className="w-full bg-nexus-surface border border-nexus-border rounded-lg px-3.5 py-2.5 text-sm text-nexus-text placeholder-nexus-muted/40 focus:outline-none focus:border-nexus-lime transition-colors font-sans"
          />
        </div>

        {/* Deliverable Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider text-nexus-muted">
            Technical Specification / Requirements
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline expected deliverables, edge cases, and documentation criteria..."
            className="w-full bg-nexus-surface border border-nexus-border rounded-lg px-3.5 py-2.5 text-sm text-nexus-text placeholder-nexus-muted/40 focus:outline-none focus:border-nexus-lime transition-colors resize-none font-sans"
          />
        </div>

        {/* Priority & Assignee Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Priority */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-nexus-muted">
              Priority Tier
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-nexus-surface border border-nexus-border rounded-lg px-3.5 py-2.5 text-sm text-nexus-text focus:outline-none focus:border-nexus-lime transition-colors font-mono cursor-pointer"
            >
              <option value="Critical">CRITICAL (Blocking Core)</option>
              <option value="High">HIGH (Priority Feature)</option>
              <option value="Medium">MEDIUM (Standard Sprint)</option>
              <option value="Low">LOW (Enhancement / Polish)</option>
            </select>
          </div>

          {/* Assignee */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-nexus-muted">
              Assigned Teammate
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full bg-nexus-surface border border-nexus-border rounded-lg px-3.5 py-2.5 text-sm text-nexus-text focus:outline-none focus:border-nexus-lime transition-colors font-sans cursor-pointer"
            >
              {members.length > 0 ? (
                members.map((m) => (
                  <option key={m.id || m.email} value={m.name}>
                    {m.name} ({m.role || 'Contributor'})
                  </option>
                ))
              ) : (
                <option value="Abhaas">Abhaas (Team Lead)</option>
              )}
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div className="space-y-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider text-nexus-muted">
            Target Completion Cutoff
          </label>
          <div className="relative">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-nexus-surface border border-nexus-border rounded-lg px-3.5 py-2.5 text-sm text-nexus-text focus:outline-none focus:border-nexus-lime transition-colors font-mono"
            />
          </div>
          <p className="text-[11px] text-nexus-muted font-mono">
            Tasks completed prior to this timestamp receive maximum Timeliness multiplier (20%).
          </p>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-nexus-border flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={FilePlus} loading={isSubmitting}>
            Initialize Deliverable
          </Button>
        </div>
      </form>
    </Modal>
  )
}
