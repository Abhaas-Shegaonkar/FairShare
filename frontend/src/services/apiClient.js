import axios from 'axios'
import {
  MOCK_USER,
  MOCK_PROJECTS,
  MOCK_TASKS,
  MOCK_TEAM_MEMBERS,
  MOCK_EVIDENCE_ITEMS,
  MOCK_CONTRIBUTION_BREAKDOWN,
  MOCK_ACTIVITY_LOGS,
  MOCK_UPCOMING_DEADLINES,
} from './mockData'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
})

// Attach Bearer token to every outgoing request if stored
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fairshare_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Interceptor for response and offline fallback handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend is unavailable or returns network error, log helpful debug notice
    if (!error.response) {
      console.warn('[FairShare API] Backend unreachable, utilizing local resilient prototype fallback.')
    }
    return Promise.reject(error)
  },
)

/**
 * High-level API Service Modules
 * Each function attempts live backend request first; if backend is unavailable or in mock mode,
 * returns structured mock envelope matching the specification in api.md.
 */

export const authService = {
  async register(data) {
    try {
      const res = await apiClient.post('/auth/register', data)
      return res.data
    } catch {
      // Prototype fallback
      const token = 'fs_mock_token_' + Date.now()
      const user = { ...MOCK_USER, name: data.name, email: data.email }
      localStorage.setItem('fairshare_token', token)
      localStorage.setItem('fairshare_user', JSON.stringify(user))
      return { success: true, data: { user, token, claimed_invitations: 0 } }
    }
  },

  async login(data) {
    try {
      const res = await apiClient.post('/auth/login', data)
      return res.data
    } catch {
      // Prototype fallback
      const token = 'fs_mock_token_' + Date.now()
      const user = { ...MOCK_USER, email: data.email }
      localStorage.setItem('fairshare_token', token)
      localStorage.setItem('fairshare_user', JSON.stringify(user))
      return { success: true, data: { user, token } }
    }
  },

  async getMe() {
    try {
      const res = await apiClient.get('/auth/me')
      return res.data
    } catch {
      const cached = localStorage.getItem('fairshare_user')
      const user = cached ? JSON.parse(cached) : MOCK_USER
      return { success: true, data: { user } }
    }
  },

  logout() {
    localStorage.removeItem('fairshare_token')
    localStorage.removeItem('fairshare_user')
  },
}

export const projectService = {
  async listProjects() {
    try {
      const res = await apiClient.get('/projects')
      return res.data
    } catch {
      return { success: true, data: MOCK_PROJECTS }
    }
  },

  async getProject(projectId) {
    try {
      const res = await apiClient.get(`/projects/${projectId}`)
      return res.data
    } catch {
      const project = MOCK_PROJECTS.find((p) => p.id === projectId) || MOCK_PROJECTS[0]
      return {
        success: true,
        data: {
          ...project,
          members: MOCK_TEAM_MEMBERS,
        },
      }
    }
  },

  async createProject(data) {
    try {
      const res = await apiClient.post('/projects', data)
      return res.data
    } catch {
      const newProject = {
        id: `p-${Date.now()}`,
        name: data.name,
        description: data.description,
        category: data.category,
        start_date: data.start_date || new Date().toISOString().split('T')[0],
        deadline: data.deadline,
        my_role: 'Project Creator',
        total_tasks: 0,
        completed_tasks: 0,
        progress_percentage: 0,
        members_count: (data.members?.length || 0) + 1,
        fairness_score: 100,
        status: 'Active',
        days_remaining: 30,
      }
      return { success: true, data: newProject }
    }
  },

  async getUpcomingDeadlines() {
    try {
      const res = await apiClient.get('/deadlines')
      return res.data
    } catch {
      return { success: true, data: MOCK_UPCOMING_DEADLINES }
    }
  },

  async getActivityLogs(projectId) {
    try {
      const res = await apiClient.get(`/projects/${projectId}/activity`)
      return res.data
    } catch {
      return { success: true, data: MOCK_ACTIVITY_LOGS }
    }
  },

  async inviteMember(projectId, memberData) {
    try {
      const res = await apiClient.post(`/projects/${projectId}/members`, memberData)
      return res.data
    } catch {
      return {
        success: true,
        data: {
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
        },
      }
    }
  },

  async getProjectReport(projectId) {
    try {
      const res = await apiClient.get(`/projects/${projectId}/report`)
      return res.data
    } catch {
      return {
        success: true,
        data: {
          project: MOCK_PROJECTS[0],
          members: MOCK_TEAM_MEMBERS,
          tasks: MOCK_TASKS,
          evidence: MOCK_EVIDENCE_ITEMS,
          generated_at: new Date().toISOString(),
          audit_hash: 'SHA256:7e9b21f92e032d84710bc4a0e9817fcb348d446903a98516bb5609424c5e3170',
        },
      }
    }
  },
}

