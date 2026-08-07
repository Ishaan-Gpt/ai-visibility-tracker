'use client'

import React, { useState } from 'react'
import { Logomark } from '@/components/tools/shared/icons/Logomark'

interface AuthFlowModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (domain: string, userEmail: string) => void
}

export function AuthFlowModal({ isOpen, onClose, onComplete }: AuthFlowModalProps) {
  const [step, setStep] = useState<'auth' | 1 | 2 | 3>('auth')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('ishaan@omniseo.ai')
  const [password, setPassword] = useState('password123')
  const [domain, setDomain] = useState('acme.com')
  const [selectedTools, setSelectedTools] = useState<string[]>([
    'AI Search Visibility',
    'Schema Markup',
  ])

  if (!isOpen) return null

  function handleAuthSuccess(userEmail: string) {
    setEmail(userEmail)
    setStep(1)
  }

  function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    handleAuthSuccess(email || 'ishaan@omniseo.ai')
  }

  function handleGoogleClick(e: React.MouseEvent) {
    e.preventDefault()
    handleAuthSuccess('ishaan@gmail.com')
  }

  function toggleTool(t: string) {
    if (selectedTools.includes(t)) {
      setSelectedTools(selectedTools.filter((item) => item !== t))
    } else {
      setSelectedTools([...selectedTools, t])
    }
  }

  function handleNextStep() {
    if (step === 1) setStep(2)
    else if (step === 2) setStep(3)
    else if (step === 3) onComplete(domain || 'acme.com', email)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-xl bg-white rounded-[28px] p-8 md:p-10 shadow-2xl border border-black/10 relative overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-black transition"
        >
          ✕
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

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#FFD209] text-black font-semibold text-sm hover:bg-[#e0b800] transition shadow-md cursor-pointer"
              >
                {mode === 'login' ? 'Log In ↗' : 'Sign Up Free ↗'}
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
              className="w-full py-3 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-semibold hover:bg-neutral-50 transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
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
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="font-semibold text-black underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-semibold text-black underline"
                  >
                    Log in
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ONBOARDING STEPS 1, 2, 3 */}
        {step !== 'auth' && (
          <div>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <Logomark className="w-7 h-7 text-[#E86A00]" />
                <span className="text-sm font-bold text-neutral-900 tracking-tight">
                  OMNI SEO Onboarding
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <span>Step {step} of 3</span>
                <div className="flex items-center gap-1 ml-2">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-1.5 rounded-full transition-all ${
                        s === step ? 'w-6 bg-black' : 'w-2 bg-neutral-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full bg-[#FFD209]/20 text-black text-xs font-semibold uppercase tracking-wider">
                    Onboarding Checklist 1/3
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 mt-3 tracking-tight">
                    What site are you working on?
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Set your project's domain and every card in your OMNI SEO studio starts working for it — backlinks, schema, and search audits.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-2">
                    Target Domain Name
                  </label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="acme.com"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-neutral-50 text-base font-mono text-neutral-900 outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full bg-[#FFD209]/20 text-black text-xs font-semibold uppercase tracking-wider">
                    Onboarding Checklist 2/3
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 mt-3 tracking-tight">
                    Connect your AI Agent &amp; Search Console
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    OMNI SEO is designed to give your AI agent the data it needs to build a great SEO strategy and execute it seamlessly.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🤖</span>
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-900">AI &amp; MCP Integration</h4>
                        <p className="text-xs text-muted-foreground">Connected to primary workspace</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      Active
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-neutral-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🔍</span>
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-900">Google Search Console</h4>
                        <p className="text-xs text-muted-foreground">Import live clicks and impressions</p>
                      </div>
                    </div>
                    <button type="button" className="text-xs font-semibold text-black bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg transition">
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <span className="px-3 py-1 rounded-full bg-[#FFD209]/20 text-black text-xs font-semibold uppercase tracking-wider">
                    Onboarding Checklist 3/3
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 mt-3 tracking-tight">
                    Choose your primary search tools
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    All 5 tools are unlocked in your OMNI SEO studio. Select which ones you want to pin on your main dashboard.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    'AI Search Visibility',
                    'Schema Markup',
                    'Sitemap.xml Generator',
                    'Sitemap.html Generator',
                    'Keyword Density Checker',
                    'SERP Analytics',
                  ].map((tool) => {
                    const isSelected = selectedTools.includes(tool)
                    return (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => toggleTool(tool)}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-[#FFD209] border-black text-black shadow-sm'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-white'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {tool}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as 1 | 2)}
                  className="text-xs font-semibold text-neutral-600 hover:text-black transition"
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleNextStep}
                className="px-8 py-3 rounded-xl bg-black text-white font-semibold text-sm hover:bg-neutral-800 transition shadow-md"
              >
                {step === 3 ? 'Launch OMNI SEO Studio 🚀' : 'Continue →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
