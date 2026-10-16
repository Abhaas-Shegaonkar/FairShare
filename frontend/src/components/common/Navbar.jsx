import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  ShieldCheck,
  LayoutDashboard,
  KanbanSquare,
  BarChart3,
  FileText,
  LogOut,
  Menu,
  X,
  PlusCircle,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { Badge } from './Badge'
import { Button } from './Button'

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Workspace', path: '/projects/a1b2c3d4-0000-0000-0000-000000000001', icon: KanbanSquare },
    { name: 'Analytics', path: '/projects/a1b2c3d4-0000-0000-0000-000000000001/contribution', icon: BarChart3 },
    { name: 'Audit Report', path: '/projects/a1b2c3d4-0000-0000-0000-000000000001/report', icon: FileText },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-nexus-border bg-nexus-bg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Telemetry Indicator */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-nexus-surface border border-nexus-border-bright flex items-center justify-center text-nexus-lime shadow-nexus-glow group-hover:border-nexus-lime/50 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg tracking-wider uppercase text-nexus-text">
                  FairShare
                </span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-nexus-surface border border-nexus-border text-nexus-cyan hidden sm:inline">
                  v2.0
                </span>
              </div>
            </div>
          </Link>

          {/* Telemetry Status Chip */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-nexus-surface border border-nexus-border text-[11px] font-mono text-nexus-muted">
            <span className="nexus-led nexus-led-lime" />
            <span>NEXUS TELEMETRY ACTIVE</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = isActive(item.path)
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-3.5 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all ${
                  active
                    ? 'text-nexus-lime bg-nexus-surface border border-nexus-lime/30 shadow-nexus-glow'
                    : 'text-nexus-muted hover:text-nexus-text hover:bg-nexus-surface/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-nexus-lime' : 'text-nexus-muted'}`} />
                <span>{item.name}</span>
                {active && (
                  <motion.div
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 rounded-lg border border-nexus-lime/40 pointer-events-none"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right Section: New Project & User Badge */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/projects/new">
            <Button variant="cyan" size="sm" icon={PlusCircle}>
              New Project
            </Button>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-3 pl-2 border-l border-nexus-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-nexus-surface border border-nexus-border flex items-center justify-center text-nexus-lime font-mono text-xs font-bold">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-medium text-nexus-text leading-tight">
                    {user?.name || 'Student'}
                  </div>
                  <div className="text-[10px] font-mono text-nexus-muted">
                    {user?.college ? user.college.split(' ')[0] : 'MIT'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-nexus-muted hover:text-nexus-crimson hover:bg-nexus-surface transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-nexus-surface border border-nexus-border text-nexus-text hover:text-nexus-lime transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-nexus-border bg-nexus-elevated px-4 py-5 space-y-4"
          >
            {/* User Info on Mobile */}
            {isAuthenticated && (
              <div className="flex items-center justify-between pb-3 border-b border-nexus-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-nexus-surface border border-nexus-lime/50 flex items-center justify-center text-nexus-lime font-mono text-xs font-bold">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-nexus-text">{user?.name}</div>
                    <div className="text-[10px] font-mono text-nexus-muted">{user?.email}</div>
                  </div>
                </div>
                <Badge variant="lime" dot>
                  ONLINE
                </Badge>
              </div>
            )}

            {/* Mobile Nav Links */}
            <div className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.path)
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                      active
                        ? 'text-nexus-lime bg-nexus-surface border border-nexus-lime/30'
                        : 'text-nexus-muted hover:text-nexus-text hover:bg-nexus-surface/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* Mobile Action Buttons */}
            <div className="pt-2 border-t border-nexus-border space-y-2">
              <Link to="/projects/new" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="cyan" size="sm" icon={PlusCircle} fullWidth>
                  New Project Wizard
                </Button>
              </Link>
              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={LogOut}
                  fullWidth
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="text-nexus-crimson hover:text-nexus-crimson"
                >
                  Sign Out
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" size="sm" fullWidth>
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" fullWidth>
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
