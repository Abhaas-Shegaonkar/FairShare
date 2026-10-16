import React, { useState, useEffect } from 'react'
import { authService } from '../services/apiClient'
import { MOCK_USER } from '../services/mockData'
import { AuthContext } from './authContextInstance'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('fairshare_token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('fairshare_token')
      if (storedToken) {
        try {
          const res = await authService.getMe()
          if (res?.success && res.data?.user) {
            setUser(res.data.user)
          } else {
            setUser(MOCK_USER)
          }
        } catch {
          setUser(MOCK_USER)
        }
      } else {
        localStorage.setItem('fairshare_token', 'fs_demo_session_active')
        localStorage.setItem('fairshare_user', JSON.stringify(MOCK_USER))
        setToken('fs_demo_session_active')
        setUser(MOCK_USER)
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    setIsLoading(true)
    try {
      const res = await authService.login({ email, password })
      if (res?.success && res.data) {
        setUser(res.data.user)
        setToken(res.data.token)
        return { success: true }
      }
      throw new Error(res?.error?.message || 'Authentication failed')
    } catch (err) {
      return { success: false, error: err.message || 'Unable to connect to login service' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name, email, password, college) => {
    setIsLoading(true)
    try {
      const res = await authService.register({ name, email, password, college })
      if (res?.success && res.data) {
        setUser(res.data.user)
        setToken(res.data.token)
        return { success: true }
      }
      throw new Error(res?.error?.message || 'Registration failed')
    } catch (err) {
      return { success: false, error: err.message || 'Unable to complete registration' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setToken(null)
  }

  const quickDemoLogin = () => {
    localStorage.setItem('fairshare_token', 'fs_demo_session_active')
    localStorage.setItem('fairshare_user', JSON.stringify(MOCK_USER))
    setToken('fs_demo_session_active')
    setUser(MOCK_USER)
  }

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    logout,
    quickDemoLogin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
