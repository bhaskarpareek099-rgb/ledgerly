'use client'

import { useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import {
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { firebaseAuth, firebaseConfigured } from '@/lib/firebase/client'
import { setLocalUser } from '@/lib/local-store'

export default function RealAuth({ signup = false }) {
  const [authMode, setAuthMode] = useState('password') // 'password' | 'magic'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [magicVerifying, setMagicVerifying] = useState(false)
  const [magicSentEmail, setMagicSentEmail] = useState('')
  const [error, setError] = useState('')

  const friendlyError = (code) =>
    ({
      'auth/invalid-credential': 'That email or password is not correct.',
      'auth/email-already-in-use': 'That email is already registered. Try logging in instead.',
      'auth/weak-password': 'Choose a password with at least 6 characters.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/popup-closed-by-user': 'The Google sign-in window was closed before finishing.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
      'auth/operation-not-allowed':
        'Email link sign-in is not yet enabled. Enable "Email link (passwordless sign-in)" under Authentication > Sign-in method in Firebase Console.',
      'auth/invalid-action-code': 'This magic link has expired or has already been used. Please request a new one.',
      'auth/expired-action-code': 'This magic link has expired. Please request a new one.',
      'auth/unauthorized-continue-uri': 'This domain is not authorized for magic links in Firebase Console.',
    }[code] || 'We could not complete that request. Please try again.')

  // Check if user landed on this page by clicking a Magic Link in their email
  useEffect(() => {
    if (!firebaseAuth || typeof window === 'undefined') return

    if (isSignInWithEmailLink(firebaseAuth, window.location.href)) {
      let storedEmail = window.localStorage.getItem('emailForSignIn')
      if (!storedEmail) {
        storedEmail = window.prompt('Please confirm your email address to complete Magic Link sign-in:')
      }
      if (storedEmail) {
        setMagicVerifying(true)
        setError('')
        signInWithEmailLink(firebaseAuth, storedEmail, window.location.href)
          .then(async (result) => {
            window.localStorage.removeItem('emailForSignIn')
            const pendingBusinessName = window.localStorage.getItem('pendingBusinessName')
            if (pendingBusinessName) {
              await updateProfile(result.user, { displayName: pendingBusinessName }).catch(() => {})
              window.localStorage.removeItem('pendingBusinessName')
            }
            await saveProfile(result.user)
            window.location.href = '/dashboard'
          })
          .catch((err) => {
            setError(friendlyError(err?.code) || 'Could not complete sign in with this link.')
            setMagicVerifying(false)
          })
      }
    }
  }, [])

  async function saveProfile(user) {
    try {
      const token = await user.getIdToken()
      const bName = businessName || window.localStorage.getItem('pendingBusinessName') || 'My business'
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: bName }),
      })
    } catch (e) {
      console.warn('Profile save note:', e?.message)
    }
  }

  // 1. Password-based submission
  async function submitPassword(event) {
    event.preventDefault()
    setError('')
    setMagicSentEmail('')
    const trimmedEmail = String(email || '').trim().toLowerCase()

    if (!firebaseConfigured || !firebaseAuth) {
      setLocalUser({
        displayName: businessName || (trimmedEmail.split('@')[0] || 'Owner'),
        email: trimmedEmail || 'workspace@ledgerly.local',
        isLocal: true,
      })
      window.location.href = '/dashboard'
      return
    }

    setBusy(true)
    try {
      const result = signup
        ? await createUserWithEmailAndPassword(firebaseAuth, trimmedEmail, password)
        : await signInWithEmailAndPassword(firebaseAuth, trimmedEmail, password)
      if (signup && businessName) await updateProfile(result.user, { displayName: businessName })
      if (signup) await saveProfile(result.user)
      window.location.href = '/dashboard'
    } catch (authError) {
      setError(friendlyError(authError?.code))
    } finally {
      setBusy(false)
    }
  }

  // 2. Magic Link submission (Account Creation & Login)
  async function submitMagicLink(event) {
    if (event) event.preventDefault()
    setError('')
    setMagicSentEmail('')
    const trimmedEmail = String(email || '').trim().toLowerCase()

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    if (!firebaseConfigured || !firebaseAuth) {
      setLocalUser({
        displayName: businessName || (trimmedEmail.split('@')[0] || 'Owner'),
        email: trimmedEmail,
        isLocal: true,
      })
      window.location.href = '/dashboard'
      return
    }

    setBusy(true)
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      }
      await sendSignInLinkToEmail(firebaseAuth, trimmedEmail, actionCodeSettings)
      window.localStorage.setItem('emailForSignIn', trimmedEmail)
      if (businessName) {
        window.localStorage.setItem('pendingBusinessName', businessName)
      }
      setMagicSentEmail(trimmedEmail)
    } catch (authError) {
      setError(friendlyError(authError?.code) || authError?.message)
    } finally {
      setBusy(false)
    }
  }

  // 3. Google Sign-In
  async function google() {
    setError('')
    setMagicSentEmail('')
    if (!firebaseConfigured || !firebaseAuth) {
      setLocalUser({ displayName: 'Owner', email: 'workspace@ledgerly.local', isLocal: true })
      window.location.href = '/dashboard'
      return
    }
    setBusy(true)
    try {
      const result = await signInWithPopup(firebaseAuth, new GoogleAuthProvider())
      await saveProfile(result.user)
      window.location.href = '/dashboard'
    } catch (authError) {
      setError(friendlyError(authError?.code))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0F19] px-5 py-10 text-white">
      {/* Glassmorphism ambient background glow orbs */}
      <div className="pointer-events-none fixed -left-40 -top-40 h-[550px] w-[550px] rounded-full bg-emerald-500/20 blur-[130px]" />
      <div className="pointer-events-none fixed -right-40 top-1/4 h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[150px]" />
      <div className="pointer-events-none fixed -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-teal-500/15 blur-[140px]" />

      {/* Main glass card container */}
      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/[0.15] bg-white/[0.05] shadow-[0_16px_50px_rgba(0,0,0,0.55)] backdrop-blur-2xl lg:grid-cols-2">
        {/* Left hero glass branding */}
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 bg-gradient-to-br from-emerald-950/40 via-white/[0.02] to-indigo-950/30 p-12 lg:flex">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-md">
              <TrendingUp size={22} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">ledgerly</span>
          </div>

          <div className="relative z-10 my-auto py-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md">
              <Sparkles size={13} />
              <span>Next-Gen Financial Operating System</span>
            </div>
            <h1 className="mt-5 text-5xl font-bold leading-[1.08] tracking-tight text-white">
              Your numbers, crystal clear.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-300">
              Keep stock, parties, ledger, attendance, and instant AI bill extractions in a modern, streamlined workspace.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
                <p className="text-2xl font-bold text-emerald-400">100%</p>
                <p className="mt-1 text-xs text-slate-400">Cloud & Local Sync</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
                <p className="text-2xl font-bold text-violet-400">Instant</p>
                <p className="mt-1 text-xs text-slate-400">AI Bill Scanning</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Encrypted & Privacy-First Architecture</span>
          </div>
        </div>

        {/* Right authentication form */}
        <div className="p-8 sm:p-12">
          <div className="flex items-center justify-between lg:hidden">
            <a href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/20 text-emerald-300 backdrop-blur-md">
                <TrendingUp size={20} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">ledgerly</span>
            </a>
          </div>

          {magicVerifying ? (
            <div className="my-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-md">
                <LoaderCircle size={28} className="animate-spin" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-white">Verifying Magic Link...</h2>
              <p className="mt-2 text-sm text-slate-400">Logging you securely into your workspace.</p>
            </div>
          ) : magicSentEmail ? (
            /* Magic Link Sent Feedback Screen */
            <div className="mt-4 lg:mt-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-md">
                <Sparkles size={24} />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-emerald-400">
                {signup ? 'Account Link Sent' : 'Login Link Sent'}
              </p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">Check your email</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                We sent a secure <strong>Magic Link</strong> to:
              </p>

              <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-300 backdrop-blur-md">
                {magicSentEmail}
              </div>

              <div className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-relaxed text-slate-400 backdrop-blur-md">
                <p>1. Open the email message from Ledgerly.</p>
                <p>2. Click the <strong>Sign In</strong> link in the email.</p>
                <p>3. Your workspace will automatically activate and open!</p>
              </div>

              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={submitMagicLink}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-xs font-semibold text-white shadow-md backdrop-blur-md transition hover:bg-white/[0.12] active:scale-[0.98] disabled:opacity-50"
                >
                  {busy ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                  <span>Resend Magic Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMagicSentEmail('')
                    setError('')
                  }}
                  className="text-center text-xs text-slate-400 transition hover:text-white hover:underline"
                >
                  Use a different email or switch to password
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-4 lg:mt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {signup ? 'Get Started' : 'Welcome Back'}
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                  {signup ? 'Create your workspace' : 'Log in to your account'}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {signup ? 'Set up your workspace in seconds.' : 'Access your live business dashboard.'}
                </p>
              </div>

              {/* Mode Selection Tabs (Password vs Magic Link) */}
              <div className="mt-6 flex rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('password')
                    setError('')
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all duration-200 ${
                    authMode === 'password'
                      ? 'border border-white/15 bg-white/[0.12] text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound size={14} />
                  <span>Password</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('magic')
                    setError('')
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all duration-200 ${
                    authMode === 'magic'
                      ? 'border border-emerald-400/40 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : 'text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  <Sparkles size={14} className="text-emerald-400" />
                  <span>{signup ? 'Magic Link Signup' : 'Magic Link'}</span>
                </button>
              </div>

              {authMode === 'password' ? (
                /* 1. PASSWORD FORM */
                <form className="mt-6 grid gap-4" onSubmit={submitPassword}>
                  {signup && (
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Business Name
                      <input
                        required
                        value={businessName}
                        onChange={(event) => setBusinessName(event.target.value)}
                        placeholder="e.g. Acme Enterprise"
                        className="min-h-12 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-normal text-white outline-none transition placeholder:text-slate-500 backdrop-blur-md focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20"
                      />
                    </label>
                  )}

                  <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Email Address
                    <input
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      placeholder="you@company.com"
                      className="min-h-12 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-normal text-white outline-none transition placeholder:text-slate-500 backdrop-blur-md focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20"
                    />
                  </label>

                  <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Password
                    <div className="relative">
                      <input
                        required
                        minLength={6}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        className="min-h-12 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 pr-12 text-sm font-normal text-white outline-none transition placeholder:text-slate-500 backdrop-blur-md focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:text-white"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </label>

                  <button
                    disabled={busy}
                    className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-teal-600 px-6 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(16,185,129,0.35)] transition-all duration-200 hover:from-emerald-400 hover:to-teal-500 hover:shadow-[0_8px_30px_rgba(16,185,129,0.5)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      <>
                        <span>{signup ? 'Create Workspace' : 'Sign In'}</span>
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* 2. MAGIC LINK FORM (NO PASSWORD REQUIRED) */
                <form className="mt-6 grid gap-4" onSubmit={submitMagicLink}>
                  {signup && (
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Business Name
                      <input
                        required
                        value={businessName}
                        onChange={(event) => setBusinessName(event.target.value)}
                        placeholder="e.g. Acme Enterprise"
                        className="min-h-12 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-normal text-white outline-none transition placeholder:text-slate-500 backdrop-blur-md focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20"
                      />
                    </label>
                  )}

                  <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Email Address
                    <input
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      placeholder="you@company.com or you@gmail.com"
                      className="min-h-12 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-normal text-white outline-none transition placeholder:text-slate-500 backdrop-blur-md focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20"
                    />
                    <span className="text-[11px] font-normal text-slate-400">
                      {signup
                        ? 'No password needed. We will email you a secure link to create & open your workspace.'
                        : 'No password needed. A secure 1-click sign-in link will be emailed to you.'}
                    </span>
                  </label>

                  <button
                    disabled={busy}
                    className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-teal-600 px-6 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(16,185,129,0.35)] transition-all duration-200 hover:from-emerald-400 hover:to-teal-500 hover:shadow-[0_8px_30px_rgba(16,185,129,0.5)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={17} />
                        <span>{signup ? 'Create Account with Magic Link' : 'Send Magic Link to Email'}</span>
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="my-6 flex items-center gap-3 text-xs text-slate-500">
                <span className="h-px flex-1 bg-white/10" />
                <span>or continue with</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              {/* Google Sign-In */}
              <button
                type="button"
                disabled={busy}
                onClick={google}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-semibold text-white shadow-md backdrop-blur-md transition-all duration-200 hover:border-white/30 hover:bg-white/[0.12] active:scale-[0.98] disabled:opacity-50"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-slate-900">
                  G
                </span>
                <span>Google Account</span>
              </button>

              {error && (
                <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-5 text-rose-300 backdrop-blur-md">
                  <CircleHelp size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <p className="mt-7 text-center text-sm text-slate-400">
                {signup ? 'Already have an account?' : 'New to Ledgerly?'}{' '}
                <a className="font-semibold text-emerald-400 transition hover:text-emerald-300 hover:underline" href={signup ? '/login' : '/signup'}>
                  {signup ? 'Sign In' : 'Create an account'}
                </a>
              </p>

              <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-indigo-500/25 bg-indigo-500/10 p-3 text-xs text-indigo-300 backdrop-blur-md">
                <CircleHelp size={16} className="shrink-0 text-indigo-400" />
                <span>
                  {firebaseConfigured
                    ? 'Cloud Workspace is active with Password, Magic Link & Google options.'
                    : 'Local Workspace is active. All business data is saved in your browser.'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