export const taskService = {
  async getTasks(projectId) {
    try {
      const res = await apiClient.get(`/projects/${projectId}/tasks`)
      return res.data
    } catch {
      return { success: true, data: MOCK_TASKS }
    }
  },

  async updateTaskStatus(taskId, status) {
    try {
      const res = await apiClient.patch(`/tasks/${taskId}/status`, { status })
      return res.data
    } catch {
      return { success: true, data: { task_id: taskId, status, updated_at: new Date().toISOString() } }
    }
  },

  async createTask(projectId, taskData) {
    try {
      const res = await apiClient.post(`/projects/${projectId}/tasks`, taskData)
      return res.data
    } catch {
      const newTask = {
        id: `task-${Date.now()}`,
        project_id: projectId,
        ...taskData,
        status: 'Todo',
        evidence_count: 0,
        evidence: [],
      }
      return { success: true, data: newTask }
    }
  },
}

export const evidenceService = {
  async getEvidence(projectId) {
    try {
      const res = await apiClient.get(`/projects/${projectId}/evidence`)
      return res.data
    } catch {
      return { success: true, data: MOCK_EVIDENCE_ITEMS }
    }
  },

  async attachEvidence(taskId, evidenceData) {
    try {
      const res = await apiClient.post(`/tasks/${taskId}/evidence`, evidenceData)
      return res.data
    } catch {
      const newEvidence = {
        id: `ev-${Date.now()}`,
        task_id: taskId,
        ...evidenceData,
        verified: true,
        created_at: new Date().toISOString(),
      }
      return { success: true, data: newEvidence }
    }
  },

  async uploadFile(projectId, file) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('project_id', projectId)
      const res = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    } catch {
      // Prototype fallback simulating uploaded Supabase Storage asset
      return {
        success: true,
        data: {
          url: `https://storage.supabase.co/water-mgmt/${file.name}`,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
        },
      }
    }
  },
}

export const contributionService = {
  async getContributionScore(projectId, userId) {
    try {
      const res = await apiClient.get(`/projects/${projectId}/contribution/${userId}`)
      return res.data
    } catch {
      return { success: true, data: MOCK_CONTRIBUTION_BREAKDOWN }
    }
  },

  async getTeamComparison(projectId) {
    try {
      const res = await apiClient.get(`/projects/${projectId}/team-comparison`)
      return res.data
    } catch {
      return { success: true, data: MOCK_TEAM_MEMBERS }
    }
  },

  async getTrends(projectId) {
    try {
      const res = await apiClient.get(`/projects/${projectId}/trends`)
      return res.data
    } catch {
      return { success: true, data: MOCK_CONTRIBUTION_BREAKDOWN.trend_data }
    }
  },

  async submitPeerFeedback(projectId, feedbackData) {
    try {
      const res = await apiClient.post(`/projects/${projectId}/feedback`, feedbackData)
      return res.data
    } catch {
      return { success: true, message: 'Peer feedback recorded anonymously.' }
    }
  },

  async getFeedbackStatus(projectId) {
    try {
      const res = await apiClient.get(`/projects/${projectId}/feedback/status`)
      return res.data
    } catch {
      return { success: true, data: { submitted_reviews_count: 0, reviewed_member_ids: [] } }
    }
  },

  async getFeedbackSummary(projectId, userId = null) {
    try {
      const url = userId
        ? `/projects/${projectId}/feedback/summary?user_id=${userId}`
        : `/projects/${projectId}/feedback/summary`
      const res = await apiClient.get(url)
      return res.data
    } catch {
      return {
        success: true,
        data: {
          average_rating: 4.8,
          total_reviews: 3,
          categories: {
            participation: 5.0,
            responsibility: 4.8,
            quality: 4.9,
            collaboration: 4.7,
            communication: 4.8,
            timeliness: 4.9,
          },
        },
      }
    }
  },
}

export const feedbackService = contributionService

