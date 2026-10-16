import React, { useState, useMemo } from 'react'
import { AnimatePresence } from 'motion/react'
import {
  Columns,
  List,
  Plus,
  Search,
  Paperclip,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'
import { TaskCard } from './TaskCard'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'

export function TaskBoard({
  tasks = [],
  members = [],
  onStatusChange,
  onAttachEvidence,
  onOpenCreateTask,
}) {
  const [viewMode, setViewMode] = useState('kanban') // 'kanban' | 'list'
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [assigneeFilter, setAssigneeFilter] = useState('ALL')

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesPriority =
        priorityFilter === 'ALL' || task.priority === priorityFilter

      const assignedName =
        typeof task.assigned_to === 'object'
          ? task.assigned_to?.name
          : task.assigned_to || ''
      const matchesAssignee =
        assigneeFilter === 'ALL' || assignedName === assigneeFilter

      return matchesSearch && matchesPriority && matchesAssignee
    })
  }, [tasks, searchQuery, priorityFilter, assigneeFilter])

  // Group by Kanban columns
  const todoTasks = filteredTasks.filter((t) => t.status === 'Todo' || t.status === 'To Do')
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'In Progress')
  const completedTasks = filteredTasks.filter((t) => t.status === 'Completed')

  return (
    <div className="space-y-6">
      {/* Control Bar: View Toggle, Search, Filters, and New Task CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-nexus-surface border border-nexus-border rounded-xl">
        {/* Left: Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-nexus-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deliverables..."
              className="w-full bg-nexus-elevated border border-nexus-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-nexus-text placeholder-nexus-muted/40 focus:outline-none focus:border-nexus-lime font-sans"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-nexus-elevated border border-nexus-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-nexus-muted focus:text-nexus-text focus:outline-none focus:border-nexus-lime cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="bg-nexus-elevated border border-nexus-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-nexus-muted focus:text-nexus-text focus:outline-none focus:border-nexus-lime cursor-pointer"
          >
            <option value="ALL">All Teammates</option>
            {members.map((m) => (
              <option key={m.id || m.email} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: View Mode Toggle & Create CTA */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-0.5 rounded-lg bg-nexus-elevated border border-nexus-border">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-nexus-surface border border-nexus-border-bright text-nexus-lime shadow-sm'
                  : 'text-nexus-muted hover:text-nexus-text'
              }`}
              title="Kanban Board View"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-nexus-surface border border-nexus-border-bright text-nexus-lime shadow-sm'
                  : 'text-nexus-muted hover:text-nexus-text'
              }`}
              title="Table / List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline">List</span>
            </button>
          </div>

          <Button variant="primary" size="sm" icon={Plus} onClick={onOpenCreateTask}>
            New Deliverable
          </Button>
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Column 1: TO DO */}
          <div className="bg-nexus-surface/40 border border-nexus-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-nexus-border">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-nexus-muted" />
                <h3 className="font-display font-bold text-sm text-nexus-text uppercase tracking-wider">
                  To Do
                </h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-nexus-elevated border border-nexus-border text-nexus-muted font-bold">
                {todoTasks.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[300px]">
              <AnimatePresence>
                {todoTasks.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-nexus-muted border border-dashed border-nexus-border/60 rounded-lg">
                    No deliverables in queue
                  </div>
                ) : (
                  todoTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      members={members}
                      onStatusChange={onStatusChange}
                      onAttachEvidence={onAttachEvidence}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Column 2: IN PROGRESS */}
          <div className="bg-nexus-surface/40 border border-nexus-cyan/30 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-nexus-border">
              <div className="flex items-center gap-2">
                <span className="nexus-led nexus-led-cyan w-2 h-2" />
                <h3 className="font-display font-bold text-sm text-nexus-cyan uppercase tracking-wider">
                  In Progress
                </h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-nexus-cyan/10 border border-nexus-cyan/30 text-nexus-cyan font-bold">
                {inProgressTasks.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[300px]">
              <AnimatePresence>
                {inProgressTasks.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-nexus-muted border border-dashed border-nexus-border/60 rounded-lg">
                    No active deliverables
                  </div>
                ) : (
                  inProgressTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      members={members}
                      onStatusChange={onStatusChange}
                      onAttachEvidence={onAttachEvidence}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Column 3: COMPLETED */}
          <div className="bg-nexus-surface/40 border border-nexus-lime/30 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-nexus-border">
              <div className="flex items-center gap-2">
                <span className="nexus-led nexus-led-lime w-2 h-2" />
                <h3 className="font-display font-bold text-sm text-nexus-lime uppercase tracking-wider">
                  Completed
                </h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-nexus-lime/10 border border-nexus-lime/30 text-nexus-lime font-bold">
                {completedTasks.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[300px]">
              <AnimatePresence>
                {completedTasks.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-nexus-muted border border-dashed border-nexus-border/60 rounded-lg">
                    No completed deliverables yet
                  </div>
                ) : (
                  completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      members={members}
                      onStatusChange={onStatusChange}
                      onAttachEvidence={onAttachEvidence}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      ) : (
        /* TABLE / LIST VIEW */
        <div className="bg-nexus-surface border border-nexus-border rounded-xl overflow-hidden shadow-nexus-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-nexus-elevated border-b border-nexus-border text-nexus-muted font-mono uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Deliverable Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Assigned Member</th>
                  <th className="py-3 px-4">Cutoff Date</th>
                  <th className="py-3 px-4">Work Evidence</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nexus-border">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-nexus-muted font-mono">
                      No matching project deliverables found.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const isDone = task.status === 'Completed'
                    const hasProof = task.has_evidence || (task.evidence && task.evidence.length > 0)
                    const assigned =
                      typeof task.assigned_to === 'object'
                        ? task.assigned_to?.name
                        : task.assigned_to || 'Unassigned'

                    return (
                      <tr
                        key={task.id}
                        className="hover:bg-nexus-surface-hover/80 transition-colors font-sans"
                      >
                        <td className="py-3.5 px-4 font-semibold text-nexus-text">
                          <span className={isDone ? 'line-through text-nexus-muted' : ''}>
                            {task.title}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <button
                            type="button"
                            onClick={() => {
                              const nextStatus =
                                task.status === 'Todo'
                                  ? 'In Progress'
                                  : task.status === 'In Progress'
                                  ? 'Completed'
                                  : 'Todo'
                              onStatusChange(task.id, nextStatus)
                            }}
                            className="cursor-pointer"
                          >
                            <Badge
                              variant={
                                isDone
                                  ? 'lime'
                                  : task.status === 'In Progress'
                                  ? 'cyan'
                                  : 'surface'
                              }
                              dot={isDone || task.status === 'In Progress'}
                            >
                              {task.status}
                            </Badge>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              task.priority === 'Critical'
                                ? 'bg-nexus-crimson/10 text-nexus-crimson border border-nexus-crimson/30'
                                : task.priority === 'High'
                                ? 'bg-nexus-amber/10 text-nexus-amber border border-nexus-amber/30'
                                : 'bg-nexus-elevated text-nexus-muted border border-nexus-border'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-nexus-muted font-mono">
                          {assigned}
                        </td>
                        <td className="py-3.5 px-4 text-nexus-muted font-mono">
                          {task.due_date || task.deadline || '2026-10-30'}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          {hasProof ? (
                            <span className="text-nexus-lime flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Verified ({task.evidence_count || task.evidence?.length || 1})</span>
                            </span>
                          ) : isDone ? (
                            <span className="text-nexus-amber flex items-center gap-1 font-bold">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Missing Proof</span>
                            </span>
                          ) : (
                            <span className="text-nexus-muted">Pending</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => onAttachEvidence(task)}
                            className="p-1.5 rounded hover:bg-nexus-elevated text-nexus-cyan hover:text-nexus-lime transition-colors cursor-pointer"
                            title="Attach Evidence"
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
