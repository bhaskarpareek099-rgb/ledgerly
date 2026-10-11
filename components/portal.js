'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  Bell,
  BookOpen,
  Boxes,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  FileScan,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Package,
  Plus,
  ScanLine,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  FileText,
  Receipt,
  Trash2,
  Edit2,
  Calculator,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  ArrowLeft,
  Key,
  AlertCircle,
} from 'lucide-react'
import { firebaseAuth, firebaseConfigured } from '@/lib/firebase/client'

const navItems = [
  ['/dashboard', 'Dashboard', LayoutDashboard],
  ['/stock', 'Stock', Boxes],
  ['/parties', 'Parties & ledger', BookOpen],
  ['/attendance', 'Attendance', ClipboardCheck],
]

const moduleConfig = {
  '/stock': {
    collection: 'items',
    title: 'Stock',
    description: 'Keep your shelves and cash flow in view.',
    fields: [
      ['name', 'Item name', 'text'],
      ['category', 'Category', 'text'],
      ['quantity', 'Quantity', 'number'],
      ['costPrice', 'Cost price', 'number'],
      ['sellingPrice', 'Selling price', 'number'],
      ['lowStockThreshold', 'Low-stock alert at', 'number'],
    ],
  },
  '/parties': {
    collection: 'parties',
    title: 'Parties & ledger',
    description: 'A simple running balance for every relationship.',
    fields: [
      ['name', 'Party name', 'text'],
      ['phone', 'Phone (optional)', 'text'],
      ['type', 'Type', 'select'],
    ],
  },
  '/attendance': {
    collection: 'employees',
    title: 'Attendance',
    description: 'Add your team, then mark a daily status.',
    fields: [
      ['name', 'Employee name', 'text'],
      ['role', 'Role (optional)', 'text'],
    ],
  },
}

function Logo() {
  return (
    <a href="/" className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-md">
        <TrendingUp size={20} strokeWidth={2.5} />
      </span>
      <span className="text-xl font-bold tracking-tight text-white">ledgerly</span>
    </a>
  )
}

