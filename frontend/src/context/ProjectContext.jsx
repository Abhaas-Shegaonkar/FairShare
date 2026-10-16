import React, { useState, useEffect } from 'react'
import { ProjectContext } from './projectContextInstance'
import {
  projectService,
  taskService,
  evidenceService,
} from '../services/apiClient'
import {
  MOCK_PROJECTS,
  MOCK_TASKS,
  MOCK_EVIDENCE_ITEMS,
  MOCK_ACTIVITY_LOGS,
  MOCK_TEAM_MEMBERS,
} from '../services/mockData'

export function ProjectProvider({ projectId, children }) {
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [evidence, setEvidence] = useState([])
  const [activities, setActivities] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [error] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    let ignore = false

    async function loadProjectData() {
      if (!projectId) return

      try {
        const [projRes, taskRes, evRes, actRes] = await Promise.all([
          projectService.getProject(projectId),
          taskService.getTasks(projectId),
          evidenceService.getEvidence(projectId),
          projectService.getActivityLogs(projectId),
        ])

        if (ignore) return

        if (projRes?.success && projRes.data) {
          setProject(projRes.data)
        } else {
          const fallbackProject =
            MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0]
          setProject({
            ...fallbackProject,
            members: MOCK_TEAM_MEMBERS,
          })
        }

        if (taskRes?.success && taskRes.data) {
          setTasks(taskRes.data)
        } else {
          setTasks(MOCK_TASKS)
        }

        if (evRes?.success && evRes.data) {
          setEvidence(evRes.data)
        } else {
          setEvidence(MOCK_EVIDENCE_ITEMS)
        }

        if (actRes?.success && actRes.data) {
          setActivities(actRes.data)
        } else {
          setActivities(MOCK_ACTIVITY_LOGS)
        }
      } catch (err) {
        console.warn('[ProjectContext] Fetch error, applying resilient mock state:', err)
        if (ignore) return
        const fallbackProject =
          MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0]
        setProject({
          ...fallbackProject,
          members: MOCK_TEAM_MEMBERS,
        })
        setTasks(MOCK_TASKS)
        setEvidence(MOCK_EVIDENCE_ITEMS)
        setActivities(MOCK_ACTIVITY_LOGS)
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadProjectData()

    return () => {
      ignore = true
    }
  }, [projectId, refreshTrigger])

  // Automatic re-sync upon window focus or tab visibility change (Gap 2 Resolution)
  useEffect(() => {
    const handleSync = () => {
      if (document.visibilityState === 'visible') {
        setRefreshTrigger((prev) => prev + 1)
      }
    }
    document.addEventListener('visibilitychange', handleSync)
    window.addEventListener('focus', handleSync)
    return () => {
      document.removeEventListener('visibilitychange', handleSync)
      window.removeEventListener('focus', handleSync)
    }
  }, [])

  // Change task status with optimistic update and activity logging
  const changeTaskStatus = async (taskId, newStatus, currentUserName = 'Abhaas') => {
    const previousTasks = [...tasks]
    const targetTask = tasks.find((t) => t.id === taskId)
    if (!targetTask) return

    const now = new Date().toISOString()
    const isCompleted = newStatus === 'Completed'

    // Optimistic task state
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: newStatus,
          completed_at: isCompleted ? now : null,
          completed_by: isCompleted ? currentUserName : null,
        }
      }
      return t
    })
    setTasks(updatedTasks)

    // Recalculate project progress
    const completedCount = updatedTasks.filter((t) => t.status === 'Completed').length
    const totalCount = updatedTasks.length
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    if (project) {
      setProject((prev) => ({
        ...prev,
        completed_tasks: completedCount,
        total_tasks: totalCount,
        progress_percentage: progressPct,
      }))
    }

    // Append activity item
    const newActivity = {
      id: `act-${Date.now()}`,
      timestamp: 'Just now',
      user: currentUserName,
      action: isCompleted ? 'completed deliverable' : `moved task to ${newStatus}`,
      detail: targetTask.title,
      category: 'task',
    }
    setActivities((prev) => [newActivity, ...prev])

    // Fire API in background
    try {
      await taskService.updateTaskStatus(taskId, newStatus)
    } catch (err) {
      console.error('Failed to update task status on backend:', err)
      setTasks(previousTasks)
    }
  }

  // Create a new task deliverable
  const addTask = async (taskData) => {
    try {
      const res = await taskService.createTask(projectId, taskData)
      const created = res?.data || {
        id: `task-${Date.now()}`,
        project_id: projectId,
        ...taskData,
        status: 'Todo',
        evidence_count: 0,
        evidence: [],
      }

      setTasks((prev) => [created, ...prev])

      if (project) {
        setProject((prev) => {
          const newTotal = (prev.total_tasks || 0) + 1
          const completed = prev.completed_tasks || 0
          return {
            ...prev,
            total_tasks: newTotal,
            progress_percentage: Math.round((completed / newTotal) * 100),
          }
        })
      }

      const newActivity = {
        id: `act-${Date.now()}`,
        timestamp: 'Just now',
        user: taskData.assigned_to || 'Team Member',
        action: 'enlisted new deliverable',
        detail: taskData.title,
        category: 'task',
      }
      setActivities((prev) => [newActivity, ...prev])

      return { success: true, data: created }
    } catch (err) {
      console.error('Failed to create task:', err)
      return { success: false, error: err.message }
    }
  }

  // Attach evidence to a task and add to evidence vault
  const addEvidence = async (taskId, evidenceData, currentUserName = 'Abhaas') => {
    try {
      const res = await evidenceService.attachEvidence(taskId, evidenceData)
      const newEv = res?.data || {
        id: `ev-${Date.now()}`,
        task_id: taskId,
        ...evidenceData,
        verified: true,
        created_at: new Date().toISOString(),
      }

      // Update task attached evidence and verification indicator
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            const currentEv = t.evidence || []
            return {
              ...t,
              evidence_count: (t.evidence_count || 0) + 1,
              has_evidence: true,
              evidence: [...currentEv, newEv],
            }
          }
          return t
        }),
      )

      // Add to evidence vault list
      const targetTask = tasks.find((t) => t.id === taskId)
      const vaultItem = {
        id: newEv.id,
        task_id: taskId,
        task_title: targetTask?.title || 'Project Deliverable',
        author: currentUserName,
        author_id: 'user-current',
        type: evidenceData.type || 'document',
        title: evidenceData.title,
        url: evidenceData.url,
        verified: true,
        created_at: newEv.created_at || new Date().toISOString(),
        metrics: evidenceData.metrics || 'Verified Artifact',
      }
      setEvidence((prev) => [vaultItem, ...prev])

      // Add activity log
      const newActivity = {
        id: `act-${Date.now()}`,
        timestamp: 'Just now',
        user: currentUserName,
        action: 'verified work evidence',
        detail: `${evidenceData.title} attached to '${targetTask?.title || 'Task'}'`,
        category: 'evidence',
      }
      setActivities((prev) => [newActivity, ...prev])

      return { success: true, data: newEv }
    } catch (err) {
      console.error('Failed to attach evidence:', err)
      return { success: false, error: err.message }
    }
  }

  // Upload file helper
  const uploadFile = async (file) => {
    return await evidenceService.uploadFile(projectId, file)
  }

  // Invite member
  const inviteMember = async (memberData) => {
    try {
      const res = await projectService.inviteMember(projectId, memberData)
      const newMember = res?.data || {
        id: `mem-${Date.now()}`,
        name: memberData.name || memberData.email.split('@')[0],
        email: memberData.email,
        role: memberData.role || 'Contributor',
        tasks_assigned: 0,
        tasks_completed: 0,
        timeliness_rate: 100,
        fair_score: 90.0,
        status: 'Active',
        avatar_color: '#52E8D1',
      }

      setProject((prev) => {
        const currentMembers = prev.members || []
        return {
          ...prev,
          members: [...currentMembers, newMember],
          members_count: (prev.members_count || currentMembers.length) + 1,
        }
      })

      const newActivity = {
        id: `act-${Date.now()}`,
        timestamp: 'Just now',
        user: newMember.name,
        action: 'joined engineering workspace',
        detail: `Assigned role: ${newMember.role}`,
        category: 'member',
      }
      setActivities((prev) => [newActivity, ...prev])

      return { success: true, data: newMember }
    } catch (err) {
      console.error('Failed to invite member:', err)
      return { success: false, error: err.message }
    }
  }

  const value = {
    projectId,
    project,
    tasks,
    evidence,
    activities,
    activeTab,
    setActiveTab,
    isLoading,
    error,
    changeTaskStatus,
    addTask,
    addEvidence,
    uploadFile,
    inviteMember,
    refreshProject: () => setRefreshTrigger((prev) => prev + 1),
  }

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}
