import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Building,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'

export default function SignupPage() {
  const navigate = useNavigate()
  const { register, quickDemoLogin } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [college, setCollege] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    try {
      const res = await register(name, email, password, college)
      if (res?.success) {
        navigate('/dashboard')
      } else {
        setErrorMsg(res?.error || 'Registration failed. Check your inputs.')
      }
    } catch {
      setErrorMsg('Network error while registering account.')
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
          <Badge variant="lime" dot>
            ENLISTMENT PROTOCOL
          </Badge>
        </div>
      </header>

      {/* Main Registration Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Auth Tab Switcher */}
          <div className="flex rounded-lg bg-nexus-surface border border-nexus-border p-1 mb-6 relative">
            <Link
              to="/login"
              className="flex-1 text-center py-2 text-xs font-mono font-medium text-nexus-muted hover:text-nexus-text transition-colors"
            >
              TERMINAL LOGIN
            </Link>
            <div className="relative flex-1 text-center py-2 text-xs font-mono font-bold text-nexus-lime bg-nexus-elevated border border-nexus-lime/30 rounded shadow-nexus-glow">
              <span>ENLIST (SIGN UP)</span>
            </div>
          </div>

          <div className="bg-nexus-surface border border-nexus-border rounded-xl p-8 shadow-nexus-card nexus-corner-bracket space-y-6">
            <div className="space-y-1 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-nexus-elevated border border-nexus-border text-nexus-cyan mb-2 shadow-nexus-cyan-glow">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="font-display font-bold text-2xl text-nexus-text uppercase tracking-wide">
                Enlist Student Account
              </h1>
              <p className="text-xs text-nexus-muted">
                Join your academic peers and automatically claim project invitations.
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-nexus-muted block uppercase">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-nexus-muted">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Abhaas Shegaonkar"
                      className="w-full pl-9 pr-3 py-2 bg-nexus-elevated border border-nexus-border rounded-lg text-xs font-mono text-nexus-text focus:outline-none focus:border-nexus-lime focus:ring-1 focus:ring-nexus-lime transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-nexus-muted block uppercase">
                    Institution / College
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-nexus-muted">
                      <Building className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="e.g. MIT Institute"
                      className="w-full pl-9 pr-3 py-2 bg-nexus-elevated border border-nexus-border rounded-lg text-xs font-mono text-nexus-text focus:outline-none focus:border-nexus-lime focus:ring-1 focus:ring-nexus-lime transition-colors"
                    />
                  </div>
                </div>
              </div>

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
                <label className="text-xs font-mono text-nexus-muted block uppercase">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-nexus-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-9 pr-3 py-2 bg-nexus-elevated border border-nexus-border rounded-lg text-xs font-mono text-nexus-text focus:outline-none focus:border-nexus-lime focus:ring-1 focus:ring-nexus-lime transition-colors"
                  />
                </div>
              </div>

              {/* Invitation notice pill */}
              <div className="p-3 rounded-lg bg-nexus-surface border border-nexus-border flex items-start gap-2.5 text-[11px] font-sans text-nexus-muted">
                <CheckCircle className="w-4 h-4 text-nexus-cyan shrink-0 mt-0.5" />
                <span>
                  Any pending team invitations matching your academic email address will be automatically linked to your account upon registration.
                </span>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isLoading}
                  icon={ArrowRight}
                >
                  Create Student Account
                </Button>
              </div>
            </form>

            {/* Quick Demo Bypass */}
            <div className="pt-4 border-t border-nexus-border space-y-3">
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
