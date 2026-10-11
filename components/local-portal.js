'use client'

import { useEffect, useState } from 'react'
import {
  Bell,
  BookOpen,
  Boxes,
  Check,
  CircleHelp,
  ClipboardCheck,
  FileScan,
  LayoutDashboard,
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
import { clearLocalUser, localMarkAttendance, getLocalData, getLocalUser, setLocalData } from '@/lib/local-store'
import { analyzeInvoiceText } from '@/lib/invoice-analyzer'

const nav = [
  ['/dashboard', 'Dashboard', LayoutDashboard],
  ['/stock', 'Stock', Boxes],
  ['/parties', 'Parties & ledger', BookOpen],
  ['/attendance', 'Attendance', ClipboardCheck],
]
const today = () => new Date().toISOString().slice(0, 10)
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

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

function Button({ children, href, variant = 'primary', onClick, className = '' }) {
  const styles = {
    primary:
      'border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:from-emerald-400 hover:to-teal-500 hover:shadow-[0_6px_25px_rgba(16,185,129,0.5)]',
    secondary:
      'border border-white/15 bg-white/[0.08] text-white shadow-md hover:bg-white/[0.14] hover:border-white/25',
    violet:
      'border border-violet-400/40 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_4px_20px_rgba(139,92,246,0.35)] hover:from-violet-500 hover:to-indigo-500 hover:shadow-[0_6px_25px_rgba(139,92,246,0.5)]',
  }
  const classes = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold backdrop-blur-md transition-all duration-200 active:scale-[0.98] ${styles[variant]} ${className}`
  return href ? (
    <a href={href} className={classes}>
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  )
}

function Field({ label, children }) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
      <span>{label}</span>
      {children}
    </label>
  )
}

function Input({ value, onChange, type = 'text', placeholder }) {
  return (
    <input
      required
      value={value || ''}
      onChange={(event) => onChange(event.target.value)}
      type={type}
      placeholder={placeholder}
      className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm font-normal text-white outline-none placeholder:text-slate-500 backdrop-blur-md transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20"
    />
  )
}

export default function LocalPortal({ path }) {
  const [user, setUser] = useState(null)
  const [data, setData] = useState(null)
  const [navOpen, setNavOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const current = getLocalUser()
    if (!current) {
      window.location.href = '/login'
      return
    }
    setUser(current)
    setData(getLocalData())
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 2600)
      return () => clearTimeout(timer)
    }
  }, [toast])

  if (!user || !data)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B0F19]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
      </main>
    )

  const update = (next, message = 'Saved successfully.') => {
    setData(setLocalData(next))
    setToast(message)
    setError('')
  }
  const logout = () => {
    clearLocalUser()
    window.location.href = '/'
  }
  const title =
    path === '/dashboard'
      ? `Good morning, ${(user.displayName || 'Owner').split(' ')[0]}`
      : {
          '/stock': 'Stock Management',
          '/parties': 'Parties & Ledger',
          '/attendance': 'Team Attendance',
          '/scan': 'Smart Bill Scan',
          '/info': 'Ledgerly Guide',
          '/settings': 'Settings & Workspace',
        }[path] || 'Dashboard'

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0B0F19] text-slate-100">
      {/* Background ambient glowing mesh orbs */}
      <div className="pointer-events-none fixed -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-emerald-500/15 blur-[140px]" />
      <div className="pointer-events-none fixed -right-48 top-1/4 h-[650px] w-[650px] rounded-full bg-indigo-600/15 blur-[160px]" />
      <div className="pointer-events-none fixed -bottom-48 left-1/3 h-[550px] w-[550px] rounded-full bg-teal-500/10 blur-[150px]" />

      <div className="relative z-10 flex min-h-screen">
        {/* Glassmorphic Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-white/10 bg-black/40 p-5 backdrop-blur-2xl transition-transform duration-300 lg:static lg:translate-x-0 ${
            navOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between">
            <Logo />
            <button onClick={() => setNavOpen(false)} className="rounded-lg p-2 text-slate-400 hover:text-white lg:hidden">
              <X size={20} />
            </button>
          </div>

          <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-teal-500/5 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Workspace</p>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>
            <p className="mt-2 text-base font-semibold text-white">{user.displayName || 'My Business'}</p>
            <p className="mt-0.5 text-xs text-slate-400">Local Secured Workspace</p>
          </div>

          <nav className="mt-7 grid gap-1.5">
            {nav.map(([href, label, Icon]) => {
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
                path === '/scan'
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
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Main Content Section */}
        <section className="min-w-0 flex-1">
          {/* Glass Header */}
          <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between border-b border-white/10 bg-black/20 px-5 backdrop-blur-xl lg:px-10">
            <div className="flex items-center gap-3">
              <button
                aria-label="Open navigation"
                onClick={() => setNavOpen(true)}
                className="rounded-xl border border-white/10 bg-white/[0.06] p-2 text-slate-300 backdrop-blur-md lg:hidden"
              >
                <Menu size={22} />
              </button>
              <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setToast('You are all caught up.')}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-slate-300 shadow-sm backdrop-blur-md transition hover:border-white/25 hover:text-white"
              >
                <Bell size={17} />
              </button>
              <div className="hidden items-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-1.5 backdrop-blur-md sm:flex">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300 border border-emerald-400/30">
                  {(user.displayName || 'A').slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-32 truncate text-sm font-medium text-slate-200">{user.displayName}</span>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10 lg:py-10">
            {error && (
              <div role="alert" className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 backdrop-blur-md">
                {error}
              </div>
            )}
            {path === '/dashboard' && <Dashboard data={data} />}
            {path === '/stock' && <StockPage data={data} update={update} />}
            {path === '/parties' && <PartiesPage data={data} update={update} />}
            {path === '/attendance' && <AttendancePage data={data} update={update} />}
            {path === '/scan' && <ScanPage data={data} update={update} />}
            {path === '/info' && <InfoPage />}
            {path === '/settings' && <SettingsPage user={user} logout={logout} />}
          </div>
        </section>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-white/20 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur-xl"
        >
          <Check size={17} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </main>
  )
}

function Dashboard({ data }) {
  const stockValue = data.items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0)
  const receivables = data.parties.filter((party) => party.balance > 0).reduce((sum, party) => sum + party.balance, 0)
  const payables = Math.abs(data.parties.filter((party) => party.balance < 0).reduce((sum, party) => sum + party.balance, 0))
  const present = data.attendanceRecords.filter((record) => record.date === today() && record.status === 'present').length
  const lowStock = data.items.filter((item) => item.quantity <= item.lowStockThreshold).length

  const cards = [
    { label: 'Total receivables', value: money(receivables), hint: 'Amounts owed to you', color: 'text-emerald-400', icon: ArrowUpRight, badge: 'Receivable' },
    { label: 'Total payables', value: money(payables), hint: 'Amounts to vendors', color: 'text-violet-400', icon: ArrowDownLeft, badge: 'Payable' },
    { label: 'Stock inventory value', value: money(stockValue), hint: `${lowStock} items low in stock`, color: 'text-amber-400', icon: Package, badge: `${data.items.length} items` },
    { label: "Today's attendance", value: `${present} / ${data.employees.length}`, hint: 'Team members present', color: 'text-teal-400', icon: Users, badge: 'Staff' },
  ]

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Live Business Analytics</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">Financial Overview</h2>
        </div>
        <Button href="/scan" variant="violet">
          <ScanLine size={16} /> Scan Bill with AI
        </Button>
      </div>

      {/* KPI Glass Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, hint, color, icon: Icon, badge }) => (
          <div
            key={label}
            className="group relative overflow-hidden rounded-3xl border border-white/[0.12] bg-white/[0.05] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl transition-all duration-300 hover:border-white/25 hover:bg-white/[0.08] hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-bold text-slate-300">
                {badge}
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-white">{value}</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
              <Icon size={14} className={color} />
              <span className={color}>{hint}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Ledger Activity Chart Glass Card */}
        <div className="rounded-3xl border border-white/[0.12] bg-white/[0.05] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white">Ledger Activity</h3>
              <p className="mt-1 text-xs text-slate-400">Transaction volume & balance trends</p>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              Last 7 Days
            </span>
          </div>

          <div className="mt-8 flex h-48 items-end gap-2.5 pt-4">
            {[35, 55, 43, 68, 51, 82, 74, 96, 67, 88, 76, 91].map((height, index) => (
              <div key={index} className="group relative flex-1">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600/50 to-teal-400/80 transition-all duration-200 group-hover:from-emerald-400 group-hover:to-teal-300 group-hover:shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Glass Card */}
        <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-950/30 via-white/[0.04] to-indigo-950/20 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl">
          <div className="flex items-center gap-2 text-violet-400">
            <Sparkles size={18} />
            <h3 className="font-bold text-white">Quick Actions</h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">Keep your day-to-day books completely updated.</p>

          <div className="mt-6 grid gap-2.5">
            <Button href="/parties" variant="secondary" className="justify-start">
              <Plus size={16} className="text-emerald-400" /> Add Ledger Entry
            </Button>
            <Button href="/stock" variant="secondary" className="justify-start">
              <Package size={16} className="text-violet-400" /> Log Stock Movement
            </Button>
            <Button href="/attendance" variant="secondary" className="justify-start">
              <ClipboardCheck size={16} className="text-teal-400" /> Mark Today&apos;s Attendance
            </Button>
          </div>
        </div>
      </div>

      {/* Attention / Highlights Glass Section */}
      <div className="mt-6 rounded-3xl border border-white/[0.12] bg-white/[0.05] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl">
        <h3 className="font-bold text-white">Actionable Insights</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <a
            href="/stock"
            className="group rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 backdrop-blur-md transition hover:border-amber-500/40 hover:bg-amber-500/15"
          >
            <p className="text-sm font-bold text-amber-300">{lowStock} low-stock alert</p>
            <p className="mt-1 text-xs text-slate-400 group-hover:text-slate-300">Review inventory reorder levels →</p>
          </a>
          <a
            href="/parties"
            className="group rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 backdrop-blur-md transition hover:border-violet-500/40 hover:bg-violet-500/15"
          >
            <p className="text-sm font-bold text-violet-300">Check party receivables</p>
            <p className="mt-1 text-xs text-slate-400 group-hover:text-slate-300">Review outstanding balances →</p>
          </a>
          <a
            href="/attendance"
            className="group rounded-2xl border border-teal-500/20 bg-teal-500/10 p-4 backdrop-blur-md transition hover:border-teal-500/40 hover:bg-teal-500/15"
          >
            <p className="text-sm font-bold text-teal-300">Team attendance record</p>
            <p className="mt-1 text-xs text-slate-400 group-hover:text-slate-300">Ensure current shift logging →</p>
          </a>
        </div>
      </div>
    </>
  )
}

function StockPage({ data, update }) {
  const [item, setItem] = useState({ name: '', category: '', quantity: '', costPrice: '', sellingPrice: '', lowStockThreshold: '' })
  const [movement, setMovement] = useState({ itemId: data.items[0]?.id || '', type: 'in', quantity: '', note: '' })

  const addItem = (event) => {
    event.preventDefault()
    update({
      ...data,
      items: [
        ...data.items,
        {
          ...item,
          id: `local-item-${Date.now()}`,
          quantity: Number(item.quantity),
          costPrice: Number(item.costPrice),
          sellingPrice: Number(item.sellingPrice),
          lowStockThreshold: Number(item.lowStockThreshold),
        },
      ],
    })
    setItem({ name: '', category: '', quantity: '', costPrice: '', sellingPrice: '', lowStockThreshold: '' })
  }

  const addMovement = (event) => {
    event.preventDefault()
    const next = {
      ...data,
      items: data.items.map((entry) =>
        entry.id === movement.itemId
          ? {
              ...entry,
              quantity: Math.max(0, entry.quantity + (movement.type === 'in' ? Number(movement.quantity) : -Number(movement.quantity))),
            }
          : entry
      ),
      stockLogs: [...data.stockLogs, { ...movement, id: `local-log-${Date.now()}`, date: today() }],
    }
    update(next, 'Stock movement saved.')
    setMovement({ ...movement, quantity: '' })
  }

  return (
    <>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Inventory Management</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">{data.items.length} Products Tracked</h2>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        {/* Add Product Form */}
        <form onSubmit={addItem} className="grid gap-3.5 rounded-3xl border border-white/[0.12] bg-white/[0.05] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl">
          <h3 className="font-bold text-white">Add New Product</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Item Name">
              <Input value={item.name} onChange={(value) => setItem({ ...item, name: value })} placeholder="Cotton Tote Bag" />
            </Field>
            <Field label="Category">
              <Input value={item.category} onChange={(value) => setItem({ ...item, category: value })} placeholder="Bags / Apparel" />
            </Field>
            <Field label="Quantity">
              <Input type="number" value={item.quantity} onChange={(value) => setItem({ ...item, quantity: value })} placeholder="0" />
            </Field>
            <Field label="Cost Price (₹)">
              <Input type="number" value={item.costPrice} onChange={(value) => setItem({ ...item, costPrice: value })} placeholder="0" />
            </Field>
            <Field label="Selling Price (₹)">
              <Input type="number" value={item.sellingPrice} onChange={(value) => setItem({ ...item, sellingPrice: value })} placeholder="0" />
            </Field>
            <Field label="Low-Stock Alert">
              <Input type="number" value={item.lowStockThreshold} onChange={(value) => setItem({ ...item, lowStockThreshold: value })} placeholder="5" />
            </Field>
          </div>
          <button className="mt-2 min-h-11 rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition hover:from-emerald-400 hover:to-teal-500">
            Add Product to Stock
          </button>
        </form>

        {/* Movement Form */}
        <form onSubmit={addMovement} className="grid gap-3.5 rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-950/25 via-white/[0.04] to-indigo-950/20 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl">
          <h3 className="font-bold text-violet-300">Log Stock Movement</h3>
          <Field label="Select Product">
            <select
              value={movement.itemId}
              onChange={(event) => setMovement({ ...movement, itemId: event.target.value })}
              className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white backdrop-blur-md outline-none"
            >
              {data.items.map((entry) => (
                <option key={entry.id} value={entry.id} className="bg-[#111827] text-white">
                  {entry.name} ({entry.quantity} in stock)
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Movement Type">
              <select
                value={movement.type}
                onChange={(event) => setMovement({ ...movement, type: event.target.value })}
                className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white backdrop-blur-md outline-none"
              >
                <option value="in" className="bg-[#111827] text-white">Stock In (Purchased / Received)</option>
                <option value="out" className="bg-[#111827] text-white">Stock Out (Sold / Shipped)</option>
              </select>
            </Field>
            <Field label="Quantity">
              <Input type="number" value={movement.quantity} onChange={(value) => setMovement({ ...movement, quantity: value })} placeholder="0" />
            </Field>
          </div>
          <button className="mt-2 min-h-11 rounded-xl border border-violet-400/40 bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition hover:from-violet-500 hover:to-indigo-500">
            Save Stock Movement
          </button>
        </form>
      </div>

      {/* Stock Items Grid */}
      <div className="mt-8 grid gap-3">
        {data.items.map((entry) => (
          <div
            key={entry.id}
            className="flex flex-col justify-between gap-3 rounded-2xl border border-white/[0.12] bg-white/[0.05] p-5 shadow-sm backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.08] sm:flex-row sm:items-center"
          >
            <div>
              <p className="font-bold text-white">{entry.name}</p>
              <p className="mt-1 text-xs text-slate-400">
                {entry.category} · Cost {money(entry.costPrice)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-md ${
                  entry.quantity <= entry.lowStockThreshold
                    ? 'border-amber-500/30 bg-amber-500/15 text-amber-300'
                    : 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                }`}
              >
                {entry.quantity} units in stock
              </span>
              <span className="text-xs text-slate-400">Sell Price: {money(entry.sellingPrice)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function PartiesPage({ data, update }) {
  const [party, setParty] = useState({ name: '', phone: '', type: 'purchase' })
  const [selectedPartyId, setSelectedPartyId] = useState(null)
  const [editingBillId, setEditingBillId] = useState(null)
  const [bill, setBill] = useState({
    partyId: data.parties[0]?.id || '',
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

  // Keep bill partyId valid
  useEffect(() => {
    if (data.parties.length && !bill.partyId) {
      setBill((prev) => ({ ...prev, partyId: data.parties[0].id }))
    }
  }, [data.parties])

  const formatPartyType = (type) => {
    if (type === 'seller' || type === 'sell' || type === 'vendor') return 'Sell'
    if (type === 'purchase' || type === 'customer') return 'Purchase'
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Purchase'
  }

  const handleBillChange = (field, val) => {
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

  const addParty = (event) => {
    event.preventDefault()
    if (!party.name.trim()) return
    const selectedType = party.type === 'seller' || party.type === 'sell' ? 'seller' : 'purchase'
    const newParty = { ...party, type: selectedType, id: `local-party-${Date.now()}`, balance: 0 }
    update(
      { ...data, parties: [...data.parties, newParty] },
      `Party "${newParty.name}" created (${formatPartyType(selectedType)}).`
    )
    if (!bill.partyId) setBill((prev) => ({ ...prev, partyId: newParty.id }))
    setParty({ name: '', phone: '', type: 'purchase' })
  }

  const handleStartEditBill = (entry) => {
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
    const formElem = document.getElementById('local-billing-form')
    if (formElem) formElem.scrollIntoView({ behavior: 'smooth' })
    else window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingBillId(null)
    setBill({
      partyId: data.parties[0]?.id || '',
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

  const handleSetPartyType = (partyItem, newType) => {
    if (partyItem.type === newType) return
    update(
      {
        ...data,
        parties: data.parties.map((p) => (p.id === partyItem.id ? { ...p, type: newType } : p)),
      },
      `Party "${partyItem.name}" changed to ${formatPartyType(newType)} mode.`
    )
  }

  const addEntry = (event) => {
    event.preventDefault()
    if (!bill.partyId) return
    const baseVal = parseFloat(bill.baseAmount) || 0
    const payable = parseFloat(bill.finalPayable) || baseVal || 0
    if (payable <= 0) return

    const partyObj = data.parties.find((p) => p.id === bill.partyId)

    if (editingBillId) {
      const prevEntry = data.ledgerEntries.find((e) => e.id === editingBillId)
      const prevAmt = Number(prevEntry?.finalPayable !== undefined ? prevEntry.finalPayable : prevEntry?.amount || 0)
      const prevPartyId = prevEntry?.partyId || bill.partyId
      const prevType = prevEntry?.type || 'debit'

      const updatedEntries = data.ledgerEntries.map((e) =>
        e.id === editingBillId
          ? {
              ...e,
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
          : e
      )

      const updatedParties = data.parties.map((p) => {
        let bal = Number(p.balance || 0)
        if (p.id === prevPartyId) {
          bal -= (prevType === 'debit' ? prevAmt : -prevAmt)
        }
        if (p.id === bill.partyId) {
          bal += (bill.type === 'debit' ? payable : -payable)
        }
        return { ...p, balance: bal }
      })

      update(
        { ...data, parties: updatedParties, ledgerEntries: updatedEntries },
        `Bill #${bill.billNo || 'Record'} updated successfully!`
      )
      setEditingBillId(null)
    } else {
      const newEntry = {
        ...bill,
        id: `local-entry-${Date.now()}`,
        partyName: partyObj?.name || '',
        amount: payable,
        finalPayable: payable,
        baseAmount: baseVal,
        totalAmount: baseVal,
        advPayment: parseFloat(bill.advPayment) || 0,
        taxAmount: parseFloat(bill.taxAmount) || 0,
        other: parseFloat(bill.other) || 0,
        otherType: bill.otherType || 'debit',
        source: 'manual',
      }

      update(
        {
          ...data,
          parties: data.parties.map((item) =>
            item.id === bill.partyId
              ? { ...item, balance: Number(item.balance || 0) + (bill.type === 'debit' ? payable : -payable) }
              : item
          ),
          ledgerEntries: [newEntry, ...data.ledgerEntries],
        },
        `Bill #${bill.billNo || 'Entry'} posted! Final Payable: ${money(payable)}`
      )
    }

    setBill({
      partyId: data.parties[0]?.id || '',
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

  const deleteParty = (partyId) => {
    if (!window.confirm('Delete this party? This cannot be undone.')) return
    update(
      {
        ...data,
        parties: data.parties.filter((p) => p.id !== partyId),
        ledgerEntries: data.ledgerEntries.filter((e) => e.partyId !== partyId),
      },
      'Party deleted.'
    )
    if (selectedPartyId === partyId) setSelectedPartyId(null)
  }

  const deleteEntry = (entryId) => {
    if (!window.confirm('Delete this ledger transaction? This cannot be undone.')) return
    const target = data.ledgerEntries.find((e) => e.id === entryId)
    if (!target) return
    const amt = Number(target.finalPayable !== undefined ? target.finalPayable : target.amount || 0)
    update(
      {
        ...data,
        parties: data.parties.map((p) =>
          p.id === target.partyId
            ? { ...p, balance: Number(p.balance || 0) - (target.type === 'debit' ? amt : -amt) }
            : p
        ),
        ledgerEntries: data.ledgerEntries.filter((e) => e.id !== entryId),
      },
      'Ledger transaction deleted.'
    )
  }

  const receivables = data.parties.filter((p) => p.balance > 0).reduce((sum, p) => sum + Number(p.balance || 0), 0)
  const payables = Math.abs(data.parties.filter((p) => p.balance < 0).reduce((sum, p) => sum + Number(p.balance || 0), 0))

  const selectedParty = data.parties.find((p) => p.id === selectedPartyId) || null
  const selectedPartyBills = (data.ledgerEntries || [])
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
          <p className="mt-2 text-3xl font-bold text-emerald-400">{money(receivables)}</p>
          <p className="mt-1 text-xs text-emerald-300/80">Amounts owed to you</p>
        </div>
        <div className="rounded-3xl border border-white/[0.12] bg-white/[0.05] p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Payables</p>
          <p className="mt-2 text-3xl font-bold text-violet-400">{money(payables)}</p>
          <p className="mt-1 text-xs text-violet-300/80">Amounts you owe to sellers</p>
        </div>
        <div className="rounded-3xl border border-white/[0.12] bg-white/[0.05] p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Parties</p>
          <p className="mt-2 text-3xl font-bold text-teal-300">{data.parties.length}</p>
          <p className="mt-1 text-xs text-slate-400">Sellers & Purchases</p>
        </div>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        {/* Form 1: Add Party (Seller or Purchase) */}
        <form onSubmit={addParty} className="grid gap-3.5 rounded-3xl border border-white/[0.12] bg-white/[0.05] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl">
          <h3 className="font-bold text-white">Add New Party</h3>
          <Field label="Party / Business Name">
            <Input value={party.name} onChange={(value) => setParty({ ...party, name: value })} placeholder="e.g. Balaji Textiles" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Phone Number">
              <Input value={party.phone} onChange={(value) => setParty({ ...party, phone: value })} placeholder="Optional (e.g. 9876543210)" />
            </Field>
            <div className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <span>Party Type</span>
              <div className="grid min-h-11 grid-cols-2 gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] p-1 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setParty({ ...party, type: 'purchase' })}
                  className={`flex items-center justify-center rounded-lg text-xs font-bold transition ${
                    (party.type || 'purchase') === 'purchase'
                      ? 'border border-teal-500/50 bg-teal-500/30 text-teal-200 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Purchase
                </button>
                <button
                  type="button"
                  onClick={() => setParty({ ...party, type: 'seller' })}
                  className={`flex items-center justify-center rounded-lg text-xs font-bold transition ${
                    party.type === 'seller' || party.type === 'sell'
                      ? 'border border-amber-500/50 bg-amber-500/30 text-amber-200 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sell
                </button>
              </div>
            </div>
          </div>
          <button className="mt-2 min-h-11 rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition hover:from-emerald-400 hover:to-teal-500">
            Create Party Account
          </button>
        </form>

        {/* Form 2: Complete Bill & Ledger Transaction Form with Base Amount and Other Credit/Debit */}
        <form
          id="local-billing-form"
          onSubmit={addEntry}
          className={`grid gap-3.5 rounded-3xl border ${editingBillId ? 'border-amber-400/50 bg-gradient-to-br from-amber-950/25 via-white/[0.04] to-indigo-950/20' : 'border-violet-500/30 bg-gradient-to-br from-violet-950/25 via-white/[0.04] to-indigo-950/20'} p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl transition`}
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
            <Field label="Select Party">
              <select
                value={bill.partyId}
                onChange={(event) => handleBillChange('partyId', event.target.value)}
                className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white backdrop-blur-md outline-none"
              >
                {data.parties.length === 0 && <option value="">No parties yet</option>}
                {data.parties.map((item) => (
                  <option key={item.id} value={item.id} className="bg-[#111827] text-white">
                    {item.name} ({formatPartyType(item.type)})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Transaction Type">
              <select
                value={bill.type}
                onChange={(event) => handleBillChange('type', event.target.value)}
                className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white backdrop-blur-md outline-none"
              >
                <option value="debit" className="bg-[#111827] text-white">Debit</option>
                <option value="credit" className="bg-[#111827] text-white">Credit</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date">
              <input
                required
                type="date"
                value={bill.date}
                onChange={(e) => handleBillChange('date', e.target.value)}
                className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none backdrop-blur-md"
              />
            </Field>
            <Field label="Bill No">
              <input
                value={bill.billNo}
                onChange={(e) => handleBillChange('billNo', e.target.value)}
                placeholder="e.g. INV-1002"
                className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-md"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Base Amount (₹)">
              <input
                required
                type="number"
                step="any"
                value={bill.baseAmount}
                onChange={(e) => handleBillChange('baseAmount', e.target.value)}
                placeholder="0"
                className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-md"
              />
            </Field>
            <Field label="Tax Amount (₹)">
              <input
                type="number"
                step="any"
                value={bill.taxAmount}
                onChange={(e) => handleBillChange('taxAmount', e.target.value)}
                placeholder="GST / Tax (0)"
                className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-md"
              />
            </Field>
          </div>

          {/* Adv Payment & Other (Debit/Credit) Adjustment */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Adv Payment (₹)">
              <input
                type="number"
                step="any"
                value={bill.advPayment}
                onChange={(e) => handleBillChange('advPayment', e.target.value)}
                placeholder="Advance paid (0)"
                className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-md"
              />
            </Field>

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

          {/* Final Payable Amount (Auto Calculated) */}
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

          <Field label="Note / Remarks">
            <input
              value={bill.note}
              onChange={(e) => handleBillChange('note', e.target.value)}
              placeholder="Optional remarks (e.g. Delivered via truck, 30 days credit...)"
              className="min-h-11 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-md"
            />
          </Field>

          <button
            disabled={data.parties.length === 0}
            className="mt-2 min-h-11 rounded-xl border border-violet-400/40 bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
          >
            {editingBillId ? 'Save Changes (Update Bill)' : 'Post Ledger Transaction'}
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
                {selectedParty.balance >= 0 ? 'They owe you ' : 'You owe '}
                {money(Math.abs(selectedParty.balance || 0))}
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
              <p className="mt-1 text-2xl font-bold text-emerald-400">{money(selectedPartyTotalDebit)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Settled (Credit)</p>
              <p className="mt-1 text-2xl font-bold text-violet-400">{money(selectedPartyTotalCredit)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] uppercase font-bold text-slate-400">Current Balance</p>
              <p className={`mt-1 text-2xl font-bold ${selectedParty.balance >= 0 ? 'text-emerald-300' : 'text-violet-300'}`}>
                {money(Math.abs(selectedParty.balance || 0))}
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
                        <span>Base: {money(entry.baseAmount || entry.totalAmount || entry.amount || 0)}</span>
                        {Number(entry.taxAmount || 0) > 0 && <span>+ Tax: {money(entry.taxAmount)}</span>}
                        {Number(entry.other || 0) > 0 && (
                          <span className={entry.otherType === 'credit' ? 'text-amber-300' : 'text-slate-300'}>
                            {entry.otherType === 'credit' ? '+ Other' : '- Other'}: {money(entry.other)}
                          </span>
                        )}
                        {Number(entry.advPayment || 0) > 0 && <span>- Adv: {money(entry.advPayment)}</span>}
                        {entry.note && <span className="italic text-slate-400">· &quot;{entry.note}&quot;</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Final Payable</p>
                        <p className="text-lg font-bold text-emerald-400">
                          {money(entry.finalPayable || entry.amount || 0)}
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
                        onClick={() => deleteEntry(entry.id)}
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
          {data.parties.map((p) => {
            const isSelected = selectedPartyId === p.id
            const billCount = (data.ledgerEntries || []).filter((e) => e.partyId === p.id).length
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
                      deleteParty(p.id)
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
                      {p.balance >= 0 ? 'They owe you ' : 'You owe '}
                      {money(Math.abs(p.balance || 0))}
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

      {/* Bill & Transaction History */}
      <div className="mt-10">
        <h3 className="text-lg font-bold text-white">Recent Bills & Ledger History</h3>
        <p className="text-xs text-slate-400">Full audit log with bill breakdown (click Modify to edit any bill).</p>
        <div className="mt-4 grid gap-3">
          {data.ledgerEntries?.length ? (
            data.ledgerEntries.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-white/[0.12] bg-white/[0.05] p-5 shadow-sm backdrop-blur-xl transition hover:border-white/20 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      {item.partyName || data.parties.find((p) => p.id === item.partyId)?.name || 'Party'}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        item.type === 'debit'
                          ? 'border border-amber-500/30 bg-amber-500/20 text-amber-300'
                          : 'border border-teal-500/30 bg-teal-500/20 text-teal-300'
                      }`}
                    >
                      {item.type === 'debit' ? 'Debit' : 'Credit'}
                    </span>
                    {item.billNo && (
                      <span className="rounded-md border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                        Bill #{item.billNo}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>{item.date || 'Recent'}</span>
                    <span>
                      · Base: {money(item.baseAmount || item.totalAmount || item.amount || 0)}
                      {Number(item.taxAmount) > 0 && ` + Tax: ${money(item.taxAmount)}`}
                      {Number(item.other) > 0 && ` ${item.otherType === 'credit' ? '+ Other' : '- Other'}: ${money(item.other)}`}
                      {Number(item.advPayment) > 0 && ` - Adv: ${money(item.advPayment)}`}
                    </span>
                    {item.note && <span className="italic text-slate-300">({item.note})</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Final Payable</p>
                    <p className="text-lg font-bold text-emerald-400">
                      {money(item.finalPayable || item.amount || 0)}
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
                    onClick={() => deleteEntry(item.id)}
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

function AttendancePage({ data, update }) {
  const [employeeForm, setEmployeeForm] = useState({ name: '', role: '' })
  const todayDate = today()
  const [selectedDate, setSelectedDate] = useState(todayDate)
  const [wageInputs, setWageInputs] = useState({})
  const [historyFilter, setHistoryFilter] = useState('selected') // 'selected' | 'all'

  function shiftDate(days) {
    const cur = new Date(selectedDate)
    cur.setDate(cur.getDate() + days)
    setSelectedDate(cur.toISOString().slice(0, 10))
  }

  const addEmployee = (event) => {
    event.preventDefault()
    if (!employeeForm.name.trim()) return
    const next = {
      ...data,
      employees: [
        ...data.employees,
        { id: `local-employee-${Date.now()}`, name: employeeForm.name, role: employeeForm.role },
      ],
    }
    update(next, `Team member "${employeeForm.name}" added.`)
    setEmployeeForm({ name: '', role: '' })
  }

  const deleteEmployee = (employeeId) => {
    if (!window.confirm('Delete this team member? This cannot be undone.')) return
    update(
      {
        ...data,
        employees: data.employees.filter((e) => e.id !== employeeId),
        attendanceRecords: data.attendanceRecords.filter((r) => r.employeeId !== employeeId),
      },
      'Team member removed.'
    )
  }

  const mark = (employeeId, status) => {
    const currentRec = data.attendanceRecords.find((r) => r.employeeId === employeeId && r.date === selectedDate)
    const currentWage = wageInputs[employeeId] !== undefined ? Number(wageInputs[employeeId]) : Number(currentRec?.amountPaid || 0)
    const updatedRecords = localMarkAttendance(employeeId, status, selectedDate, currentWage)
    const emp = data.employees.find((e) => e.id === employeeId)
    update({ ...data, attendanceRecords: updatedRecords }, `${emp?.name || 'Staff'} marked as ${status} for ${selectedDate}.`)
  }

  const saveWage = (employeeId, manualAmount = null) => {
    const currentRec = data.attendanceRecords.find((r) => r.employeeId === employeeId && r.date === selectedDate)
    const amt = manualAmount !== null ? Number(manualAmount) : Number(wageInputs[employeeId] !== undefined ? wageInputs[employeeId] : currentRec?.amountPaid || 0)
    const updatedRecords = localMarkAttendance(employeeId, currentRec?.status || 'present', selectedDate, Math.max(0, amt))
    setWageInputs((prev) => ({ ...prev, [employeeId]: String(Math.max(0, amt)) }))
    const emp = data.employees.find((e) => e.id === employeeId)
    update({ ...data, attendanceRecords: updatedRecords }, `₹${Math.max(0, amt).toLocaleString('en-IN')} payout recorded for ${emp?.name || 'Staff'} on ${selectedDate}.`)
  }

  const deleteRecord = (recordId) => {
    if (!window.confirm('Delete this attendance entry?')) return
    update(
      { ...data, attendanceRecords: data.attendanceRecords.filter((r) => r.id !== recordId) },
      'Attendance record deleted.'
    )
  }

  const selectedDateRecords = data.attendanceRecords.filter((r) => r.date === selectedDate)
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

  const historyDisplayRecords = (historyFilter === 'selected' ? selectedDateRecords : data.attendanceRecords)
    .slice()
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

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
        <form onSubmit={addEmployee} className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] p-2.5 backdrop-blur-xl">
          <input
            required
            value={employeeForm.name}
            onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
            placeholder="Staff name"
            className="min-h-10 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-md"
          />
          <input
            value={employeeForm.role}
            onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
            placeholder="Role (e.g. Sales)"
            className="min-h-10 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-sm text-white outline-none placeholder:text-slate-500 backdrop-blur-md"
          />
          <button className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 text-xs font-bold text-white shadow-md">
            <Plus size={14} /> Add Staff
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
          <p className="mt-2 text-3xl font-bold text-violet-300">{money(totalPaidOnSelectedDate)}</p>
          <p className="mt-1 text-[11px] text-violet-300/80">Cash / wages paid</p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-3xl border border-white/[0.12] bg-white/[0.05] p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Staff</p>
          <p className="mt-2 text-3xl font-bold text-teal-300">{data.employees.length}</p>
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
          {data.employees.length > 0 ? (
            data.employees.map((employee) => {
              const record = selectedDateRecords.find((item) => item.employeeId === employee.id)
              const currentStatus = record?.status || 'none'
              const recordedAmount = Number(record?.amountPaid || 0)
              const currentInputValue = wageInputs[employee.id] !== undefined ? wageInputs[employee.id] : (recordedAmount > 0 ? String(recordedAmount) : '')

              // Lifetime wages given to this employee across all records
              const lifetimePaid = data.attendanceRecords.filter((r) => r.employeeId === employee.id).reduce((sum, r) => sum + Number(r.amountPaid || 0), 0)

              return (
                <div
                  key={employee.id}
                  className="rounded-3xl border border-white/[0.12] bg-white/[0.05] p-5 shadow-md backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    {/* Staff info */}
                    <div className="min-w-48">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-white">{employee.name}</p>
                        <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300">
                          {employee.role || 'Team member'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        All-time payouts recorded: <span className="font-semibold text-emerald-400">{money(lifetimePaid)}</span>
                      </p>
                    </div>

                    {/* One-click attendance buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => mark(employee.id, 'present')}
                        className={`min-h-11 rounded-xl border px-4 text-xs font-bold backdrop-blur-md transition ${
                          currentStatus === 'present'
                            ? 'border-emerald-400/40 bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                            : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                        }`}
                      >
                        ✓ Present
                      </button>
                      <button
                        type="button"
                        onClick={() => mark(employee.id, 'half-day')}
                        className={`min-h-11 rounded-xl border px-4 text-xs font-bold backdrop-blur-md transition ${
                          currentStatus === 'half-day'
                            ? 'border-amber-400/40 bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                            : 'border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                        }`}
                      >
                        ⏳ Half-day
                      </button>
                      <button
                        type="button"
                        onClick={() => mark(employee.id, 'absent')}
                        className={`min-h-11 rounded-xl border px-4 text-xs font-bold backdrop-blur-md transition ${
                          currentStatus === 'absent'
                            ? 'border-rose-400/40 bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                            : 'border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                        }`}
                      >
                        ✕ Absent
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEmployee(employee.id)}
                        className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-rose-300 transition hover:bg-rose-500/20"
                        title="Delete employee"
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
                            {money(recordedAmount)} Saved
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
                          onChange={(e) => setWageInputs({ ...wageInputs, [employee.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              saveWage(employee.id)
                            }
                          }}
                          className="min-h-9 w-28 rounded-xl border border-white/15 bg-black/40 pl-7 pr-2 text-xs font-bold text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => saveWage(employee.id)}
                        className="min-h-9 rounded-xl border border-violet-400/40 bg-gradient-to-r from-violet-600 to-indigo-600 px-3 text-xs font-bold text-white shadow transition hover:from-violet-500 hover:to-indigo-500"
                      >
                        Save ₹
                      </button>

                      {/* Quick preset chips */}
                      <button
                        type="button"
                        onClick={() => saveWage(employee.id, 300)}
                        className="min-h-9 rounded-xl border border-white/10 bg-white/[0.05] px-2.5 text-[11px] font-semibold text-slate-300 hover:bg-white/10"
                      >
                        +₹300
                      </button>
                      <button
                        type="button"
                        onClick={() => saveWage(employee.id, 500)}
                        className="min-h-9 rounded-xl border border-white/10 bg-white/[0.05] px-2.5 text-[11px] font-semibold text-slate-300 hover:bg-white/10"
                      >
                        +₹500
                      </button>
                      <button
                        type="button"
                        onClick={() => saveWage(employee.id, 1000)}
                        className="min-h-9 rounded-xl border border-white/10 bg-white/[0.05] px-2.5 text-[11px] font-semibold text-slate-300 hover:bg-white/10"
                      >
                        +₹1000
                      </button>
                      {recordedAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => saveWage(employee.id, 0)}
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
              All Recorded Dates ({data.attendanceRecords.length})
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {historyDisplayRecords.length > 0 ? (
            historyDisplayRecords.map((rec) => {
              const emp = data.employees.find((e) => e.id === rec.employeeId)
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
                        {money(rec.amountPaid || 0)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteRecord(rec.id)}
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

function ScanPage({ data, update }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [busy, setBusy] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [extracted, setExtracted] = useState(null)

  const [fields, setFields] = useState({
    partyName: '',
    partyType: 'purchase',
    billNo: '',
    date: today(),
    type: 'debit',
    baseAmount: '',
    taxAmount: '',
    other: '',
    otherType: 'credit', // 'credit' (+ adds like 2% TCS), 'debit' (- deducts)
    advPayment: '',
    finalPayable: '',
    note: '',
  })

  const handleFileChange = (selected) => {
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

  const handleFieldChange = (key, val) => {
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

  const extract = async (event) => {
    event.preventDefault()
    if (!file) return
    setBusy(true)

    let extData = null

    // 1. Try backend /api/scan endpoint first (runs AI analysis + high-precision invoice analyzer)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const json = await res.json()
        if (json.extracted) {
          extData = json.extracted
        }
      }
    } catch (apiErr) {
      console.warn('/api/scan request error:', apiErr)
    }

    // 2. Offline fallback using dedicated invoice analyzer
    if (!extData) {
      extData = analyzeInvoiceText('', file.name)
    }

    setExtracted(extData)
    setFields({
      partyName: extData.partyName || (data.parties[0]?.name || 'Commercial Vendor'),
      partyType: extData.partyType || 'purchase',
      billNo: extData.billNo || `INV-${Date.now().toString().slice(-4)}`,
      date: extData.date || today(),
      type: extData.type || 'debit',
      baseAmount: extData.baseAmount ? String(extData.baseAmount) : '',
      taxAmount: extData.taxAmount ? String(extData.taxAmount) : '',
      other: extData.other ? String(extData.other) : '',
      otherType: extData.otherType || 'credit',
      advPayment: extData.advPayment ? String(extData.advPayment) : '',
      finalPayable: extData.finalPayable ? String(extData.finalPayable) : (extData.amount ? String(extData.amount) : ''),
      note: extData.description || extData.note || '',
    })
    setBusy(false)
  }

  const save = () => {
    if (!fields.partyName.trim()) return
    const payable = parseFloat(fields.finalPayable) || parseFloat(fields.baseAmount) || 0
    if (payable <= 0) return

    let targetParty = data.parties.find(
      (p) => p.name.trim().toLowerCase() === fields.partyName.trim().toLowerCase()
    )
    let updatedParties = [...data.parties]

    if (!targetParty) {
      targetParty = {
        id: `local-party-${Date.now()}`,
        name: fields.partyName.trim(),
        type: fields.partyType || 'purchase',
        balance: 0,
      }
      updatedParties.push(targetParty)
    }

    const base = parseFloat(fields.baseAmount) || payable
    const tax = parseFloat(fields.taxAmount) || 0
    const oth = parseFloat(fields.other) || 0
    const adv = parseFloat(fields.advPayment) || 0

    const newEntry = {
      id: `local-scan-${Date.now()}`,
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

    // Update party balance
    updatedParties = updatedParties.map((p) =>
      p.id === targetParty.id
        ? { ...p, balance: Number(p.balance || 0) + (fields.type === 'debit' ? payable : -payable) }
        : p
    )

    update(
      {
        ...data,
        parties: updatedParties,
        ledgerEntries: [newEntry, ...data.ledgerEntries],
      },
      `Bill #${fields.billNo || 'Record'} saved to ledger for ${targetParty.name}!`
    )
    setSavedSuccess(true)
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-violet-400">AI Document Extraction</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">Smart Bill Scan</h2>
          <p className="mt-1 text-sm text-slate-400">
            Upload or snap any invoice/receipt to automatically extract details into your business ledger.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-300">
            <Sparkles size={14} /> Smart AI Scanner
          </span>
        </div>
      </div>

      {/* Glass Upload Card */}
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

        <form onSubmit={extract} className="mt-6 grid gap-4">
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
                  onClick={save}
                  className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-lg backdrop-blur-md transition hover:from-emerald-400 hover:to-teal-500"
                >
                  <Check size={18} />
                  <span>Confirm & Save to Ledger</span>
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
          ['Real-time Daily Books', 'Log transactions, purchases, inventory changes, and employee hours as they occur.'],
          ['Clear Balance Clarity', 'Positive balance indicates receivables (owed to you). Negative balance indicates payable obligations.'],
          ['Human-in-the-Loop AI', 'Smart Bill Scan assists your paperwork workflow while keeping total control with you.'],
        ].map(([heading, body]) => (
          <div key={heading} className="rounded-3xl border border-white/[0.12] bg-white/[0.05] p-6 shadow-sm backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white">{heading}</h3>
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
            {(user.displayName || 'A').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{user.displayName}</h3>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
        <Button onClick={logout} variant="secondary" className="mt-7">
          <LogOut size={16} /> Sign out of Workspace
        </Button>
      </div>
    </div>
  )
}
