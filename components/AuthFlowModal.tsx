'use client'

import React, { useState } from 'react'
import { Logomark } from '@/components/tools/shared/icons/Logomark'
import { emailPasswordSignIn, googleSignIn } from '@/lib/authClient'
import { createBrand } from '@/app/tools/ai-visibility-tracker/(app)/onboarding/actions'

interface AuthFlowModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (domain: string, userEmail: string) => void
}

function ArrowUpRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  )
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function AuthFlowModal({ isOpen, onClose, onComplete }: AuthFlowModalProps) {
  const [step, setStep] = useState<'auth' | 1 | 2 | 3>('auth')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [brandName, setBrandName] = useState('')
  const [domain, setDomain] = useState('')
  const [selectedTools, setSelectedTools] = useState<string[]>([
    'AI Search Visibility',
    'Schema Markup',
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await emailPasswordSignIn(mode, email, password)
      setEmail(user.email ?? email)
      setStep(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleClick(e: React.MouseEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await googleSignIn()
      setEmail(user.email ?? '')
      setStep(1)
    } catch {
      setError(
        "Google sign-in didn't work here — try the full login page at /tools/ai-visibility-tracker/login instead."
      )
    } finally {
      setLoading(false)
    }
  }

  function toggleTool(t: string) {
    if (selectedTools.includes(t)) {
      setSelectedTools(selectedTools.filter((item) => item !== t))
    } else {
      setSelectedTools([...selectedTools, t])
    }
  }

  async function handleNextStep() {
    if (step === 1) {
      if (!brandName.trim() || !domain.trim()) {
        setError('Brand name and domain are required.')
        return
      }
      setError(null)
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else if (step === 3) {
      setError(null)
      setLoading(true)
      const formData = new FormData()
      formData.set('name', brandName)
      formData.set('domain', domain)
      try {
        await createBrand(formData)
        onComplete(domain, email)
      } catch (err) {
        const digest = (err as { digest?: string })?.digest
        if (digest?.startsWith('NEXT_REDIRECT')) throw err
        setError(err instanceof Error ? err.message : 'Could not create your brand')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white rounded-[32px] p-8 md:p-10 shadow-2xl border border-black/10 relative overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-200 transition cursor-pointer"
        >
          <CloseIcon />
        </button>

        {/* STEP 0: AUTHENTICATION */}
        {step === 'auth' && (
          <div>
            <div className="flex flex-col items-center text-center mb-6">
              <Logomark className="w-12 h-12 mb-3 text-[#E86A00]" />
              <h2
                className="text-2xl font-bold text-neutral-900 tracking-tight"
                style={{ fontFamily: "'Inter Tight', sans-serif" }}
              >
                {mode === 'login' ? 'Log in to OMNI SEO' : 'Create your OMNI SEO Account'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Access all 5 AI search &amp; visibility tools in one studio.
              </p>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-neutral-50 text-sm text-neutral-900 outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-neutral-50 text-sm text-neutral-900 outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition"
                />
              </div>

              {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#FFD209] text-black font-semibold text-sm hover:bg-[#e0b800] transition shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:cursor-default disabled:opacity-60"
              >
                <span>{loading ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Sign Up Free'}</span>
                {!loading && <ArrowUpRightIcon />}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-neutral-200" />
              or
              <div className="h-px flex-1 bg-neutral-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading}
              className="w-full py-3 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-semibold hover:bg-neutral-50 transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:cursor-default disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="font-bold text-black hover:underline cursor-pointer"
                  >
                    Sign up free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-bold text-black hover:underline cursor-pointer"
                  >
                    Log in
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: BRAND SETUP */}
        {step === 1 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold text-black bg-[#FFD209] px-2.5 py-0.5 rounded-full">
                Step 1 of 3
              </span>
              <span className="text-xs text-muted-foreground font-mono">Workspace Setup</span>
            </div>

            <h2
              className="text-2xl font-bold text-neutral-900 tracking-tight mb-1"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              Set up your Brand &amp; Domain
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              Enter your domain so OMNI SEO can crawl schemas, sitemaps, and AI search visibility.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Brand / Company Name
                </label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-neutral-50 text-sm text-neutral-900 outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Website Domain
                </label>
                <input
                  type="text"
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="acme.com"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-neutral-50 text-sm font-mono text-neutral-900 outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition"
                />
              </div>

              {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-3.5 rounded-xl bg-black text-white font-semibold text-sm hover:bg-neutral-800 transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Continue to Tool Selection</span>
                <ArrowUpRightIcon />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: TOOL SELECTION */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold text-black bg-[#FFD209] px-2.5 py-0.5 rounded-full">
                Step 2 of 3
              </span>
              <span className="text-xs text-muted-foreground font-mono">Tool Customization</span>
            </div>

            <h2
              className="text-2xl font-bold text-neutral-900 tracking-tight mb-1"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              Select your initial AI Tools
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              Choose which tools to pin to your studio dashboard for quick access.
            </p>

            <div className="space-y-2.5 mb-6">
              {[
                'AI Search Visibility',
                'Schema Markup Generator',
                'Sitemap.xml Generator',
                'Sitemap.html Generator',
                'Keyword Density Checker',
              ].map((tool) => {
                const isSelected = selectedTools.includes(tool)
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'border-black bg-neutral-900 text-white shadow-sm'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{tool}</span>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                        isSelected ? 'bg-[#FFD209] text-black font-bold' : 'border border-neutral-300 bg-white'
                      }`}
                    >
                      {isSelected && '✓'}
                    </div>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="w-full py-3.5 rounded-xl bg-black text-white font-semibold text-sm hover:bg-neutral-800 transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Launch Studio App</span>
              <ArrowUpRightIcon />
            </button>
          </div>
        )}

        {/* STEP 3: FINALIZATION */}
        {step === 3 && (
          <div className="text-center py-4">
            <Logomark className="w-14 h-14 mx-auto mb-4 text-[#E86A00] animate-bounce" />
            <h2
              className="text-2xl font-bold text-neutral-900 tracking-tight mb-2"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              Initializing OMNI SEO Studio…
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6">
              Configuring your workspace project for <span className="font-mono font-bold text-neutral-900">{domain || 'acme.com'}</span>.
            </p>

            {error && <p className="text-xs text-rose-600 mb-4 font-medium">{error}</p>}

            <button
              type="button"
              onClick={handleNextStep}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#FFD209] text-black font-bold text-sm hover:bg-[#e0b800] transition shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <span>{loading ? 'Entering Studio…' : 'Open Studio Dashboard'}</span>
              <ArrowUpRightIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
