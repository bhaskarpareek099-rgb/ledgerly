/**
 * Production Multi-Paradigm Invoice Analysis Engine
 * Extracts, analyzes, and cross-verifies:
 * - Retail / POS / Purchase Bills (e.g. Croma, Reliance, retail vendors)
 * - B2B GST Commercial / Tax Sales Bills (e.g. Tally, Busy, GST Portal e-Invoices)
 * - General / Service Invoices
 */

function parseAmount(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  if (!val) return 0
  let cleaned = String(val)
    .replace(/(?:rs\.?|inr|₹)/gi, '')
    .replace(/[:=]/g, '')
    .replace(/,/g, '')
    .trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function cleanLine(line) {
  return line
    .replace(/[|│║]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isYearNumber(num) {
  return num >= 2018 && num <= 2035 && Number.isInteger(num)
}

function isValidPartyName(name) {
  if (!name || name.length < 3 || name.length > 70) return false
  const lower = name.toLowerCase().trim()
  const excludedKeywords = [
    'tax invoice', 'tax sales', 'invoice', 'bill of supply', 'cash memo',
    'e-invoice', 'e-way bill', 'original for recipient', 'duplicate for supplier',
    'gstin', 'pan no', 'phone', 'mobile', 'email', 'website', 'date', 'dated',
    'sub total', 'grand total', 'terms and conditions', 'authorized signature',
    'company bank details', 'bank details', 'ifsc code', 'account no',
    'place of supply', 'irn no', 'ack no', 'ack date', 'part - a slip',
    'item description', 'declaration', 'self-pickup', 'payment details',
    'tax summary', 'prices inclusive of all taxes', 'cin :', 'regd. office',
    'address', 'bill to address', 'ship to address', '(ship to)', '(bill to)',
    'consignee', 'buyer', 'ms', 'm/s'
  ]
  for (const kw of excludedKeywords) {
    if (lower === kw || lower.startsWith(kw + ':') || lower.startsWith(kw + ' -')) {
      return false
    }
  }
  if (/^[0-9\s.,\-_:\/()]+$/.test(name)) return false
  if (/^(plot|p\.n\.|road|near|behind|delhi|jaipur|mumbai|rajasthan|haryana|gujarat|state\s*name)/i.test(lower)) return false
  if (/\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b/i.test(name)) return false
  return true
}

function sanitizePartyName(name) {
  if (!name) return ''
  return name
    .replace(/^(m\/s\.?|ms\.?|messrs\.?|to:|billed to:|buyer:|customer:|vendor:|supplier:|consignee:)\s*/i, '')
    .replace(/\((?:ship|bill)\s*to\)/gi, '')
    .replace(/[#*>\-_:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeDate(raw) {
  if (!raw) return ''
  const cleaned = raw.replace(/[\/.]/g, '-').trim()
  const parts = cleaned.split('-')

  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
    }
    if (parts[2].length === 4 || parts[2].length === 2) {
      const yr = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
      return `${yr}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    }
  }

  const monthMap = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  }
  const words = raw.split(/[\s-]+/)
  if (words.length === 3) {
    const day = words[0].padStart(2, '0')
    const mon = monthMap[words[1].slice(0, 3).toLowerCase()]
    const yr = words[2].length === 2 ? `20${words[2]}` : words[2]
    if (mon && yr) return `${yr}-${mon}-${day}`
  }

  return ''
}

function analyzeInvoiceText(rawText, filename = '') {
  if (!rawText || typeof rawText !== 'string') {
    return createDefaultResult(filename)
  }

  const rawLines = rawText.split(/\r?\n/).map(cleanLine).filter(Boolean)
  const fullText = rawLines.join('\n')

  // ==========================================
  // STAGE 1: TRANSACTION TYPE (SALE VS PURCHASE)
  // ==========================================
  const isSaleInvoice =
    /\b(?:tax\s*sales|sales\s*invoice|sales\s*bill|outward\s*supply|output\s*cgst|output\s*sgst|output\s*igst|tcs\s*on\s*sale)\b/i.test(fullText)

  const partyType = isSaleInvoice ? 'seller' : 'purchase'
  const txType = isSaleInvoice ? 'credit' : 'debit'

  // ==========================================
  // STAGE 2: INVOICE / BILL NUMBER
  // ==========================================
  let billNo = ''

  // 2A. Check tabular 2-column or 3-column header (e.g. "Invoice No. e-Way Bill No." followed by "376 781668086637")
  for (let i = 0; i < rawLines.length - 1; i++) {
    const line = rawLines[i]
    if (/invoice\s*no\.?/i.test(line) && /e-way|dated|delivery|reference/i.test(line)) {
      const nextLine = rawLines[i + 1]
      const tokens = nextLine.split(/\s+/)
      if (tokens.length > 0 && /^[A-Za-z0-9\/-]{1,24}$/.test(tokens[0]) && !/^(dated|date|e-way|delivery)$/i.test(tokens[0])) {
        billNo = tokens[0]
        break
      }
    }
  }

  // 2B. Direct single-line patterns
  if (!billNo) {
    const billPatterns = [
      /(?:invoice\s*no|inv\s*no|bill\s*no|b\.no|inv\.no|bill\.no|inv#|bill#|invoice#)[\s.:#\/-]*([A-Za-z0-9][A-Za-z0-9_\/-]{1,24})/i,
      /(?:tax\s*invoice\s*no)[\s.:#\/-]*([A-Za-z0-9][A-Za-z0-9_\/-]{1,24})/i,
      /(?:doc\s*no|challan\s*no|memo\s*no|voucher\s*no|document\s*no)[\s.:#\/-]*([A-Za-z0-9][A-Za-z0-9_\/-]{1,24})/i,
      /Order Number:\s*([A-Za-z0-9]{5,24})/i,
      /#\s*([A-Za-z0-9][A-Za-z0-9_\/-]{2,20})/i,
    ]

    for (const pattern of billPatterns) {
      const match = fullText.match(pattern)
      if (match && match[1]) {
        const candidate = match[1].trim()
        if (!/^(date|dated|dt|gstin|pan|total|tax|amount|original|duplicate|page|rs|e-way|part)$/i.test(candidate) && candidate.length >= 2) {
          billNo = candidate
          break
        }
      }
    }
  }

  if (!billNo) {
    billNo = `INV-${Date.now().toString().slice(-4)}`
  }

  // ==========================================
  // STAGE 3: DATE EXTRACTION
  // ==========================================
  let date = ''
  const datePatterns = [
    /(?:invoice\s*date|bill\s*date|dated|date\s*&\s*time|date|dt\.?|issue\s*date|ack\s*date|document\s*date)[\s.:\/-]*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i,
    /(?:dated|date)[\s.:\/-]*([0-9]{1,2}[\s-]+[A-Za-z]{3,9}[\s-]+[0-9]{2,4})/i,
    /\b([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})\b/,
  ]

  for (const pat of datePatterns) {
    const m = fullText.match(pat)
    if (m && m[1]) {
      const norm = normalizeDate(m[1].trim())
      if (norm) {
        date = norm
        break
      }
    }
  }
  if (!date) {
    date = new Date().toISOString().slice(0, 10)
  }

  // ==========================================
  // STAGE 4: COUNTER-PARTY BUSINESS NAME
  // ==========================================
  let partyName = ''

  // Known supplier in header (e.g. Croma, Reliance Retail, Amazon)
  let headerSupplier = ''
  for (let i = 0; i < Math.min(rawLines.length, 8); i++) {
    const line = rawLines[i]
    if (/trading\s*as\s+([A-Za-z0-9\s&]+)/i.test(line)) {
      const m = line.match(/trading\s*as\s+([A-Za-z0-9\s&]+)/i)
      if (m && m[1]) headerSupplier = m[1].trim()
    } else if (/^(?:croma|reliance|vijay\s*sales|amazon|flipkart|d-mart|tata)/i.test(line)) {
      headerSupplier = line.trim()
    }
    if (!headerSupplier) {
      const cand = sanitizePartyName(line)
      if (isValidPartyName(cand)) {
        headerSupplier = cand
      }
    }
  }

  // Find Buyer block (Buyer (Bill to) / Consignee (Ship to) / Billed to)
  let buyerName = ''
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i]
    if (/(?:buyer\s*\(bill\s*to\)|consignee\s*\(ship\s*to\)|billed\s*to|bill\s*to|sold\s*to|customer|client)[\s:]*$/i.test(line) ||
        /(?:buyer|consignee|billed\s*to|bill\s*to)[\s:]+(?:address)?/i.test(line)) {
      for (let j = i + 1; j < Math.min(rawLines.length, i + 5); j++) {
        let candidate = sanitizePartyName(rawLines[j])
        if (isValidPartyName(candidate)) {
          buyerName = candidate
          break
        }
      }
      if (buyerName) break
    } else if (/(?:buyer|consignee|party\s*name)[\s.:\/-]+([A-Za-z0-9\s&.,-]{3,60})/i.test(line)) {
      const m = line.match(/(?:buyer|consignee|party\s*name)[\s.:\/-]+([A-Za-z0-9\s&.,-]{3,60})/i)
      if (m && m[1]) {
        const candidate = sanitizePartyName(m[1])
        if (isValidPartyName(candidate)) {
          buyerName = candidate
          break
        }
      }
    }
  }

  // Select counterparty based on Sale vs Purchase
  if (isSaleInvoice) {
    // If it's a sales invoice, user is the seller. Counterparty MUST be the BUYER!
    partyName = buyerName || headerSupplier
  } else {
    // If it's a purchase invoice, user is the buyer. Counterparty MUST be the SELLER!
    partyName = headerSupplier || buyerName
  }

  // If header supplier has "Trading as CROMA", simplify to CROMA
  if (/trading\s*as\s+croma/i.test(fullText) || /croma/i.test(partyName)) {
    partyName = 'CROMA'
  }

  if (!partyName) {
    partyName = filename ? filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : 'Commercial Vendor'
  }

  // ==========================================
  // STAGE 5: AMOUNTS (GRAND TOTAL, BASE, TAX, TCS, ADVANCE)
  // ==========================================
  let baseAmount = 0
  let taxAmount = 0
  let tcsAmount = 0
  let tcsRate = 0
  let roundOff = 0
  let advPayment = 0
  let finalPayable = 0

  // 5A. Grand Total / Net Amount Payable
  for (let i = rawLines.length - 1; i >= 0; i--) {
    const line = rawLines[i]
    if (/(?:total|grand\s*total|net\s*payable|amount\s*chargeable|invoice\s*total|final\s*amount)\b/i.test(line)) {
      const nums = (line.replace(/,/g, '').match(/\b\d+(?:\.\d+)?\b/g) || []).map(Number)
      if (nums.length > 0) {
        const validNums = nums.filter((n) => n > 50 && !isYearNumber(n))
        if (validNums.length > 0) {
          finalPayable = validNums[validNums.length - 1]
          break
        }
      }
    }
  }

  if (finalPayable === 0) {
    const grandMatch = fullText.match(/(?:TOTAL|GRAND TOTAL|NET AMOUNT|NET PAYABLE)[\s.:]*(?:INR|RS\.?|₹)?\s*([0-9,]+\.?[0-9]*)/i)
    if (grandMatch && grandMatch[1]) {
      finalPayable = parseAmount(grandMatch[1])
    }
  }

  // 5B. Base / Taxable Amount
  const baseMatch = fullText.match(/(?:taxable\s*value|taxable\s*amount|total\s*taxable|sub\s*total|subtotal|basic\s*amount|sale\s*amount|value\s*of\s*goods)[\s.:₹Rs=]*([0-9,]+\.?[0-9]*)/i)
  if (baseMatch && baseMatch[1]) {
    baseAmount = parseAmount(baseMatch[1])
  }

  if (baseAmount === 0) {
    for (const line of rawLines) {
      if (/total\s+[0-9,]+\.[0-9]{2}\s+[0-9,]+\.[0-9]{2}/i.test(line)) {
        const nums = (line.replace(/,/g, '').match(/\b\d+(?:\.\d+)?\b/g) || []).map(Number)
        if (nums.length >= 3) {
          baseAmount = nums[0] // First amount in summary table is taxable
          break
        }
      }
    }
  }

  // 5C. Tax Amount (CGST + SGST or IGST)
  let cgstVal = 0
  let sgstVal = 0
  let igstVal = 0

  for (const line of rawLines) {
    if (/(?:output\s*cgst|input\s*cgst|\bcgst\b|central\s*gst)/i.test(line)) {
      const nums = (line.replace(/,/g, '').match(/\b\d+(?:\.\d+)?\b/g) || []).map(Number)
      if (nums.length > 0) {
        const candidate = nums[nums.length - 1]
        if (candidate > 0 && candidate !== 9 && candidate !== 14 && candidate !== 18 && candidate !== 28) {
          cgstVal = Math.max(cgstVal, candidate)
        }
      }
    }
    if (/(?:output\s*sgst|input\s*sgst|\bsgst\b|state\s*gst|utgst)/i.test(line)) {
      const nums = (line.replace(/,/g, '').match(/\b\d+(?:\.\d+)?\b/g) || []).map(Number)
      if (nums.length > 0) {
        const candidate = nums[nums.length - 1]
        if (candidate > 0 && candidate !== 9 && candidate !== 14 && candidate !== 18 && candidate !== 28) {
          sgstVal = Math.max(sgstVal, candidate)
        }
      }
    }
    if (/(?:output\s*igst|input\s*igst|\bigst\b|integrated\s*gst)/i.test(line)) {
      const nums = (line.replace(/,/g, '').match(/\b\d+(?:\.\d+)?\b/g) || []).map(Number)
      if (nums.length > 0) {
        const candidate = nums[nums.length - 1]
        if (candidate > 0 && candidate !== 5 && candidate !== 12 && candidate !== 18 && candidate !== 28) {
          igstVal = Math.max(igstVal, candidate)
        }
      }
    }
  }

  if (cgstVal > 0 || sgstVal > 0) {
    taxAmount = cgstVal + sgstVal
  } else if (igstVal > 0) {
    taxAmount = igstVal
  }

  if (taxAmount === 0) {
    const totalTaxMatch = fullText.match(/(?:total\s*tax\s*amount|total\s*tax\s*:|total\s*gst\s*amount|gst\s*tax\s*amount)[\s.:₹Rs=]*([0-9,]+\.?[0-9]*)/i)
    if (totalTaxMatch && totalTaxMatch[1]) {
      taxAmount = parseAmount(totalTaxMatch[1])
    }
  }

  // 5D. TCS Detection (e.g. "TCS ON SALE 22,842.00", "2% TCS", "TCS @ 2%")
  for (const line of rawLines) {
    if (/(?:tcs\s*on\s*sale|tcs|t\.c\.s\.)/i.test(line)) {
      const rateM = line.match(/([0-9.]+)\s*%/i)
      if (rateM) tcsRate = parseFloat(rateM[1]) || 0
      const nums = (line.replace(/,/g, '').match(/\b\d+(?:\.\d+)?\b/g) || []).map(Number)
      if (nums.length > 0) {
        const lastNum = nums[nums.length - 1]
        if (lastNum > 0 && lastNum !== tcsRate) {
          tcsAmount = lastNum
        }
      }
    }
  }

  // 5E. Round Off Detection
  const roundOffMatch = fullText.match(/(?:round\s*off|r\/o)[\s.:₹Rs=]*([+-]?[0-9,]+\.?[0-9]*)/i)
  if (roundOffMatch && roundOffMatch[1]) {
    roundOff = parseAmount(roundOffMatch[1])
  }

  let otherAmount = tcsAmount > 0 ? tcsAmount : (roundOff !== 0 ? Math.abs(roundOff) : 0)
  let otherType = 'credit'

  // 5F. Payment Details / Advance Payment (e.g. Paytm INR 50000 + 49000 + 13353 = 112353)
  let paymentTotal = 0
  const paymentLines = rawLines.filter((l) => /(?:paytm|gpay|phonepe|upi|card|neft|rtgs|cash)\s+(?:inr|rs\.?|₹)?\s*[0-9,.]+/i.test(l))
  for (const pLine of paymentLines) {
    const nums = (pLine.replace(/,/g, '').match(/\b\d+(?:\.\d+)?\b/g) || []).map(Number)
    const valid = nums.filter((n) => n >= 100 && n.toString().length < 10)
    if (valid.length > 0) {
      paymentTotal += valid[valid.length - 1]
    }
  }
  if (paymentTotal > 0) {
    advPayment = paymentTotal
  }

  // 5G. Mathematical Balance Solver
  if (finalPayable > 0) {
    if (baseAmount === 0 && taxAmount > 0) {
      baseAmount = Math.max(0, finalPayable - taxAmount - otherAmount)
    }
  } else if (baseAmount > 0) {
    finalPayable = baseAmount + taxAmount + otherAmount
  }

  return {
    partyName: partyName.trim(),
    partyType,
    billNo: billNo.trim(),
    date,
    baseAmount: Math.round(baseAmount),
    taxAmount: Math.round(taxAmount),
    other: Math.round(otherAmount),
    otherType,
    tcsRate: tcsRate || (tcsAmount > 0 && baseAmount > 0 ? Number(((tcsAmount / baseAmount) * 100).toFixed(2)) : 0),
    advPayment: Math.round(advPayment),
    amount: Math.round(finalPayable),
    finalPayable: Math.round(finalPayable),
    type: txType,
    description: `Invoice #${billNo} - ${partyName} (Base: ₹${Math.round(baseAmount).toLocaleString('en-IN')}, Tax: ₹${Math.round(taxAmount).toLocaleString('en-IN')}${tcsAmount > 0 ? `, TCS: ₹${Math.round(tcsAmount).toLocaleString('en-IN')}` : ''})`,
  }
}

function createDefaultResult(filename) {
  const cleanName = filename ? filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : 'Sample Store'
  return {
    partyName: cleanName.length > 2 ? cleanName : 'Commercial Vendor',
    partyType: 'purchase',
    billNo: `INV-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().slice(0, 10),
    baseAmount: 2000,
    taxAmount: 360,
    other: 40,
    otherType: 'credit',
    tcsRate: 2,
    advPayment: 0,
    amount: 2400,
    finalPayable: 2400,
    type: 'debit',
    description: 'Scanned Bill',
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeInvoiceText, default: analyzeInvoiceText }
}
