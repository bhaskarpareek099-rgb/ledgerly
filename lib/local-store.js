export const LOCAL_USER_KEY = 'ledgerly_local_user'
export const LOCAL_DATA_KEY = 'ledgerly_local_data'

const initialData = {
  profile: { businessName: 'Asha Home Goods' },
  items: [
    { id: 'item-1', name: 'Cotton Tote Bag', category: 'Bags', quantity: 24, costPrice: 180, sellingPrice: 320, lowStockThreshold: 8 },
    { id: 'item-2', name: 'Brass Planter', category: 'Home decor', quantity: 6, costPrice: 650, sellingPrice: 1150, lowStockThreshold: 8 },
  ],
  parties: [
    { id: 'party-1', name: 'Meera Living', phone: '9876543210', type: 'purchase', balance: 12400 },
    { id: 'party-2', name: 'Greenleaf Supplies', phone: '9812345678', type: 'purchase', balance: -6800 },
  ],
  ledgerEntries: [
    { id: 'entry-1', partyId: 'party-1', type: 'debit', amount: 12400, note: 'Opening balance', date: new Date().toISOString().slice(0, 10), source: 'manual' },
  ],
  employees: [
    { id: 'employee-1', name: 'Ravi Kumar', role: 'Store manager' },
    { id: 'employee-2', name: 'Nisha Shah', role: 'Sales' },
  ],
  attendanceRecords: [
    { id: 'attendance-1', employeeId: 'employee-1', date: new Date().toISOString().slice(0, 10), status: 'present' },
  ],
  stockLogs: [],
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function getLocalData() {
  if (typeof window === 'undefined') return clone(initialData)
  const raw = window.localStorage.getItem(LOCAL_DATA_KEY)
  if (!raw) {
    window.localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(initialData))
    return clone(initialData)
  }
  try {
    return JSON.parse(raw)
  } catch {
    return clone(initialData)
  }
}

export function setLocalData(data) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(data))
  }
  return data
}

export function getLocalUser() {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_USER_KEY) || 'null')
  } catch {
    return null
  }
}

export function setLocalUser(user) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user))
  }
  return user
}

export function clearLocalUser() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(LOCAL_USER_KEY)
  }
}

function dashboard(data) {
  const today = new Date().toISOString().slice(0, 10)
  return {
    metrics: {
      stockValue: data.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.costPrice || 0), 0),
      lowStock: data.items.filter((item) => Number(item.quantity || 0) <= Number(item.lowStockThreshold || 0)).length,
      receivables: data.parties.filter((party) => party.balance > 0).reduce((sum, party) => sum + party.balance, 0),
      payables: Math.abs(data.parties.filter((party) => party.balance < 0).reduce((sum, party) => sum + party.balance, 0)),
      attendancePresent: data.attendanceRecords.filter((record) => record.date === today && record.status === 'present').length,
      attendanceTotal: data.employees.length,
    },
    activity: Array.from({ length: 7 }, (_, index) => ({
      date: index,
      count: Math.max(0, data.ledgerEntries.length - 1 + (index % 3)),
    })),
  }
}

