import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Terminal,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, quickDemoLogin } = useAuth()

  const [email, setEmail] = useState('abhaas@college.edu')
  const [password, setPassword] = useState('StrongPassword123!')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    try {
      const res = await login(email, password)
      if (res?.success) {
        navigate('/dashboard')
      } else {
        setErrorMsg(res?.error || 'Invalid student credentials')
      }
    } catch {
      setErrorMsg('Authentication service connection error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoAutofill = () => {
    quickDemoLogin()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-nexus-bg text-nexus-text font-sans flex flex-col justify-between selection:bg-nexus-lime/20 selection:text-nexus-lime">
      {/* Top Header */}
      <header className="p-6 border-b border-nexus-border flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-nexus-surface border border-nexus-border-bright flex items-center justify-center text-nexus-lime shadow-nexus-glow group-hover:border-nexus-lime/50 transition-colors">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-wider uppercase text-nexus-text">
            FairShare
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant="cyan" dot>
            STUDENT GATEWAY
          </Badge>
        </div>
      </header>

      {/* Main Terminal Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Auth Tab Switcher */}
          <div className="flex rounded-lg bg-nexus-surface border border-nexus-border p-1 mb-6 relative">
            <div className="relative flex-1 text-center py-2 text-xs font-mono font-bold text-nexus-lime bg-nexus-elevated border border-nexus-lime/30 rounded shadow-nexus-glow">
              <span>TERMINAL LOGIN</span>
            </div>
            <Link
              to="/signup"
              className="flex-1 text-center py-2 text-xs font-mono font-medium text-nexus-muted hover:text-nexus-text transition-colors"
            >
              ENLIST (SIGN UP)
            </Link>
          </div>

          <div className="bg-nexus-surface border border-nexus-border rounded-xl p-8 shadow-nexus-card nexus-corner-bracket space-y-6">
            <div className="space-y-1 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-nexus-elevated border border-nexus-border text-nexus-lime mb-2 shadow-nexus-glow">
                <Terminal className="w-6 h-6" />
              </div>
              <h1 className="font-display font-bold text-2xl text-nexus-text uppercase tracking-wide">
                Student Access Node
              </h1>
              <p className="text-xs text-nexus-muted">
                Enter your academic credentials or launch fast evaluation mode.
              </p>
            </div>

            {/* Error Notice */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-nexus-crimson/10 border border-nexus-crimson/40 text-xs font-mono text-nexus-crimson flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-nexus-muted block uppercase">
                  Academic Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-nexus-muted">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@college.edu"
                    className="w-full pl-9 pr-3 py-2 bg-nexus-elevated border border-nexus-border rounded-lg text-xs font-mono text-nexus-text focus:outline-none focus:border-nexus-lime focus:ring-1 focus:ring-nexus-lime transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <label className="text-nexus-muted uppercase">Password</label>
                  <span className="text-[11px] text-nexus-cyan hover:underline cursor-pointer">
                    Forgot key?
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-nexus-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-nexus-elevated border border-nexus-border rounded-lg text-xs font-mono text-nexus-text focus:outline-none focus:border-nexus-lime focus:ring-1 focus:ring-nexus-lime transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isLoading}
                  icon={ArrowRight}
                >
                  Authenticate & Launch
                </Button>
              </div>
            </form>

            {/* Quick Demo Bypass */}
            <div className="pt-4 border-t border-nexus-border space-y-3">
              <div className="flex items-center justify-between text-xs text-nexus-muted">
                <span className="font-mono">FAST EVALUATION:</span>
                <span className="text-[11px] text-nexus-lime">1-Click Bypass</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                fullWidth
                icon={Sparkles}
                onClick={handleDemoAutofill}
                className="text-xs font-mono text-nexus-cyan hover:text-nexus-cyan"
              >
                Instant Prototype Login (Abhaas · MIT)
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 border-t border-nexus-border text-center text-xs text-nexus-muted font-mono">
        <span>FairShare NEXUS Core · Encrypted Academic Gateway</span>
      </footer>
    </div>
  )
}