function Button({ children, href, variant = 'primary', onClick, disabled = false, className = '' }) {
  const styles = {
    primary:
      'border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:from-emerald-400 hover:to-teal-500',
    secondary:
      'border border-white/15 bg-white/[0.08] text-white shadow-md hover:bg-white/[0.14] hover:border-white/25',
    violet:
      'border border-violet-400/40 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_4px_20px_rgba(139,92,246,0.35)] hover:from-violet-500 hover:to-indigo-500',
  }
  const classes = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold backdrop-blur-md transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`
  return href ? (
    <a href={href} className={classes}>
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  )
}

export default function Portal({ path }) {
  const [user, setUser] = useState(null)
  const [records, setRecords] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [navOpen, setNavOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({})
  const config = moduleConfig[path]
  const isDashboard = path === '/dashboard'
  const isScan = path === '/scan'
  const pageTitle = config?.title || (isScan ? 'Smart Bill Scan' : path === '/settings' ? 'Settings' : path === '/info' ? 'How Ledgerly works' : 'Dashboard')

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false)
      return undefined
    }
    return onAuthStateChanged(firebaseAuth, async (current) => {
      if (!current) {
        window.location.href = '/login'
        return
      }
      setUser(current)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (user) loadData()
  }, [user, path])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 2800)
      return () => clearTimeout(timer)
    }
  }, [toast])

  async function api(pathname, options = {}) {
    if (!user) throw new Error('Please sign in first.')
    const token = await user.getIdToken()
    const response = await fetch(`/api/${pathname}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers || {}),
      },
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload.error || 'That request could not be completed.')
    return payload
  }

  async function loadData() {
    setLoading(true)
    setError('')
    if (!firebaseConfigured || !user) {
      setLoading(false)
      return
    }
    try {
      if (isDashboard) setDashboard(await api('dashboard'))
      else if (path === '/stock') setRecords(await api('items'))
      else if (path === '/info') setRecords([])
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api(config.collection, { method: 'POST', body: JSON.stringify(form) })
      setForm({})
      setToast('Saved successfully.')
      await loadData()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(recordId) {
    if (!window.confirm('Delete this record? This cannot be undone.')) return
    try {
      await api(`${config.collection}/${recordId}`, { method: 'DELETE' })
      setToast('Record deleted.')
      await loadData()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  async function logout() {
    if (firebaseAuth) await signOut(firebaseAuth)
    window.location.href = '/'
  }

  if (loading)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B0F19]">
        <LoaderCircle className="animate-spin text-emerald-400" size={28} />
      </main>
    )

  const metrics = dashboard?.metrics || { stockValue: 0, lowStock: 0, receivables: 0, payables: 0, attendancePresent: 0, attendanceTotal: 0 }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0B0F19] text-slate-100">
      {/* Background ambient glowing mesh orbs */}
      <div className="pointer-events-none fixed -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-emerald-500/15 blur-[140px]" />
      <div className="pointer-events-none fixed -right-48 top-1/4 h-[650px] w-[650px] rounded-full bg-indigo-600/15 blur-[160px]" />
      <div className="pointer-events-none fixed -bottom-48 left-1/3 h-[550px] w-[550px] rounded-full bg-teal-500/10 blur-[150px]" />

      <div className="relative z-10 flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-white/10 bg-black/40 p-5 backdrop-blur-2xl transition-transform duration-300 lg:static lg:translate-x-0 ${
            navOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between">
            <Logo />
            <button className="rounded-lg p-2 text-slate-400 hover:text-white lg:hidden" onClick={() => setNavOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-teal-500/5 p-4 backdrop-blur-md">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Your workspace</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="font-semibold text-white">{user?.displayName || 'My business'}</p>
              <ChevronDown size={16} className="text-emerald-400" />
            </div>
          </div>
          <nav className="mt-7 grid gap-1.5">
            {navItems.map(([href, label, Icon]) => {
              const active = path === href
              return (
                <a
                  key={href}
                  href={href}
                  onClick={() => setNavOpen(false)}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'border border-white/20 bg-white/[0.12] text-white shadow-lg backdrop-blur-md'
                      : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-emerald-400' : 'text-slate-400'} />
                  {label}
                </a>
              )
            })}
            <a
              href="/scan"
              className={`mt-4 flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-all duration-200 ${
                isScan
                  ? 'border border-violet-500/40 bg-violet-600/25 text-violet-200 shadow-lg backdrop-blur-md'
                  : 'border border-violet-500/20 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20'
              }`}
            >
              <ScanLine size={18} className="text-violet-400" />
              <span>Smart Bill Scan</span>
              <span className="ml-auto rounded-full border border-violet-400/40 bg-violet-500/30 px-2 py-0.5 text-[10px] font-bold text-violet-200">
                AI
              </span>
            </a>
          </nav>
          <div className="absolute bottom-5 left-5 right-5 grid gap-1.5">
            <a
              href="/settings"
              className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Settings size={18} />
              Settings
            </a>
            <button
              onClick={logout}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-left text-sm font-semibold text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
            >
              <LogOut size={18} />
              Log out
            </button>
          </div>
        </aside>
        {navOpen && (
          <button
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between border-b border-white/10 bg-black/20 px-5 backdrop-blur-xl lg:px-10">
            <div className="flex items-center gap-3">
              <button
                aria-label="Open navigation"
                onClick={() => setNavOpen(true)}
                className="rounded-xl border border-white/10 bg-white/[0.06] p-2 text-slate-300 backdrop-blur-md lg:hidden"
              >
                <Menu size={22} />
              </button>
              <div>
                <p className="hidden text-xs font-medium text-emerald-400 sm:block">Ledgerly workspace</p>
                <h1 className="text-xl font-bold tracking-tight text-white">{isDashboard ? `Good morning${user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}` : pageTitle}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setToast('You are all caught up.')}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-slate-300 shadow-sm backdrop-blur-md transition hover:border-white/25 hover:text-white"
              >
                <Bell size={17} />
              </button>
              <div className="hidden h-10 items-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 backdrop-blur-md sm:flex">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/20 text-xs font-bold text-emerald-300">
                  {(user?.displayName || user?.email || 'A').slice(0, 1).toUpperCase()}
                </div>
                <span className="max-w-32 truncate text-sm font-semibold text-slate-200">{user?.displayName || user?.email || 'Account'}</span>
              </div>
            </div>
          </header>
          <div className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10 lg:py-10">
            {!firebaseConfigured && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#DCD0EF] bg-[#F5F1FC] p-4 text-sm text-[#6C4AB6]">
                <CircleHelp size={18} className="mt-0.5 shrink-0" />
                <p>
                  <strong>Firebase is ready for your keys.</strong> Copy `.env.local.example` to `.env.local`, fill in the Firebase values, and restart the app to enable real records and authentication.
                </p>
              </div>
            )}
            {error && <div role="alert" className="mb-6 rounded-2xl bg-[#FFF0EE] p-4 text-sm text-[#B34A3D]">{error}</div>}
            {isDashboard ? (
              <Dashboard metrics={metrics} activity={dashboard?.activity || []} />
            ) : isScan ? (
              <ScanPage api={api} setToast={setToast} setError={setError} />
            ) : path === '/parties' ? (
              <PartiesPage api={api} setToast={setToast} setError={setError} />
            ) : path === '/attendance' ? (
              <AttendancePage api={api} setToast={setToast} setError={setError} />
            ) : path === '/info' ? (
              <InfoPage />
            ) : path === '/settings' ? (
              <SettingsPage user={user} logout={logout} />
            ) : config ? (
              <ModulePage config={config} records={records} form={form} setForm={setForm} submit={submit} remove={remove} busy={busy} />
            ) : (
              <EmptyPage title={pageTitle} />
            )}
          </div>
        </section>
      </div>
      {toast && (
        <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-white/20 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur-xl">
          <Check size={17} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </main>
  )
}

function Dashboard({ metrics, activity }) {
  const cards = [
    ['Total receivables', `₹${Number(metrics.receivables).toLocaleString('en-IN')}`, 'Amounts owed to you', 'text-emerald-400'],
    ['Total payables', `₹${Number(metrics.payables).toLocaleString('en-IN')}`, 'Amounts to vendors', 'text-violet-400'],
    ['Stock inventory value', `₹${Number(metrics.stockValue).toLocaleString('en-IN')}`, `${metrics.lowStock} low-stock items`, 'text-amber-400'],
    ["Today's attendance", `${metrics.attendancePresent} / ${metrics.attendanceTotal}`, 'Team members present', 'text-teal-400'],
  ]
  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Live Business Analytics</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">Business overview</h2>
        </div>
        <Button href="/scan" variant="violet">
          <ScanLine size={16} /> Scan Bill with AI
        </Button>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, hint, color]) => (
          <div key={label} className="group relative overflow-hidden rounded-3xl border border-white/[0.12] bg-white/[0.05] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl transition hover:border-white/25 hover:bg-white/[0.08]">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-4 text-3xl font-bold tracking-tight text-white">{value}</p>
            <p className={`mt-2 text-xs font-medium ${color}`}>{hint}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-white/[0.12] bg-white/[0.05] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl">
          <h3 className="font-bold text-white">Ledger activity</h3>
          <p className="mt-1 text-xs text-slate-400">Entries added over the last 7 days</p>
          <div className="mt-8 flex h-48 items-end gap-2">
            {(activity.length ? activity : Array.from({ length: 7 }, (_, index) => ({ date: index, count: 0 }))).map((item, index) => (
              <div key={item.date || index} className="group relative flex-1 rounded-t-lg bg-gradient-to-t from-emerald-600/50 to-teal-400/80 transition hover:from-emerald-400 hover:to-teal-300" style={{ height: `${Math.max(5, Math.min(100, item.count * 20 + 5))}%` }}>
                <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 text-[10px] font-bold group-hover:block text-white">{item.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-xs text-slate-400">
            <span>6 days ago</span>
            <span>Today</span>
          </div>
        </div>
        <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-950/25 via-white/[0.04] to-indigo-950/20 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl">
          <div className="flex items-center gap-2 text-violet-400">
            <Sparkles size={17} />
            <h3 className="font-bold text-white">Quick actions</h3>
          </div>
          <p className="mt-2 text-xs text-slate-300">Keep your daily updates moving.</p>
          <div className="mt-6 grid gap-2.5">
            <Button href="/parties" variant="secondary" className="justify-start">
              <Plus size={16} className="text-emerald-400" /> Add ledger entry
            </Button>
            <Button href="/stock" variant="secondary" className="justify-start">
              <Package size={16} className="text-violet-400" /> Add stock movement
            </Button>
            <Button href="/attendance" variant="secondary" className="justify-start">
              <ClipboardCheck size={16} className="text-teal-400" /> Mark attendance
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-6 rounded-3xl border border-white/[0.12] bg-white/[0.05] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <CircleHelp size={17} className="text-emerald-400" />
          <h3 className="font-bold text-white">Actionable Insights</h3>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <a href="/stock" className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 backdrop-blur-md transition hover:border-amber-500/40 hover:bg-amber-500/15">
            <Package size={19} className="text-amber-400" />
            <div>
              <p className="text-sm font-bold text-amber-300">{metrics.lowStock} low-stock alert</p>
              <p className="mt-1 text-xs text-slate-400">Review stock levels →</p>
            </div>
          </a>
          <a href="/parties" className="flex items-center gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 backdrop-blur-md transition hover:border-violet-500/40 hover:bg-violet-500/15">
            <Users size={19} className="text-violet-400" />
            <div>
              <p className="text-sm font-bold text-violet-300">Check party receivables</p>
              <p className="mt-1 text-xs text-slate-400">Open party ledger →</p>
            </div>
          </a>
          <a href="/attendance" className="flex items-center gap-3 rounded-2xl border border-teal-500/20 bg-teal-500/10 p-4 backdrop-blur-md transition hover:border-teal-500/40 hover:bg-teal-500/15">
            <ClipboardCheck size={19} className="text-teal-400" />
            <div>
              <p className="text-sm font-bold text-teal-300">Mark today&apos;s attendance</p>
              <p className="mt-1 text-xs text-slate-400">Keep team record current →</p>
            </div>
          </a>
        </div>
      </div>
    </>
  )
}

function ModulePage({ config, records, form, setForm, submit, remove, busy }) {
  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Module Overview</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">{records.length} Records Tracked</h2>
        </div>
        <form onSubmit={submit} className="flex flex-wrap items-end gap-2 rounded-2xl border border-white/15 bg-white/[0.06] p-3 backdrop-blur-xl">
          {config.fields.map(([name, label, type]) =>
            type === 'select' ? (
              <label key={name} className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                <span>{label}</span>
                <select value={form[name] || 'customer'} onChange={(event) => setForm({ ...form, [name]: event.target.value })} className="min-h-10 rounded-xl border border-white/15 bg-white/[0.06] px-2.5 text-sm text-white backdrop-blur-md outline-none">
                  <option value="customer" className="bg-[#111827] text-white">Customer</option>
                  <option value="vendor" className="bg-[#111827] text-white">Vendor</option>
                </select>
              </label>
            ) : (
              <label key={name} className="grid min-w-28 gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                <span>{label}</span>
                <input
                  required={name === 'name'}
                  type={type}
                  value={form[name] || ''}
                  onChange={(event) => setForm({ ...form, [name]: event.target.value })}
                  className="min-h-10 rounded-xl border border-white/15 bg-white/[0.06] px-2.5 text-sm text-white backdrop-blur-md outline-none placeholder:text-slate-500"
                />
              </label>
            )
          )}
          <button disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 text-xs font-bold text-white shadow-md">
            {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Plus size={14} />} Add
          </button>
        </form>
      </div>
      <div className="mt-8 grid gap-3">
        {records.length ? (
          records.map((record) => (
            <div key={record.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-white/[0.12] bg-white/[0.05] p-5 shadow-sm backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.08] sm:flex-row sm:items-center">
              <div>
                <p className="font-bold text-white">{record.name || record.description || 'Untitled record'}</p>
                <p className="mt-1 text-xs text-slate-400">{record.category || record.role || record.phone || (record.type ? `${record.type} · balance ₹${Number(record.balance || 0).toLocaleString('en-IN')}` : 'Ledgerly record')}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-emerald-400">{record.quantity !== undefined ? `${record.quantity} units` : record.balance !== undefined ? `₹${Number(record.balance || 0).toLocaleString('en-IN')}` : ''}</span>
                <button onClick={() => remove(record.id)} className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20">
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-[#CFC8BA] bg-[#FFFDF8] p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F0E8] text-[#2F5D45]">
              <Boxes size={25} />
            </div>
            <h3 className="mt-5 text-xl font-semibold">Your first record starts here.</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#899389]">Use the quick form above to add a real record to your Firebase workspace.</p>
          </div>
        )}
      </div>
    </>
  )
}

function PartiesPage({ api, setToast, setError }) {
  const [parties, setParties] = useState([])
  const [ledgerEntries, setLedgerEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [partyForm, setPartyForm] = useState({ name: '', phone: '', type: 'purchase' })
  const [selectedPartyId, setSelectedPartyId] = useState(null)
  const [editingBillId, setEditingBillId] = useState(null)
  const today = () => new Date().toISOString().slice(0, 10)

  const [bill, setBill] = useState({
    partyId: '',
    type: 'debit',
    date: today(),
    billNo: '',
    baseAmount: '',
    advPayment: '',
    taxAmount: '',
    other: '',
    otherType: 'debit', // 'debit' (- deduct) | 'credit' (+ add)
    finalPayable: '',
    note: '',
  })

  async function loadPartiesData() {
    setLoading(true)
    setError('')
    try {
      const [partiesData, ledgerData] = await Promise.all([api('parties'), api('ledgerEntries')])
      const partyList = Array.isArray(partiesData) ? partiesData : []
      setParties(partyList)
      setLedgerEntries(Array.isArray(ledgerData) ? ledgerData : [])
      if (partyList.length && !bill.partyId) {
        setBill((prev) => ({ ...prev, partyId: partyList[0].id }))
      }
    } catch (err) {
      setError(err?.message || 'Could not load parties & ledger data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPartiesData()
  }, [])

  function formatPartyType(type) {
    if (type === 'seller' || type === 'sell' || type === 'vendor') return 'Sell'
    if (type === 'purchase' || type === 'customer') return 'Purchase'
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Purchase'
  }

  function handleBillChange(field, val) {
    const next = { ...bill, [field]: val }
    if (['baseAmount', 'advPayment', 'taxAmount', 'other', 'otherType'].includes(field)) {
      const base = parseFloat(field === 'baseAmount' ? val : next.baseAmount) || 0
      const tax = parseFloat(field === 'taxAmount' ? val : next.taxAmount) || 0
      const oth = parseFloat(field === 'other' ? val : next.other) || 0
      const adv = parseFloat(field === 'advPayment' ? val : next.advPayment) || 0
      const othType = field === 'otherType' ? val : next.otherType
      const otherEffect = othType === 'debit' ? -oth : oth
      const calc = Math.max(0, base + tax + otherEffect - adv)
      next.finalPayable = (base > 0 || tax > 0 || oth > 0 || adv > 0) ? String(calc) : ''
    }
    setBill(next)
  }

  async function handleAddParty(e) {
    e.preventDefault()
    if (!partyForm.name.trim()) return
    setBusy(true)
    setError('')
    try {
      const selectedType = partyForm.type === 'seller' || partyForm.type === 'sell' ? 'seller' : 'purchase'
      const payload = {
        name: partyForm.name.trim(),
        phone: partyForm.phone.trim(),
        type: selectedType,
      }
      const created = await api('parties', { method: 'POST', body: JSON.stringify(payload) })
      setParties((prev) => [...prev, created])
      if (!bill.partyId) setBill((prev) => ({ ...prev, partyId: created.id }))
      setPartyForm({ name: '', phone: '', type: 'purchase' })
      setToast(`Party "${created.name}" created (${formatPartyType(created.type)}).`)
    } catch (err) {
      setError(err?.message || 'Failed to add party.')
    } finally {
      setBusy(false)
    }
  }

  function handleStartEditBill(entry) {
    setEditingBillId(entry.id)
    setBill({
      partyId: entry.partyId || '',
      type: entry.type || 'debit',
      date: entry.date || today(),
      billNo: entry.billNo || '',
      baseAmount: entry.baseAmount !== undefined ? String(entry.baseAmount) : (entry.totalAmount ? String(entry.totalAmount) : String(entry.amount || '')),
      advPayment: entry.advPayment ? String(entry.advPayment) : '',
      taxAmount: entry.taxAmount ? String(entry.taxAmount) : '',
      other: entry.other ? String(entry.other) : '',
      otherType: entry.otherType || 'debit',
      finalPayable: entry.finalPayable ? String(entry.finalPayable) : String(entry.amount || ''),
      note: entry.note || '',
    })
    const formElem = document.getElementById('billing-form')
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 300, behavior: 'smooth' })
    }
  }

  function handleCancelEdit() {
    setEditingBillId(null)
    setBill({
      partyId: parties[0]?.id || '',
      type: 'debit',
      date: today(),
      billNo: '',
      baseAmount: '',
      advPayment: '',
      taxAmount: '',
      other: '',
      otherType: 'debit',
      finalPayable: '',
      note: '',
    })
  }

  async function handleSetPartyType(p, newType) {
    if (p.type === newType) return
    try {
      await api(`parties/${p.id}`, { method: 'PUT', body: JSON.stringify({ ...p, type: newType }) })
      setParties((prev) => prev.map((item) => (item.id === p.id ? { ...item, type: newType } : item)))
      setToast(`Party "${p.name}" changed to ${formatPartyType(newType)} mode.`)
    } catch (err) {
      setError(err?.message || 'Could not update party mode.')
    }
  }

  async function handlePostBill(e) {
    e.preventDefault()
    if (!bill.partyId) return setError('Please select a party first.')
    const baseVal = parseFloat(bill.baseAmount) || 0
    const payable = parseFloat(bill.finalPayable) || baseVal || 0
    if (payable <= 0) return setError('Please enter a base amount or final payable amount.')
    setBusy(true)
    setError('')
    try {
      const partyObj = parties.find((p) => p.id === bill.partyId)
      const payload = {
        ...bill,
        partyName: partyObj?.name || '',
        amount: payable,
        finalPayable: payable,
        baseAmount: baseVal,
        totalAmount: baseVal,
        advPayment: parseFloat(bill.advPayment) || 0,
        taxAmount: parseFloat(bill.taxAmount) || 0,
        other: parseFloat(bill.other) || 0,
        otherType: bill.otherType || 'debit',
      }
      if (editingBillId) {
        const updated = await api(`ledgerEntries/${editingBillId}`, { method: 'PUT', body: JSON.stringify(payload) })
        setLedgerEntries((prev) => prev.map((item) => (item.id === editingBillId ? updated : item)))
        const freshParties = await api('parties')
        if (Array.isArray(freshParties)) setParties(freshParties)
        setToast(`Bill #${bill.billNo || 'Record'} updated successfully!`)
        setEditingBillId(null)
      } else {
        const created = await api('ledgerEntries', { method: 'POST', body: JSON.stringify(payload) })
        setLedgerEntries((prev) => [created, ...prev])
        setParties((prev) =>
          prev.map((p) =>
            p.id === bill.partyId ? { ...p, balance: Number(p.balance || 0) + (bill.type === 'debit' ? payable : -payable) } : p
          )
        )
        setToast(`Bill #${bill.billNo || 'Entry'} posted! Final Payable: ₹${payable.toLocaleString('en-IN')}`)
      }
      setBill({
        partyId: parties[0]?.id || '',
        type: 'debit',
        date: today(),
        billNo: '',
        baseAmount: '',
        advPayment: '',
        taxAmount: '',
        other: '',
        otherType: 'debit',
        finalPayable: '',
        note: '',
      })
    } catch (err) {
      setError(err?.message || (editingBillId ? 'Failed to update bill.' : 'Failed to post bill.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteParty(partyId) {
    if (!window.confirm('Delete this party? This cannot be undone.')) return
    try {
      await api(`parties/${partyId}`, { method: 'DELETE' })
      setParties((prev) => prev.filter((p) => p.id !== partyId))
      if (selectedPartyId === partyId) setSelectedPartyId(null)
      setToast('Party deleted.')
    } catch (err) {
      setError(err?.message || 'Could not delete party.')
    }
  }

  async function handleDeleteEntry(entryId) {
    if (!window.confirm('Delete this ledger transaction? This cannot be undone.')) return
    try {
      await api(`ledgerEntries/${entryId}`, { method: 'DELETE' })
      setLedgerEntries((prev) => prev.filter((entry) => entry.id !== entryId))
      const freshParties = await api('parties')
      setParties(Array.isArray(freshParties) ? freshParties : [])
      setToast('Ledger entry deleted.')
    } catch (err) {
      setError(err?.message || 'Could not delete ledger entry.')
    }
  }

  const receivables = parties.filter((p) => p.balance > 0).reduce((sum, p) => sum + Number(p.balance || 0), 0)
  const payables = Math.abs(parties.filter((p) => p.balance < 0).reduce((sum, p) => sum + Number(p.balance || 0), 0))

  const selectedParty = parties.find((p) => p.id === selectedPartyId) || null
  const selectedPartyBills = ledgerEntries
    .filter((e) => e.partyId === selectedPartyId)
    .slice()
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const selectedPartyTotalDebit = selectedPartyBills
    .filter((e) => e.type === 'debit')
    .reduce((sum, e) => sum + Number(e.finalPayable || e.amount || 0), 0)

  const selectedPartyTotalCredit = selectedPartyBills
    .filter((e) => e.type === 'credit')
    .reduce((sum, e) => sum + Number(e.finalPayable || e.amount || 0), 0)

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Financial Ledger & Billing</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">Parties, Bills & Ledger</h2>
          <p className="mt-1 text-xs text-slate-400">
            Manage Seller & Purchase accounts, record bills with Base Amount & Debit/Credit adjustments, and click any party to view date-wise details.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-white/[0.12] bg-white/[0.05] p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Receivables</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">₹{receivables.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-xs text-emerald-300/80">Amounts owed to you</p>
        </div>
        <div className="rounded-3xl border border-white/[0.12] bg-white/[0.05] p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Payables</p>
          <p className="mt-2 text-3xl font-bold text-violet-400">₹{payables.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-xs text-violet-300/80">Amounts you owe to sellers</p>
        </div>
        <div className="rounded-3xl border border-white/[0.12] bg-white/[0.05] p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Parties</p>
          <p className="mt-2 text-3xl font-bold text-teal-300">{parties.length}</p>
          <p className="mt-1 text-xs text-slate-400">Sellers & Purchases</p>
        </div>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        {/* Form 1: Add Party (Seller or Purchase) */}
        <form onSubmit={handleAddParty} className="grid gap-3.5 rounded-3xl border border-white/[0.12] bg-white/[0.05] p-6 shadow-sm backdrop-blur-xl">
          <h3 className="font-bold text-white">Add New Party (Seller / Purchase)</h3>
          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <span>Party / Business Name</span>
            <input
              required
              value={partyForm.name}
              onChange={(e) => setPartyForm({ ...partyForm, name: e.target.value })}
              placeholder="e.g. Balaji Textiles"
              className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-md"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <span>Phone Number</span>
              <input
                value={partyForm.phone}
                onChange={(e) => setPartyForm({ ...partyForm, phone: e.target.value })}
                placeholder="Optional (e.g. 9876543210)"
                className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-md"
              />
            </label>
            <div className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <span>Party Type</span>
              <div className="grid min-h-11 grid-cols-2 gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] p-1 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setPartyForm({ ...partyForm, type: 'purchase' })}
                  className={`flex items-center justify-center rounded-lg text-xs font-bold transition ${
                    (partyForm.type || 'purchase') === 'purchase'
                      ? 'border border-teal-500/50 bg-teal-500/30 text-teal-200 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Purchase
                </button>
                <button
                  type="button"
                  onClick={() => setPartyForm({ ...partyForm, type: 'seller' })}
                  className={`flex items-center justify-center rounded-lg text-xs font-bold transition ${
                    partyForm.type === 'seller' || partyForm.type === 'sell'
                      ? 'border border-amber-500/50 bg-amber-500/30 text-amber-200 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sell
                </button>
              </div>
            </div>
          </div>
          <button
            disabled={busy}
            className="mt-2 min-h-11 rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50"
          >
            Create Party Account
          </button>
        </form>

        {/* Form 2: Complete Bill & Ledger Transaction Form with Base Amount and Other Credit/Debit */}
        <form
          id="billing-form"
          onSubmit={handlePostBill}
          className={`grid gap-3.5 rounded-3xl border ${editingBillId ? 'border-amber-400/50 bg-gradient-to-br from-amber-950/25 via-white/[0.04] to-indigo-950/20' : 'border-violet-500/30 bg-gradient-to-br from-violet-950/25 via-white/[0.04] to-indigo-950/20'} p-6 shadow-sm backdrop-blur-xl transition`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-violet-300">
                {editingBillId ? `Modify Bill #${bill.billNo || 'Record'}` : 'Add Bill & Ledger Transaction'}
              </h3>
              {editingBillId && (
                <span className="rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                  Editing
                </span>
              )}
            </div>
            {editingBillId ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300 transition hover:bg-white/20 hover:text-white"
              >
                Cancel Edit
              </button>
            ) : (
              <span className="rounded-full border border-violet-400/30 bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-bold text-violet-200">
                Complete Billing
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <span>Select Party</span>
              <select
                required
                value={bill.partyId}
                onChange={(e) => handleBillChange('partyId', e.target.value)}
                className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none backdrop-blur-md"
              >
                {parties.length === 0 && <option value="">No parties yet</option>}
                {parties.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#111827] text-white">
                    {p.name} ({formatPartyType(p.type)})
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <span>Transaction Type</span>
              <select
                value={bill.type}
                onChange={(e) => handleBillChange('type', e.target.value)}
                className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none backdrop-blur-md"
              >
                <option value="debit" className="bg-[#111827] text-white">Debit</option>
                <option value="credit" className="bg-[#111827] text-white">Credit</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <span>Date</span>
              <input
                required
                type="date"
                value={bill.date}
                onChange={(e) => handleBillChange('date', e.target.value)}
                className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none backdrop-blur-md"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <span>Bill No</span>
              <input
                value={bill.billNo}
                onChange={(e) => handleBillChange('billNo', e.target.value)}
                placeholder="e.g. INV-1002"
                className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-md"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <span>Base Amount (₹)</span>
              <input
                required
                type="number"
                step="any"
                value={bill.baseAmount}
                onChange={(e) => handleBillChange('baseAmount', e.target.value)}
                placeholder="0"
                className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-md"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <span>Tax Amount (₹)</span>
              <input
                type="number"
                step="any"
                value={bill.taxAmount}
                onChange={(e) => handleBillChange('taxAmount', e.target.value)}
                placeholder="GST / Tax (0)"
                className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-md"
              />
            </label>
          </div>

          {/* Adv Payment & Other (Debit/Credit) Adjustment */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <span>Adv Payment (₹)</span>
              <input
                type="number"
                step="any"
                value={bill.advPayment}
                onChange={(e) => handleBillChange('advPayment', e.target.value)}
                placeholder="Advance paid (0)"
                className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-md"
              />
            </label>

            <div className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <div className="flex items-center justify-between">
                <span>Other (₹)</span>
                <span className="text-[11px] font-normal lowercase tracking-normal text-slate-400">
                  {bill.otherType === 'debit' ? 'deducted (-)' : 'added (+)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  value={bill.other}
                  onChange={(e) => handleBillChange('other', e.target.value)}
                  placeholder="Other (0)"
                  className="min-h-11 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-md"
                />
                <select
                  value={bill.otherType}
                  onChange={(e) => handleBillChange('otherType', e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 text-sm text-white outline-none backdrop-blur-md"
                >
                  <option value="debit" className="bg-[#111827] text-white">- Debit</option>
                  <option value="credit" className="bg-[#111827] text-white">+ Credit</option>
                </select>
              </div>
            </div>
          </div>

          {/* Final Payable Amount (Auto Calculated!) */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Final Payable Amount (₹)</span>
              <span className="text-[10px] text-emerald-300/80">
                Formula: Base + Tax {bill.otherType === 'credit' ? '+ Other' : '- Other'} - Adv
              </span>
            </div>
            <input
              required
              type="number"
              step="any"
              value={bill.finalPayable}
              onChange={(e) => setBill({ ...bill, finalPayable: e.target.value })}
              placeholder="0"
              className="mt-2 min-h-11 w-full rounded-xl border border-emerald-400/40 bg-black/40 px-3.5 text-base font-bold text-emerald-300 outline-none backdrop-blur-md"
            />
          </div>

          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <span>Note / Remarks</span>
            <input
              value={bill.note}
              onChange={(e) => handleBillChange('note', e.target.value)}
              placeholder="Optional remarks (e.g. Delivered via truck, 30 days credit...)"
              className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-md"
            />
          </label>

          <button
            disabled={busy || parties.length === 0}
            className="mt-2 min-h-11 rounded-xl border border-violet-400/40 bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
          >
            {busy ? 'Processing...' : editingBillId ? 'Save Changes (Update Bill)' : 'Post Bill & Ledger Entry'}
          </button>
        </form>
      </div>

      {/* Dedicated Clicked Party Date-Wise Detail View */}
      {selectedParty && (
        <div className="mt-12 rounded-3xl border border-emerald-400/40 bg-emerald-950/20 p-6 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedPartyId(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                title="Back to all parties"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-2xl font-bold text-white">{selectedParty.name}</h3>
                  <div className="inline-flex items-center rounded-xl border border-white/15 bg-white/[0.05] p-1">
                    <button
                      type="button"
                      onClick={() => handleSetPartyType(selectedParty, 'purchase')}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                        (selectedParty.type || 'purchase').toLowerCase() === 'purchase'
                          ? 'border border-teal-500/50 bg-teal-500/25 text-teal-300 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Purchase
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPartyType(selectedParty, 'seller')}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                        (selectedParty.type || '').toLowerCase() === 'seller' || (selectedParty.type || '').toLowerCase() === 'sell' || (selectedParty.type || '').toLowerCase() === 'vendor'
                          ? 'border border-amber-500/50 bg-amber-500/25 text-amber-300 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Sell
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-300">
                  {selectedParty.phone ? `Phone: ${selectedParty.phone} · ` : ''}Date-wise statement & bill breakdown
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-2xl border px-4 py-2 text-sm font-bold backdrop-blur-md ${
                  selectedParty.balance >= 0
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : 'border-violet-500/40 bg-violet-500/20 text-violet-300'
                }`}
              >
                {selectedParty.balance >= 0 ? 'They owe you ' : 'You owe '}₹{Math.abs(selectedParty.balance || 0).toLocaleString('en-IN')}
              </span>
              <button
                type="button"
                onClick={() => {
                  setBill((prev) => ({ ...prev, partyId: selectedParty.id }))
                  window.scrollTo({ top: 350, behavior: 'smooth' })
                }}
                className="rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow"
              >
                + Add Bill for {selectedParty.name}
              </button>
            </div>
          </div>

          {/* Party Specific Metrics */}
          <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Bills / Entries</p>
              <p className="mt-1 text-2xl font-bold text-white">{selectedPartyBills.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Invoiced (Debit)</p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">₹{selectedPartyTotalDebit.toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Settled (Credit)</p>
              <p className="mt-1 text-2xl font-bold text-violet-400">₹{selectedPartyTotalCredit.toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] uppercase font-bold text-slate-400">Current Balance</p>
              <p className={`mt-1 text-2xl font-bold ${selectedParty.balance >= 0 ? 'text-emerald-300' : 'text-violet-300'}`}>
                ₹{Math.abs(selectedParty.balance || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Date-wise Bills for this party */}
          <div className="mt-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Date-wise Bills & Detail List ({selectedPartyBills.length})
            </h4>
            <div className="mt-3 grid gap-3">
              {selectedPartyBills.length > 0 ? (
                selectedPartyBills.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-white/15 bg-black/40 p-4 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-300">
                          <Calendar size={13} /> {entry.date}
                        </span>
                        {entry.billNo && (
                          <span className="rounded-md border border-white/15 bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                            #{entry.billNo}
                          </span>
                        )}
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                            entry.type === 'debit'
                              ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                              : 'border border-violet-500/30 bg-violet-500/20 text-violet-300'
                          }`}
                        >
                          {entry.type === 'debit' ? 'Debit' : 'Credit'}
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                        <span>Base: ₹{Number(entry.baseAmount || entry.totalAmount || entry.amount || 0).toLocaleString('en-IN')}</span>
                        {Number(entry.taxAmount || 0) > 0 && <span>+ Tax: ₹{Number(entry.taxAmount).toLocaleString('en-IN')}</span>}
                        {Number(entry.other || 0) > 0 && (
                          <span className={entry.otherType === 'credit' ? 'text-amber-300' : 'text-slate-300'}>
                            {entry.otherType === 'credit' ? '+ Other' : '- Other'}: ₹{Number(entry.other).toLocaleString('en-IN')}
                          </span>
                        )}
                        {Number(entry.advPayment || 0) > 0 && <span>- Adv: ₹{Number(entry.advPayment).toLocaleString('en-IN')}</span>}
                        {entry.note && <span className="italic text-slate-400">· &quot;{entry.note}&quot;</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Final Payable</p>
                        <p className="text-lg font-bold text-emerald-400">
                          ₹{Number(entry.finalPayable || entry.amount || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPartyId(null)
                          handleStartEditBill(entry)
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/20 px-3 py-1.5 text-xs font-bold text-violet-200 transition hover:bg-violet-500/30"
                        title="Modify bill"
                      >
                        <Edit2 size={13} />
                        <span>Modify</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-200 transition hover:bg-rose-500/30"
                        title="Delete bill"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-xs text-slate-400">
                  No bills or payments logged for this party yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Directory of Parties with clickable date-wise detail */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Party Directory</h3>
            <p className="mt-1 text-xs text-slate-400">
              Click on any party below to see their full date-wise bills & transactions.
            </p>
          </div>
          {selectedPartyId && (
            <button
              type="button"
              onClick={() => setSelectedPartyId(null)}
              className="text-xs font-semibold text-emerald-400 hover:underline"
            >
              Clear selection
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {parties.map((p) => {
            const isSelected = selectedPartyId === p.id
            const billCount = ledgerEntries.filter((e) => e.partyId === p.id).length
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPartyId(p.id)}
                className={`cursor-pointer rounded-2xl border p-5 shadow-sm backdrop-blur-xl transition hover:scale-[1.01] hover:border-emerald-400/50 ${
                  isSelected
                    ? 'border-emerald-400 bg-emerald-500/15 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : 'border-white/[0.12] bg-white/[0.05] hover:bg-white/[0.08]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-white text-base">{p.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center rounded-lg border border-white/15 bg-white/[0.04] p-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSetPartyType(p, 'purchase')
                          }}
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition ${
                            (p.type || 'purchase').toLowerCase() === 'purchase'
                              ? 'border border-teal-500/40 bg-teal-500/30 text-teal-200 shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Purchase
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSetPartyType(p, 'seller')
                          }}
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition ${
                            (p.type || '').toLowerCase() === 'seller' || (p.type || '').toLowerCase() === 'sell' || (p.type || '').toLowerCase() === 'vendor'
                              ? 'border border-amber-500/40 bg-amber-500/30 text-amber-200 shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Sell
                        </button>
                      </div>
                      {p.phone && <span className="text-xs text-slate-400">· {p.phone}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteParty(p.id)
                    }}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/20"
                    title="Delete party"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <div>
                    <p className="text-[10px] uppercase text-slate-400">{billCount} recorded bills</p>
                    <p className={`text-sm font-bold ${p.balance >= 0 ? 'text-emerald-400' : 'text-violet-400'}`}>
                      {p.balance >= 0 ? 'They owe you ' : 'You owe '}₹{Math.abs(p.balance || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300 transition hover:bg-emerald-500/20">
                    View Bills →
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Bills and Ledger Entries List */}
      <div className="mt-10">
        <h3 className="text-lg font-bold text-white">Recent Bills & Ledger History</h3>
        <p className="mt-1 text-xs text-slate-400">All posted invoices, bills, and payments (click Modify to edit any bill).</p>
        <div className="mt-4 grid gap-3">
          {ledgerEntries.length > 0 ? (
            ledgerEntries.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-white/[0.12] bg-white/[0.05] p-5 shadow-sm backdrop-blur-xl transition hover:border-white/20 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    {item.billNo && (
                      <span className="rounded-lg border border-violet-400/30 bg-violet-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-violet-200">
                        #{item.billNo}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{item.date}</span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        item.type === 'debit'
                          ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                          : 'border border-violet-500/30 bg-violet-500/15 text-violet-300'
                      }`}
                    >
                      {item.type === 'debit' ? 'Debit' : 'Credit'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-base font-bold text-white">{item.partyName || 'Party Record'}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Base: ₹{Number(item.baseAmount || item.totalAmount || item.amount || 0).toLocaleString('en-IN')}
                    {Number(item.taxAmount || 0) > 0 ? ` · Tax: ₹${Number(item.taxAmount).toLocaleString('en-IN')}` : ''}
                    {Number(item.other || 0) > 0 ? ` · Other (${item.otherType === 'credit' ? '+' : '-'}₹${Number(item.other).toLocaleString('en-IN')})` : ''}
                    {Number(item.advPayment || 0) > 0 ? ` · Adv: ₹${Number(item.advPayment).toLocaleString('en-IN')}` : ''}
                    {item.note ? ` · Note: "${item.note}"` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Final Payable</p>
                    <p className="text-lg font-bold text-emerald-400">
                      ₹{Number(item.finalPayable || item.amount || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartEditBill(item)}
                    className="flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/20 px-3.5 py-1.5 text-xs font-bold text-violet-200 transition hover:bg-violet-500/30"
                    title="Modify bill"
                  >
                    <Edit2 size={13} />
                    Modify
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEntry(item.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/20 px-3.5 py-1.5 text-xs font-bold text-rose-200 transition hover:bg-rose-500/30"
                    title="Delete bill"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.04] p-10 text-center backdrop-blur-xl">
              <Receipt size={28} className="mx-auto text-violet-400" />
              <h4 className="mt-4 text-base font-bold text-white">No ledger entries posted yet.</h4>
              <p className="mt-1 text-xs text-slate-400">Post your first bill using the form above.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function AttendancePage({ api, setToast, setError }) {
  const [employees, setEmployees] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [newEmployee, setNewEmployee] = useState({ name: '', role: '' })
  const todayDate = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(todayDate)
  const [wageInputs, setWageInputs] = useState({})
  const [historyFilter, setHistoryFilter] = useState('selected') // 'selected' | 'all'

  async function loadAttendanceData() {
    setLoading(true)
    setError('')
    try {
      const [empData, recData] = await Promise.all([api('employees'), api('attendanceRecords')])
      setEmployees(Array.isArray(empData) ? empData : [])
      setRecords(Array.isArray(recData) ? recData : [])
    } catch (err) {
      setError(err?.message || 'Could not load attendance data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAttendanceData()
  }, [])

  function shiftDate(days) {
    const cur = new Date(selectedDate)
    cur.setDate(cur.getDate() + days)
    setSelectedDate(cur.toISOString().slice(0, 10))
  }

  async function handleAddEmployee(e) {
    e.preventDefault()
    if (!newEmployee.name.trim()) return
    setBusy(true)
    try {
      const added = await api('employees', {
        method: 'POST',
        body: JSON.stringify(newEmployee),
      })
      setEmployees((prev) => [...prev, added])
      setNewEmployee({ name: '', role: '' })
      setToast(`Team member "${added.name}" added.`)
    } catch (err) {
      setError(err?.message || 'Failed to add team member.')
    } finally {
      setBusy(false)
    }
  }

  async function handleMarkAttendance(employeeId, status) {
    try {
      const currentRec = records.find((r) => r.employeeId === employeeId && r.date === selectedDate)
      const currentWage = wageInputs[employeeId] !== undefined ? Number(wageInputs[employeeId]) : Number(currentRec?.amountPaid || 0)

      const saved = await api('attendanceRecords', {
        method: 'POST',
        body: JSON.stringify({
          employeeId,
          status,
          date: selectedDate,
          amountPaid: currentWage,
        }),
      })

      setRecords((prev) => {
        const withoutCurrent = prev.filter((r) => !(r.employeeId === employeeId && r.date === selectedDate))
        return [...withoutCurrent, saved]
      })

      const emp = employees.find((e) => e.id === employeeId)
      setToast(`${emp?.name || 'Staff'} marked as ${status} for ${selectedDate}.`)
    } catch (err) {
      setError(err?.message || 'Failed to update attendance.')
    }
  }

  async function handleSaveWage(employeeId, manualAmount = null) {
    try {
      const currentRec = records.find((r) => r.employeeId === employeeId && r.date === selectedDate)
      const amt = manualAmount !== null ? Number(manualAmount) : Number(wageInputs[employeeId] !== undefined ? wageInputs[employeeId] : currentRec?.amountPaid || 0)

      const saved = await api('attendanceRecords', {
        method: 'POST',
        body: JSON.stringify({
          employeeId,
          status: currentRec?.status || 'present',
          date: selectedDate,
          amountPaid: Math.max(0, amt),
        }),
      })

      setRecords((prev) => {
        const withoutCurrent = prev.filter((r) => !(r.employeeId === employeeId && r.date === selectedDate))
        return [...withoutCurrent, saved]
      })

      setWageInputs((prev) => ({ ...prev, [employeeId]: String(Math.max(0, amt)) }))
      const emp = employees.find((e) => e.id === employeeId)
      setToast(`₹${Math.max(0, amt).toLocaleString('en-IN')} payout recorded for ${emp?.name || 'Staff'} on ${selectedDate}.`)
    } catch (err) {
      setError(err?.message || 'Failed to update payout amount.')
    }
  }

  async function handleDeleteEmployee(employeeId) {
    if (!window.confirm('Delete this team member? This cannot be undone.')) return
    try {
      await api(`employees/${employeeId}`, { method: 'DELETE' })
      setEmployees((prev) => prev.filter((e) => e.id !== employeeId))
      setToast('Team member removed.')
    } catch (err) {
      setError(err?.message || 'Failed to delete employee.')
    }
  }

  async function handleDeleteRecord(recordId) {
    if (!window.confirm('Delete this attendance entry?')) return
    try {
      await api(`attendanceRecords/${recordId}`, { method: 'DELETE' })
      setRecords((prev) => prev.filter((r) => r.id !== recordId))
      setToast('Attendance record deleted.')
    } catch (err) {
      setError(err?.message || 'Failed to delete record.')
    }
  }

  const selectedDateRecords = records.filter((r) => r.date === selectedDate)
  const presentCount = selectedDateRecords.filter((r) => r.status === 'present').length
  const halfDayCount = selectedDateRecords.filter((r) => r.status === 'half-day').length
  const absentCount = selectedDateRecords.filter((r) => r.status === 'absent').length
  const totalPaidOnSelectedDate = selectedDateRecords.reduce((sum, r) => sum + Number(r.amountPaid || 0), 0)

  const isToday = selectedDate === todayDate
  const formattedDateStr = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const historyDisplayRecords = (historyFilter === 'selected' ? selectedDateRecords : records).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  return (
    <>
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Team Management</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">Daily Attendance & Wage Tracker</h2>
          <p className="mt-1 text-xs text-slate-400">
            Pick any date from the calendar to mark attendance and track daily cash / wage payments given to each member.
          </p>
        </div>

        {/* Add Employee Form */}
        <form onSubmit={handleAddEmployee} className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] p-2.5 backdrop-blur-xl">
          <input
            required
            value={newEmployee.name}
            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
            placeholder="Staff name"
            className="min-h-10 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-md"
          />
          <input
            value={newEmployee.role}
            onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
            placeholder="Role (e.g. Sales, Store)"
            className="min-h-10 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-md"
          />
          <button
            disabled={busy}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-teal-600 px-4 text-xs font-bold text-white shadow-md transition hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50"
          >
            {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Plus size={14} />}
            <span>Add Staff</span>
          </button>
        </form>
      </div>

      {/* Interactive Calendar Date Selector Bar */}
      <div className="mt-7 flex flex-col justify-between gap-4 rounded-3xl border border-white/[0.14] bg-white/[0.05] p-5 shadow-lg backdrop-blur-xl md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/20 text-emerald-300">
            <Calendar size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">{formattedDateStr}</span>
              {isToday ? (
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Today
                </span>
              ) : (
                <span className="rounded-full border border-indigo-400/40 bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  {selectedDate < todayDate ? 'Past Record' : 'Future Date'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Marking attendance and rupees given for this chosen date</p>
          </div>
        </div>

        {/* Date Switcher Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => shiftDate(-1)}
            className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-white/15 bg-white/[0.07] px-3 text-xs font-bold text-slate-200 transition hover:bg-white/[0.14]"
            title="Previous Day"
          >
            <ChevronLeft size={16} /> Prev
          </button>

          <label className="relative inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-emerald-400/40 bg-white/[0.08] px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-white/[0.14]">
            <Calendar size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">Select Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="bg-transparent font-semibold text-white outline-none cursor-pointer"
            />
          </label>

          {!isToday && (
            <button
              type="button"
              onClick={() => setSelectedDate(todayDate)}
              className="min-h-10 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/25"
            >
              Go to Today
            </button>
          )}

          <button
            type="button"
            onClick={() => shiftDate(1)}
            className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-white/15 bg-white/[0.07] px-3 text-xs font-bold text-slate-200 transition hover:bg-white/[0.14]"
            title="Next Day"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Attendance & Payout Summary Counters for Selected Date */}
      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-5">
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Present</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">{presentCount}</p>
          <p className="mt-1 text-[11px] text-emerald-300/80">Full day present</p>
        </div>
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Half-Day</p>
          <p className="mt-2 text-3xl font-bold text-amber-400">{halfDayCount}</p>
          <p className="mt-1 text-[11px] text-amber-300/80">Partial shift</p>
        </div>
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-300">Absent</p>
          <p className="mt-2 text-3xl font-bold text-rose-400">{absentCount}</p>
          <p className="mt-1 text-[11px] text-rose-300/80">On leave / absent</p>
        </div>
        <div className="rounded-3xl border border-violet-500/30 bg-violet-500/10 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">Total Paid on Date</p>
          <p className="mt-2 text-3xl font-bold text-violet-300">₹{totalPaidOnSelectedDate.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-[11px] text-violet-300/80">Cash / wages paid</p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-3xl border border-white/[0.12] bg-white/[0.05] p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Staff</p>
          <p className="mt-2 text-3xl font-bold text-teal-300">{employees.length}</p>
          <p className="mt-1 text-[11px] text-slate-400">Registered team</p>
        </div>
      </div>

      {/* Team Member Cards with Status Buttons and Rupees Given inputs */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Mark Attendance & Record Rupees Given</h3>
          <span className="text-xs text-slate-400">Date: {formattedDateStr}</span>
        </div>

        <div className="mt-4 grid gap-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoaderCircle size={28} className="animate-spin text-emerald-400" />
            </div>
          ) : employees.length > 0 ? (
            employees.map((emp) => {
              const currentRec = selectedDateRecords.find((r) => r.employeeId === emp.id)
              const currentStatus = currentRec?.status || 'none'
              const recordedAmount = Number(currentRec?.amountPaid || 0)
              const currentInputValue = wageInputs[emp.id] !== undefined ? wageInputs[emp.id] : (recordedAmount > 0 ? String(recordedAmount) : '')

              // Lifetime wages given to this employee across all records
              const lifetimePaid = records.filter((r) => r.employeeId === emp.id).reduce((sum, r) => sum + Number(r.amountPaid || 0), 0)

              return (
                <div
                  key={emp.id}
                  className="rounded-3xl border border-white/[0.12] bg-white/[0.05] p-5 shadow-md backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    {/* Staff info */}
                    <div className="min-w-48">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-white">{emp.name}</p>
                        <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                          {emp.role || 'Team Member'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        All-time payouts recorded: <span className="font-semibold text-emerald-400">₹{lifetimePaid.toLocaleString('en-IN')}</span>
                      </p>
                    </div>

                    {/* One-click attendance buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMarkAttendance(emp.id, 'present')}
                        className={`min-h-11 rounded-xl border px-4 text-xs font-bold backdrop-blur-md transition ${
                          currentStatus === 'present'
                            ? 'border-emerald-400/50 bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                            : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                        }`}
                      >
                        ✓ Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkAttendance(emp.id, 'half-day')}
                        className={`min-h-11 rounded-xl border px-4 text-xs font-bold backdrop-blur-md transition ${
                          currentStatus === 'half-day'
                            ? 'border-amber-400/50 bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                            : 'border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                        }`}
                      >
                        ⏳ Half-day
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkAttendance(emp.id, 'absent')}
                        className={`min-h-11 rounded-xl border px-4 text-xs font-bold backdrop-blur-md transition ${
                          currentStatus === 'absent'
                            ? 'border-rose-400/50 bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                            : 'border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                        }`}
                      >
                        ✕ Absent
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-rose-300 transition hover:bg-rose-500/20"
                        title="Delete staff member"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Rupees Given on this date (Daily Wage / Cash Payout) */}
                  <div className="mt-4 flex flex-col justify-between gap-3 rounded-2xl border border-violet-500/20 bg-violet-950/20 p-3.5 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
                        <IndianRupee size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-violet-200">Rupees Given on this Date:</span>
                        {recordedAmount > 0 ? (
                          <span className="ml-2 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                            ₹{recordedAmount.toLocaleString('en-IN')} Saved
                          </span>
                        ) : (
                          <span className="ml-2 text-[11px] text-slate-400">None recorded yet</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-bold text-violet-300">₹</span>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={currentInputValue}
                          onChange={(e) => setWageInputs({ ...wageInputs, [emp.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleSaveWage(emp.id)
                            }
                          }}
                          className="min-h-9 w-28 rounded-xl border border-white/15 bg-black/40 pl-7 pr-2 text-xs font-bold text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveWage(emp.id)}
                        className="min-h-9 rounded-xl border border-violet-400/40 bg-gradient-to-r from-violet-600 to-indigo-600 px-3 text-xs font-bold text-white shadow transition hover:from-violet-500 hover:to-indigo-500"
                      >
                        Save ₹
                      </button>

                      {/* Quick preset chips */}
                      <button
                        type="button"
                        onClick={() => handleSaveWage(emp.id, 300)}
                        className="min-h-9 rounded-xl border border-white/10 bg-white/[0.05] px-2.5 text-[11px] font-semibold text-slate-300 hover:bg-white/10"
                      >
                        +₹300
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveWage(emp.id, 500)}
                        className="min-h-9 rounded-xl border border-white/10 bg-white/[0.05] px-2.5 text-[11px] font-semibold text-slate-300 hover:bg-white/10"
                      >
                        +₹500
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveWage(emp.id, 1000)}
                        className="min-h-9 rounded-xl border border-white/10 bg-white/[0.05] px-2.5 text-[11px] font-semibold text-slate-300 hover:bg-white/10"
                      >
                        +₹1000
                      </button>
                      {recordedAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSaveWage(emp.id, 0)}
                          className="min-h-9 rounded-xl border border-rose-500/20 bg-rose-500/10 px-2 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20"
                          title="Reset amount to 0"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.04] p-10 text-center backdrop-blur-xl">
              <ClipboardCheck size={28} className="mx-auto text-emerald-400" />
              <h3 className="mt-4 text-lg font-bold text-white">No team members added yet.</h3>
              <p className="mt-1 text-xs text-slate-400">Use the form above to add your staff and start marking daily attendance.</p>
            </div>
          )}
        </div>
      </div>

      {/* Attendance & Payout Ledger / History */}
      <div className="mt-12">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-bold text-white">Attendance & Payout History</h3>
            <p className="text-xs text-slate-400">Log of recorded attendance and cash given to team members.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHistoryFilter('selected')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                historyFilter === 'selected'
                  ? 'border border-emerald-400/40 bg-emerald-500 text-white shadow-sm'
                  : 'border border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/10'
              }`}
            >
              Selected Date ({selectedDate})
            </button>
            <button
              type="button"
              onClick={() => setHistoryFilter('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                historyFilter === 'all'
                  ? 'border border-emerald-400/40 bg-emerald-500 text-white shadow-sm'
                  : 'border border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/10'
              }`}
            >
              All Recorded Dates ({records.length})
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {historyDisplayRecords.length > 0 ? (
            historyDisplayRecords.map((rec) => {
              const emp = employees.find((e) => e.id === rec.employeeId)
              const statusColors = {
                present: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
                'half-day': 'border-amber-500/30 bg-amber-500/15 text-amber-300',
                absent: 'border-rose-500/30 bg-rose-500/15 text-rose-300',
              }[rec.status] || 'border-slate-500/30 bg-slate-500/15 text-slate-300'

              return (
                <div
                  key={rec.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-white/[0.12] bg-white/[0.05] p-4 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-center">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Date</p>
                      <p className="text-xs font-bold text-white">{rec.date}</p>
                    </div>
                    <div>
                      <p className="font-bold text-white">{emp?.name || 'Staff'}</p>
                      <p className="text-xs text-slate-400">{emp?.role || 'Team Member'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusColors}`}>
                      {rec.status}
                    </span>

                    <div className="text-right">
                      <p className="text-[10px] uppercase text-slate-400">Rupees Given</p>
                      <p className="text-base font-bold text-emerald-400">
                        ₹{Number(rec.amountPaid || 0).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(rec.id)}
                      className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/20"
                      title="Delete record"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center text-xs text-slate-400">
              No attendance or payout entries found for this filter.
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function ScanPage({ api, setToast, setError }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [extracted, setExtracted] = useState(null)
  const [parties, setParties] = useState([])

  // Form fields for review & editing
  const [fields, setFields] = useState({
    partyName: '',
    partyType: 'purchase',
    billNo: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'debit',
    baseAmount: '',
    taxAmount: '',
    other: '',
    otherType: 'credit', // 'credit' (+ adds to bill like 2% TCS), 'debit' (- deducts)
    advPayment: '',
    finalPayable: '',
    note: '',
  })

  useEffect(() => {
    api('parties')
      .then((res) => {
        if (Array.isArray(res)) setParties(res)
      })
      .catch(() => {})
  }, [])

  function handleFileChange(selected) {
    setFile(selected)
    setExtracted(null)
    setSavedSuccess(false)
    if (selected) {
      const url = URL.createObjectURL(selected)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  function handleFieldChange(key, val) {
    const next = { ...fields, [key]: val }
    if (['baseAmount', 'taxAmount', 'other', 'otherType', 'advPayment'].includes(key)) {
      const base = parseFloat(key === 'baseAmount' ? val : next.baseAmount) || 0
      const tax = parseFloat(key === 'taxAmount' ? val : next.taxAmount) || 0
      const oth = parseFloat(key === 'other' ? val : next.other) || 0
      const adv = parseFloat(key === 'advPayment' ? val : next.advPayment) || 0
      const othType = key === 'otherType' ? val : next.otherType
      const otherEffect = othType === 'credit' ? oth : -oth
      const calc = Math.max(0, base + tax + otherEffect - adv)
      next.finalPayable = (base > 0 || tax > 0 || oth > 0 || adv > 0) ? String(Math.round(calc)) : ''
    }
    setFields(next)
  }

  async function scan(event) {
    event.preventDefault()
    if (!file) return setError('Please choose or take a picture of a bill image first.')
    setBusy(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      const result = await api('scan', { method: 'POST', body })

      const ext = result.extracted || {}
      setExtracted(ext)
      setFields({
        partyName: ext.partyName || (parties[0]?.name || 'Commercial Vendor'),
        partyType: ext.partyType || 'purchase',
        billNo: ext.billNo || `INV-${Date.now().toString().slice(-4)}`,
        date: ext.date || new Date().toISOString().slice(0, 10),
        type: ext.type || 'debit',
        baseAmount: ext.baseAmount ? String(ext.baseAmount) : '',
        taxAmount: ext.taxAmount ? String(ext.taxAmount) : '',
        other: ext.other ? String(ext.other) : '',
        otherType: ext.otherType || 'credit',
        advPayment: ext.advPayment ? String(ext.advPayment) : '',
        finalPayable: ext.finalPayable ? String(ext.finalPayable) : (ext.amount ? String(ext.amount) : ''),
        note: ext.description || ext.note || '',
      })
      setToast('Bill analyzed successfully! Review and confirm details below.')
    } catch (scanError) {
      setError(scanError.message || 'Could not scan bill.')
    } finally {
      setBusy(false)
    }
  }

  async function saveToLedger() {
    if (!fields.partyName.trim()) return setError('Please enter a party name.')
    const payable = parseFloat(fields.finalPayable) || parseFloat(fields.baseAmount) || 0
    if (payable <= 0) return setError('Please enter a valid bill amount.')

    setSaving(true)
    setError('')
    try {
      // 1. Find or create party
      let targetParty = parties.find(
        (p) => p.name.trim().toLowerCase() === fields.partyName.trim().toLowerCase()
      )
      if (!targetParty) {
        const createdParty = await api('parties', {
          method: 'POST',
          body: JSON.stringify({
            name: fields.partyName.trim(),
            type: fields.partyType || 'purchase',
          }),
        })
        targetParty = createdParty
        setParties((prev) => [...prev, createdParty])
      }

      // 2. Create ledger entry
      const base = parseFloat(fields.baseAmount) || payable
      const tax = parseFloat(fields.taxAmount) || 0
      const oth = parseFloat(fields.other) || 0
      const adv = parseFloat(fields.advPayment) || 0

      const payload = {
        partyId: targetParty.id,
        partyName: targetParty.name,
        type: fields.type,
        date: fields.date,
        billNo: fields.billNo,
        baseAmount: base,
        totalAmount: base,
        taxAmount: tax,
        other: oth,
        otherType: fields.otherType || 'credit',
        advPayment: adv,
        amount: payable,
        finalPayable: payable,
        note: fields.note || `Scanned bill #${fields.billNo || ''} (${file?.name || 'Invoice'})`,
        source: 'scan',
      }

      await api('ledgerEntries', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setToast(`Bill #${fields.billNo || 'Record'} saved to ledger for ${targetParty.name}!`)
      setSavedSuccess(true)
    } catch (err) {
      setError(err?.message || 'Failed to save bill to ledger.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-violet-400">AI Document Extraction</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">Smart Bill Scan</h2>
          <p className="mt-1 text-sm text-slate-400">
            Upload or snap any invoice/receipt. AI automatically analyzes party names, bill numbers, taxes, and amounts into your ledger.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-300">
            <Sparkles size={14} /> Smart AI Scanner
          </span>
        </div>
      </div>

      {/* Upload & Scan Card */}
      <div className="mt-7 rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-950/30 via-white/[0.04] to-indigo-950/20 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-violet-300">
            <FileScan size={24} />
            <h3 className="text-lg font-bold">Select Invoice, PDF, or Word Bill</h3>
          </div>
          <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
            ⚡ PDF, Word & Image AI Scanner
          </span>
        </div>

        <form onSubmit={scan} className="mt-6 grid gap-4">
          <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-400/30 bg-white/[0.04] p-6 text-center backdrop-blur-md transition hover:border-violet-400/60 hover:bg-white/[0.08]">
            <ScanLine size={32} className="text-violet-400" />
            <span className="mt-3 text-sm font-semibold text-white">Choose a Bill, Invoice, PDF, or Word Document</span>
            <span className="mt-1 text-xs text-slate-400">Supports PDF, Word (.docx / .doc), JPG, PNG, or camera photo</span>
            <input
              className="sr-only"
              type="file"
              accept="image/*,application/pdf,.pdf,.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
              capture="environment"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
          </label>

          {/* Selected File & Preview */}
          {file && (
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                {file?.type?.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic)$/i.test(file?.name || '') ? (
                  previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Bill Preview"
                      className="h-12 w-12 rounded-lg object-cover border border-white/20"
                    />
                  )
                ) : file?.name?.toLowerCase().endsWith('.pdf') || file?.type === 'application/pdf' ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-rose-500/40 bg-rose-500/20 text-rose-300">
                    <FileText size={24} />
                  </div>
                ) : /\.(docx?|doc)$/i.test(file?.name || '') || file?.type?.includes('word') || file?.type?.includes('officedocument') ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-blue-500/40 bg-blue-500/20 text-blue-300">
                    <FileText size={24} />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-violet-500/40 bg-violet-500/20 text-violet-300">
                    <FileScan size={24} />
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-white truncate max-w-xs">{file.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                    <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white/10 text-slate-300">
                      {file?.name?.toLowerCase().endsWith('.pdf') || file?.type === 'application/pdf'
                        ? 'PDF Bill'
                        : /\.(docx?|doc)$/i.test(file?.name || '') || file?.type?.includes('word') || file?.type?.includes('officedocument')
                        ? 'Word Bill'
                        : 'Image Bill'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleFileChange(null)}
                className="text-xs font-semibold text-rose-300 hover:text-rose-200"
              >
                Change
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !file}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-violet-400/40 bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-bold text-white shadow-lg backdrop-blur-md transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
          >
            {busy ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                <span>Analyzing Document Details...</span>
              </>
            ) : (
              <>
                <ScanLine size={18} />
                <span>Extract Details with AI</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Extracted Details & Review Section */}
      {extracted && (
        <div className="mt-8 rounded-3xl border border-emerald-400/40 bg-gradient-to-br from-emerald-950/25 via-white/[0.04] to-indigo-950/20 p-6 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xl font-bold text-white">Review & Save Invoice</h3>
              <p className="mt-0.5 text-xs text-slate-300">
                Check extracted fields below and adjust anything before saving directly to your ledger.
              </p>
            </div>
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
              ✓ Details Extracted
            </span>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            {/* Bill Document Preview on the Left */}
            <div className="lg:col-span-4 flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Bill Document Preview</span>
              <div className="overflow-hidden rounded-2xl border border-white/20 bg-black/50 p-2">
                {file?.type?.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic)$/i.test(file?.name || '') ? (
                  previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Scanned Bill"
                      className="max-h-80 w-full object-contain rounded-xl"
                    />
                  )
                ) : file?.name?.toLowerCase().endsWith('.pdf') || file?.type === 'application/pdf' ? (
                  <div className="flex flex-col gap-2">
                    {previewUrl && (
                      <iframe
                        src={previewUrl}
                        title="PDF Invoice Preview"
                        className="h-72 w-full rounded-xl border border-white/10 bg-white"
                      />
                    )}
                    <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                      <span className="truncate">{file?.name}</span>
                      <span className="font-bold text-rose-400 uppercase text-[10px]">PDF Document</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/20 text-blue-300">
                      <FileText size={32} />
                    </div>
                    <p className="mt-3 text-xs font-bold text-white truncate max-w-full">{file?.name}</p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {/\.(docx?|doc)$/i.test(file?.name || '') ? 'Word Document (.docx / .doc)' : 'Document File'} • {file ? (file.size / 1024).toFixed(1) : 0} KB
                    </p>
                    <span className="mt-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      ✓ Document Analyzed & Parsed
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Editable Form Fields on the Right */}
            <div className="grid gap-4 lg:col-span-8">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <span>Party / Business Name</span>
                  <input
                    value={fields.partyName}
                    onChange={(e) => handleFieldChange('partyName', e.target.value)}
                    placeholder="e.g. Balaji Textiles"
                    className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm font-semibold text-white outline-none backdrop-blur-md"
                  />
                </label>

                {/* Party Type: Purchase or Sell */}
                <div className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <span>Party Type</span>
                  <div className="grid min-h-11 grid-cols-2 gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] p-1 backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('partyType', 'purchase')}
                      className={`flex items-center justify-center rounded-lg text-xs font-bold transition ${
                        (fields.partyType || 'purchase') === 'purchase'
                          ? 'border border-teal-500/50 bg-teal-500/30 text-teal-200 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Purchase
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('partyType', 'seller')}
                      className={`flex items-center justify-center rounded-lg text-xs font-bold transition ${
                        fields.partyType === 'seller' || fields.partyType === 'sell'
                          ? 'border border-amber-500/50 bg-amber-500/30 text-amber-200 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Sell
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <span>Invoice / Bill #</span>
                  <input
                    value={fields.billNo}
                    onChange={(e) => handleFieldChange('billNo', e.target.value)}
                    placeholder="e.g. 1024"
                    className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none backdrop-blur-md"
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <span>Date</span>
                  <input
                    type="date"
                    value={fields.date}
                    onChange={(e) => handleFieldChange('date', e.target.value)}
                    className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none backdrop-blur-md"
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <span>Transaction Type</span>
                  <select
                    value={fields.type}
                    onChange={(e) => handleFieldChange('type', e.target.value)}
                    className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none backdrop-blur-md"
                  >
                    <option value="debit" className="bg-[#111827] text-white">Debit (Payable)</option>
                    <option value="credit" className="bg-[#111827] text-white">Credit (Receivable)</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <span>Sale / Base Amount (₹)</span>
                  <input
                    type="number"
                    step="any"
                    value={fields.baseAmount}
                    onChange={(e) => handleFieldChange('baseAmount', e.target.value)}
                    placeholder="0"
                    className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none backdrop-blur-md"
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <span>Tax Amount (GST / SGST+CGST / IGST) (₹)</span>
                  <input
                    type="number"
                    step="any"
                    value={fields.taxAmount}
                    onChange={(e) => handleFieldChange('taxAmount', e.target.value)}
                    placeholder="0"
                    className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none backdrop-blur-md"
                  />
                </label>
              </div>

              {/* Other / 2% TCS & Advance Payment Row */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Other / TCS (2%) (₹)</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleFieldChange('otherType', 'credit')}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          fields.otherType === 'credit'
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        + Add (TCS)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFieldChange('otherType', 'debit')}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          fields.otherType === 'debit'
                            ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        - Less (Disc)
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={fields.other}
                    onChange={(e) => handleFieldChange('other', e.target.value)}
                    placeholder="0"
                    className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none backdrop-blur-md"
                  />
                </div>

                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                  <span>Adv Payment (₹)</span>
                  <input
                    type="number"
                    step="any"
                    value={fields.advPayment}
                    onChange={(e) => handleFieldChange('advPayment', e.target.value)}
                    placeholder="0"
                    className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none backdrop-blur-md"
                  />
                </label>
              </div>

              {/* Highlighted Final Payable Amount */}
              <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/15 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Final Net Payable Amount</span>
                  <span className="text-xs text-slate-400">Base + Tax {fields.otherType === 'credit' ? '+ TCS' : '- Disc'} - Adv</span>
                </div>
                <input
                  type="number"
                  step="any"
                  value={fields.finalPayable}
                  onChange={(e) => handleFieldChange('finalPayable', e.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-emerald-400/40 bg-black/40 px-3.5 text-lg font-bold text-emerald-300 outline-none backdrop-blur-md"
                />
              </div>

              <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <span>Description / Notes</span>
                <input
                  value={fields.note}
                  onChange={(e) => handleFieldChange('note', e.target.value)}
                  placeholder="Items or remarks from bill"
                  className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-md"
                />
              </label>

              {/* Confirm & Save Button */}
              {savedSuccess ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-emerald-400/50 bg-emerald-500/20 p-4 text-center">
                  <p className="font-bold text-emerald-300">✓ Bill posted to ledger successfully!</p>
                  <div className="flex justify-center gap-3">
                    <a
                      href="/parties"
                      className="rounded-xl border border-emerald-400/40 bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500"
                    >
                      View in Parties & Ledger
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        handleFileChange(null)
                        setExtracted(null)
                        setSavedSuccess(false)
                      }}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
                    >
                      Scan Another Bill
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={saveToLedger}
                  disabled={saving}
                  className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-lg backdrop-blur-md transition hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      <span>Saving to Ledger...</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>Confirm & Save to Ledger</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoPage() {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Documentation</p>
      <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">How Ledgerly Works</h2>
      <div className="mt-7 grid gap-4">
        {[
          ['Start with the daily truth', 'Record sales, purchases, stock movements, and attendance while they are fresh.'],
          ['Keep balances understandable', 'A positive party balance means they owe you. A negative balance means you owe them.'],
          ['Review before you trust', 'Smart Bill Scan helps with data entry, but you remain in control of what gets saved.'],
        ].map(([title, body]) => (
          <div key={title} className="rounded-3xl border border-white/[0.12] bg-white/[0.05] p-6 shadow-sm backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SettingsPage({ user, logout }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Preferences</p>
      <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">Settings & Profile</h2>
      <div className="mt-7 rounded-3xl border border-white/[0.12] bg-white/[0.05] p-6 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/20 text-xl font-bold text-emerald-300 backdrop-blur-md">
            {(user?.displayName || user?.email || 'A').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{user?.displayName || 'My business'}</h3>
            <p className="text-xs text-slate-400">{user?.email || 'Firebase account'}</p>
          </div>
        </div>
        <Button onClick={logout} variant="secondary" className="mt-7">
          <LogOut size={16} /> Sign out of Workspace
        </Button>
      </div>
    </div>
  )
}

function EmptyPage({ title }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.04] p-10 text-center backdrop-blur-xl">
      <CircleHelp className="mx-auto text-emerald-400" size={28} />
      <h2 className="mt-5 text-2xl font-bold text-white">{title}</h2>
      <p className="mt-3 text-sm text-slate-400">This Ledgerly space is ready for your business data.</p>
    </div>
  )
}