export function localRequest(pathname, options = {}) {
  const data = getLocalData()
  const [collection, recordId] = pathname.split('/')
  if (collection === 'dashboard') return dashboard(data)
  if (collection === 'scan') {
    return {
      extracted: {
        partyName: data.parties[0]?.name || 'Standard Trade Co',
        partyType: 'purchase',
        billNo: `INV-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().slice(0, 10),
        baseAmount: 2080,
        taxAmount: 370,
        amount: 2450,
        finalPayable: 2450,
        type: 'debit',
        description: 'Scanned Invoice #1024',
      },
      source: 'scan',
    }
  }

  if (options.method === 'POST') {
    const body = options.body instanceof FormData ? {} : JSON.parse(options.body || '{}')
    const record = { ...body, id: `local-${collection}-${Date.now()}` }
    if (collection === 'attendanceRecords' && record.employeeId) {
      const recDate = record.date || new Date().toISOString().slice(0, 10)
      const existing = data.attendanceRecords.find((r) => r.employeeId === record.employeeId && r.date === recDate)
      if (existing) {
        if (record.status !== undefined) existing.status = record.status
        if (record.amountPaid !== undefined) existing.amountPaid = Number(record.amountPaid || 0)
        if (record.note !== undefined) existing.note = record.note
        setLocalData(data)
        return existing
      }
      record.date = recDate
      record.amountPaid = Number(record.amountPaid || 0)
    }
    if (collection === 'parties') record.balance = 0
    data[collection] = [...(data[collection] || []), record]
    if (collection === 'ledgerEntries' && record.partyId) {
      const party = data.parties.find((item) => item.id === record.partyId)
      if (party) {
        const amt = Number(record.finalPayable !== undefined ? record.finalPayable : record.amount || 0)
        party.balance = Number(party.balance || 0) + (record.type === 'credit' ? -amt : amt)
      }
    }
    if (collection === 'stockLogs' && record.itemId) {
      const item = data.items.find((entry) => entry.id === record.itemId)
      if (item) {
        item.quantity = Math.max(0, Number(item.quantity || 0) + (record.type === 'out' ? -Number(record.quantity || 0) : Number(record.quantity || 0)))
      }
    }
    setLocalData(data)
    return record
  }

  if (options.method === 'PUT') {
    const body = options.body instanceof FormData ? {} : JSON.parse(options.body || '{}')
    const list = data[collection] || []
    const index = list.findIndex((item) => item.id === recordId)
    if (index === -1) throw new Error('Record not found')
    const previous = list[index]
    const updated = { ...previous, ...body, id: recordId }
    if (collection === 'ledgerEntries') {
      const prevParty = data.parties?.find((p) => p.id === previous.partyId)
      if (prevParty) {
        const prevAmt = Number(previous.finalPayable !== undefined ? previous.finalPayable : previous.amount || 0)
        prevParty.balance = Number(prevParty.balance || 0) - (previous.type === 'debit' ? prevAmt : -prevAmt)
      }
      const nextParty = data.parties?.find((p) => p.id === (updated.partyId || previous.partyId))
      if (nextParty) {
        const nextAmt = Number(updated.finalPayable !== undefined ? updated.finalPayable : updated.amount || 0)
        nextParty.balance = Number(nextParty.balance || 0) + ((updated.type || previous.type) === 'debit' ? nextAmt : -nextAmt)
      }
    }
    list[index] = updated
    data[collection] = list
    setLocalData(data)
    return updated
  }

  if (options.method === 'DELETE') {
    if (collection === 'ledgerEntries') {
      const target = (data.ledgerEntries || []).find((r) => r.id === recordId)
      if (target) {
        const party = (data.parties || []).find((p) => p.id === target.partyId)
        if (party) {
          const amt = Number(target.finalPayable !== undefined ? target.finalPayable : target.amount || 0)
          party.balance = Number(party.balance || 0) - (target.type === 'debit' ? amt : -amt)
        }
      }
    }
    data[collection] = (data[collection] || []).filter((record) => record.id !== recordId)
    setLocalData(data)
    return { deleted: true, id: recordId }
  }

  return data[collection] || []
}

export function localMarkAttendance(employeeId, status, date, amountPaid, note) {
  const data = getLocalData()
  const targetDate = date || new Date().toISOString().slice(0, 10)
  const existing = data.attendanceRecords.find((record) => record.employeeId === employeeId && record.date === targetDate)
  if (existing) {
    if (status !== undefined) existing.status = status
    if (amountPaid !== undefined) existing.amountPaid = Number(amountPaid)
    if (note !== undefined) existing.note = note
  } else {
    data.attendanceRecords.push({
      id: `local-attendance-${Date.now()}`,
      employeeId,
      date: targetDate,
      status: status || 'present',
      amountPaid: Number(amountPaid || 0),
      note: note || '',
    })
  }
  setLocalData(data)
  return data.attendanceRecords
}
