import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'
import { adminDb, requireUser } from '@/lib/firebase/admin'
import { analyzeInvoiceText } from '@/lib/invoice-analyzer'

export const runtime = 'nodejs'

const collections = new Set(['items', 'stockLogs', 'parties', 'ledgerEntries', 'employees', 'attendanceRecords'])
const now = () => new Date().toISOString()
const id = () => crypto.randomUUID()
const responseError = (message, status = 400) => NextResponse.json({ error: message }, { status })

function ensureAdmin() {
  if (!adminDb) throw new Error('FIREBASE_ADMIN_NOT_CONFIGURED')
}

function cleanCollectionDoc(snapshot) {
  const data = snapshot.data() || {}
  return { id: snapshot.id, ...data }
}

async function readBody(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

async function userAndPath(request, context) {
  const decoded = await requireUser(request)
  const segments = (await context.params)?.path || []
  return { decoded, segments }
}

async function dashboard(decoded) {
  const ownerId = decoded.uid
  const [items, parties, attendance, ledger] = await Promise.all([
    adminDb.collection('items').where('ownerId', '==', ownerId).get(),
    adminDb.collection('parties').where('ownerId', '==', ownerId).get(),
    adminDb.collection('attendanceRecords').where('ownerId', '==', ownerId).get(),
    adminDb.collection('ledgerEntries').where('ownerId', '==', ownerId).get(),
  ])
  const itemRows = items.docs.map(cleanCollectionDoc)
  const partyRows = parties.docs.map(cleanCollectionDoc)
  const attendanceRows = attendance.docs.filter((entry) => entry.data().date === new Date().toISOString().slice(0, 10))
  const activity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const key = date.toISOString().slice(0, 10)
    return {
      date: key,
      count: ledger.docs.filter((entry) => String(entry.data().date || '').slice(0, 10) === key).length,
    }
  })
  return {
    metrics: {
      stockValue: itemRows.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.costPrice || 0), 0),
      lowStock: itemRows.filter((item) => Number(item.quantity || 0) <= Number(item.lowStockThreshold || 0)).length,
      receivables: partyRows.filter((party) => Number(party.balance || 0) > 0).reduce((sum, party) => sum + Number(party.balance || 0), 0),
      payables: Math.abs(partyRows.filter((party) => Number(party.balance || 0) < 0).reduce((sum, party) => sum + Number(party.balance || 0), 0)),
      attendancePresent: attendanceRows.filter((entry) => entry.data().status === 'present').length,
      attendanceTotal: attendanceRows.length,
    },
    activity,
  }
}

export async function GET(request, context) {
  try {
    const segments = (await context.params)?.path || []
    if (segments.join('/') === 'health') return NextResponse.json({ ok: true, service: 'ledgerly' })
    if (segments[0] === 'gemini-key') return NextResponse.json({ hasKey: Boolean(process.env.GEMINI_API_KEY) })
    const knownRoute = ['dashboard', 'profile'].includes(segments[0]) || collections.has(segments[0])
    if (!knownRoute) return responseError('API route not found', 404)
    ensureAdmin()
    const { decoded } = await userAndPath(request, context)
    if (segments[0] === 'dashboard') return NextResponse.json(await dashboard(decoded))
    if (segments[0] === 'profile') {
      const profile = await adminDb.collection('users').doc(decoded.uid).get()
      return NextResponse.json(profile.exists ? cleanCollectionDoc(profile) : { uid: decoded.uid, email: decoded.email || '' })
    }
    const collection = segments[0]
    const snapshot = await adminDb.collection(collection).where('ownerId', '==', decoded.uid).get()
    let rows = snapshot.docs.map(cleanCollectionDoc)
    if (segments[1]) rows = rows.filter((row) => row.id === segments[1])
    return NextResponse.json(segments[1] ? rows[0] || null : rows)
  } catch (error) {
    const message = error?.message || ''
    if (message === 'UNAUTHENTICATED') return responseError('Please sign in to continue.', 401)
    if (message === 'FIREBASE_ADMIN_NOT_CONFIGURED') return responseError('Firebase Admin is not configured. Add the server credentials to .env.local.', 503)
    console.error('Ledgerly GET error', error)
    return responseError('We could not load this workspace right now.', 500)
  }
}

export async function POST(request, context) {
  try {
    const segments = (await context.params)?.path || []
    const collection = segments[0]
    if (collection === 'scan') {
      let decoded = { uid: 'guest' }
      try {
        decoded = await requireUser(request)
      } catch {}
      return extractBill(request, decoded)
    }
    ensureAdmin()
    const { decoded } = await userAndPath(request, context)
    if (collection === 'gemini-key') {
      const body = await readBody(request)
      const newKey = (body?.apiKey || '').trim()
      if (newKey) {
        process.env.GEMINI_API_KEY = newKey
        try {
          const fs = await import('fs')
          const path = await import('path')
          const envPath = path.join(process.cwd(), '.env.local')
          if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8')
            if (envContent.includes('GEMINI_API_KEY=')) {
              envContent = envContent.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY=${newKey}`)
            } else {
              envContent += `\nGEMINI_API_KEY=${newKey}\n`
            }
            fs.writeFileSync(envPath, envContent, 'utf8')
          }
        } catch (e) {
          console.error('Could not update .env.local', e)
        }
      }
      return NextResponse.json({ success: true, hasKey: Boolean(process.env.GEMINI_API_KEY) })
    }
    const body = await readBody(request)
    if (!body || !collections.has(collection)) return responseError('Choose a supported Ledgerly record type.', 400)
    const ownerId = decoded.uid
    const recordId = id()
    const base = { ...body, id: recordId, ownerId, updatedAt: now() }
    if (collection === 'items') {
      Object.assign(base, {
        quantity: Number(body.quantity || 0),
        costPrice: Number(body.costPrice || 0),
        sellingPrice: Number(body.sellingPrice || 0),
        lowStockThreshold: Number(body.lowStockThreshold || 0),
      })
    }
    if (collection === 'parties') {
      Object.assign(base, { balance: 0, type: body.type === 'vendor' ? 'vendor' : 'customer' })
    }
    if (collection === 'ledgerEntries') {
      const amount = Number(body.finalPayable !== undefined ? body.finalPayable : body.amount || 0)
      if (!body.partyId || amount <= 0) return responseError('Choose a party and enter an amount greater than zero.')
      base.partyId = body.partyId
      base.partyName = body.partyName || ''
      base.date = body.date || now().slice(0, 10)
      base.billNo = String(body.billNo || '').trim()
      base.baseAmount = Number(body.baseAmount || body.totalAmount || amount)
      base.totalAmount = Number(body.baseAmount || body.totalAmount || amount)
      base.advPayment = Number(body.advPayment || 0)
      base.taxAmount = Number(body.taxAmount || 0)
      base.other = Number(body.other || 0)
      base.otherType = body.otherType === 'credit' ? 'credit' : 'debit'
      base.finalPayable = amount
      base.amount = amount
      base.note = body.note || ''
      base.type = body.type === 'credit' ? 'credit' : 'debit'
      base.source = body.source === 'scan' ? 'scan' : 'manual'
    }
    if (collection === 'stockLogs') {
      if (!body.itemId || Number(body.quantity) <= 0) return responseError('Choose an item and enter a quantity greater than zero.')
      base.quantity = Number(body.quantity)
      base.type = body.type === 'out' ? 'out' : 'in'
      base.date = body.date || now().slice(0, 10)
    }
    if (collection === 'attendanceRecords') {
      if (!body.employeeId) return responseError('Employee ID is required.')
      base.employeeId = body.employeeId
      base.date = body.date || now().slice(0, 10)
      base.status = ['present', 'absent', 'half-day'].includes(body.status) ? body.status : 'present'
      base.amountPaid = Number(body.amountPaid || 0)
      base.note = body.note || ''

      const existing = await adminDb.collection('attendanceRecords')
        .where('ownerId', '==', ownerId)
        .where('employeeId', '==', base.employeeId)
        .where('date', '==', base.date)
        .get()

      if (!existing.empty) {
        const docRef = existing.docs[0].ref
        const updateFields = { updatedAt: now() }
        if (body.status !== undefined) updateFields.status = base.status
        if (body.amountPaid !== undefined) updateFields.amountPaid = Number(body.amountPaid || 0)
        if (body.note !== undefined) updateFields.note = body.note
        await docRef.update(updateFields)
        return NextResponse.json({ id: existing.docs[0].id, ...existing.docs[0].data(), ...updateFields }, { status: 200 })
      }
    }
    await adminDb.collection(collection).doc(recordId).set(base)
    if (collection === 'ledgerEntries') await adjustParty(base.partyId, ownerId, base.type === 'debit' ? base.amount : -base.amount)
    if (collection === 'stockLogs') await adjustItem(base.itemId, ownerId, base.type === 'in' ? base.quantity : -base.quantity)
    if (collection === 'employees') base.createdAt = now()
    if (collection === 'users') return responseError('Profile records are created through /api/profile.', 400)
    return NextResponse.json(base, { status: 201 })
  } catch (error) {
    const message = error?.message || ''
    if (message === 'UNAUTHENTICATED') return responseError('Please sign in to continue.', 401)
    if (message === 'FIREBASE_ADMIN_NOT_CONFIGURED') return responseError('Firebase Admin is not configured. Add the server credentials to .env.local.', 503)
    console.error('Ledgerly POST error', error)
    return responseError('We could not save this record right now.', 500)
  }
}

export async function PUT(request, context) {
  try {
    ensureAdmin()
    const { decoded, segments } = await userAndPath(request, context)
    const collection = segments[0]
    const recordId = segments[1]
    if (collection === 'profile') {
      const body = await readBody(request)
      const profile = { uid: decoded.uid, email: decoded.email || '', businessName: String(body?.businessName || 'My business').slice(0, 120), ownerId: decoded.uid, updatedAt: now() }
      await adminDb.collection('users').doc(decoded.uid).set(profile, { merge: true })
      return NextResponse.json(profile)
    }
    if (!collections.has(collection) || !recordId) return responseError('A record id is required.', 400)
    const body = await readBody(request)
    const ref = adminDb.collection(collection).doc(recordId)
    const snapshot = await ref.get()
    if (!snapshot.exists || snapshot.data().ownerId !== decoded.uid) return responseError('Record not found.', 404)
    const previous = { id: snapshot.id, ...snapshot.data() }
    const next = { ...body, id: recordId, ownerId: decoded.uid, updatedAt: now() }
    if (collection === 'ledgerEntries') {
      await adjustParty(previous.partyId, decoded.uid, previous.type === 'debit' ? -Number(previous.amount) : Number(previous.amount))
      await adjustParty(next.partyId || previous.partyId, decoded.uid, (next.type || previous.type) === 'debit' ? Number(next.amount || previous.amount) : -Number(next.amount || previous.amount))
    }
    if (collection === 'stockLogs') {
      await adjustItem(previous.itemId, decoded.uid, previous.type === 'in' ? -Number(previous.quantity) : Number(previous.quantity))
      await adjustItem(next.itemId || previous.itemId, decoded.uid, (next.type || previous.type) === 'in' ? Number(next.quantity || previous.quantity) : -Number(next.quantity || previous.quantity))
    }
    await ref.set(next)
    return NextResponse.json(next)
  } catch (error) {
    const message = error?.message || ''
    if (message === 'UNAUTHENTICATED') return responseError('Please sign in to continue.', 401)
    if (message === 'FIREBASE_ADMIN_NOT_CONFIGURED') return responseError('Firebase Admin is not configured. Add the server credentials to .env.local.', 503)
    console.error('Ledgerly PUT error', error)
    return responseError('We could not update this record right now.', 500)
  }
}

export async function DELETE(request, context) {
  try {
    ensureAdmin()
    const { decoded, segments } = await userAndPath(request, context)
    const collection = segments[0]
    const recordId = segments[1]
    if (!collections.has(collection) || !recordId) return responseError('A record id is required.', 400)
    const ref = adminDb.collection(collection).doc(recordId)
    const snapshot = await ref.get()
    if (!snapshot.exists || snapshot.data().ownerId !== decoded.uid) return responseError('Record not found.', 404)
    const previous = snapshot.data()
    if (collection === 'ledgerEntries') await adjustParty(previous.partyId, decoded.uid, previous.type === 'debit' ? -Number(previous.amount) : Number(previous.amount))
    if (collection === 'stockLogs') await adjustItem(previous.itemId, decoded.uid, previous.type === 'in' ? -Number(previous.quantity) : Number(previous.quantity))
    await ref.delete()
    return NextResponse.json({ deleted: true, id: recordId })
  } catch (error) {
    const message = error?.message || ''
    if (message === 'UNAUTHENTICATED') return responseError('Please sign in to continue.', 401)
    if (message === 'FIREBASE_ADMIN_NOT_CONFIGURED') return responseError('Firebase Admin is not configured. Add the server credentials to .env.local.', 503)
    console.error('Ledgerly DELETE error', error)
    return responseError('We could not delete this record right now.', 500)
  }
}

async function adjustParty(partyId, ownerId, delta) {
  const ref = adminDb.collection('parties').doc(partyId)
  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref)
    if (!snapshot.exists || snapshot.data().ownerId !== ownerId) throw new Error('PARTY_NOT_FOUND')
    transaction.update(ref, { balance: Number(snapshot.data().balance || 0) + Number(delta), updatedAt: now() })
  })
}

async function adjustItem(itemId, ownerId, delta) {
  const ref = adminDb.collection('items').doc(itemId)
  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref)
    if (!snapshot.exists || snapshot.data().ownerId !== ownerId) throw new Error('ITEM_NOT_FOUND')
    transaction.update(ref, { quantity: Math.max(0, Number(snapshot.data().quantity || 0) + Number(delta)), updatedAt: now() })
  })
}

async function extractBill(request, decoded) {
  let form
  try {
    form = await request.formData()
  } catch (err) {
    return responseError('Invalid form data.', 400)
  }
  const file = form.get('file')
  const formKey = form.get('apiKey')
  const headerKey = request.headers.get('x-gemini-api-key')
  const apiKey = (headerKey || formKey || process.env.GEMINI_API_KEY || '').trim()

  if (!(file instanceof File)) return responseError('Please choose a bill file (PDF, Word, or Image).', 400)

  const fileName = (file.name || '').toLowerCase()
  const mimeType = (file.type || '').toLowerCase()

  const isPdf = mimeType === 'application/pdf' || fileName.endsWith('.pdf')
  const isWord =
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    fileName.endsWith('.docx') ||
    fileName.endsWith('.doc')
  const isImage =
    mimeType.startsWith('image/') ||
    ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(mimeType) ||
    /\.(jpe?g|png|webp|heic|heif)$/i.test(fileName)

  if (!isPdf && !isWord && !isImage) {
    return responseError('Please upload a PDF, Word document (.docx/.doc), or image (JPG, PNG, WebP).', 415)
  }

  if (file.size > 25 * 1024 * 1024) return responseError('Please choose a file smaller than 25 MB.', 413)

  let extracted = null
  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const extractionPrompt = `You are a certified chartered accountant and document extraction engine. Analyze this commercial/GST invoice or retail bill with 100% accounting accuracy.

CRITICAL EXTRACTION RULES:
1. TRANSACTION DIRECTION & COUNTER-PARTY:
   - Identify whether this is a SALE or a PURCHASE:
     * If this invoice is titled "Tax Sales", "Sales Invoice", or contains "OUTPUT CGST", "OUTPUT SGST", or "TCS ON SALE": This is a SALE made by the company at the top to their customer. Set partyType="seller" and type="credit". Extract the BUYER's name (from "Buyer (Bill to)" or "Consignee (Ship to)", e.g. "SHIV STEELS") as partyName. DO NOT use the seller's company name.
     * If this invoice is a retail receipt or purchase bill (e.g. Croma, Reliance, retail store, Amazon, or has "Bill to address: [Customer]"): This is a PURCHASE. Set partyType="purchase" and type="debit". Extract the STORE/VENDOR's name (e.g. "CROMA" or "Infiniti Retail Limited") as partyName. DO NOT use the customer's name from "Bill to".
2. INVOICE NUMBER:
   - In tabular headers like "Invoice No. | e-Way Bill No. | Dated" above "376 | 781668086637 | 08-Sep-26", the invoice number is the value directly under "Invoice No." (e.g. "376"). DO NOT return "e-Way" or column header names.
3. FINANCIAL AMOUNTS (Ensure all amounts are Numbers):
   - baseAmount: Taxable value / Subtotal before tax (e.g. 967887).
   - taxAmount: Total GST (CGST + SGST or IGST, e.g. 174219.66).
   - other: TCS on sale (e.g. 2% TCS / TCS on billing: 22842) or Round Off.
   - otherType: "credit" if added to payable, "debit" if deducted.
   - advPayment: Any payments already made (e.g. Paytm/Card/UPI transactions, e.g. 112353), or 0.
   - finalPayable / amount: The Grand Total Net Amount (e.g. 1164949 or 112353).

Return ONLY valid JSON with keys:
- partyName: String
- partyType: String ("seller" or "purchase")
- billNo: String
- date: String (YYYY-MM-DD)
- baseAmount: Number
- taxAmount: Number
- other: Number
- otherType: String ("credit" or "debit")
- advPayment: Number
- amount: Number
- finalPayable: Number
- type: String ("credit" or "debit")
- description: String`

  // =========================================================================
  // 1. WORD DOCUMENT (.docx / .doc) EXTRACTION
  // =========================================================================
  if (isWord) {
    let wordText = ''
    try {
      const mammoth = await import('mammoth')
      const mResult = await mammoth.extractRawText({ buffer: fileBuffer })
      wordText = (mResult?.value || '').trim()
    } catch (mErr) {
      console.warn('Word mammoth extraction error:', mErr?.message)
    }

    if (!wordText) {
      try {
        const str = fileBuffer.toString('binary')
        const matches = str.match(/[\x20-\x7E\t\r\n]{4,}/g)
        if (matches) wordText = matches.join('\n')
      } catch (e) {}
    }

    if (apiKey && wordText) {
      try {
        const ai = new GoogleGenAI({ apiKey })
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `${extractionPrompt}\n\nInvoice Content:\n${wordText}` }],
            },
          ],
          config: { responseMimeType: 'application/json', temperature: 0 },
        })
        const rawText = (response.text || '').trim()
        const cleanJson = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
        extracted = JSON.parse(cleanJson)
      } catch (aiWordErr) {
        console.warn('Gemini Word text parsing failed:', aiWordErr?.message)
      }
    }

    if (!extracted && wordText) {
      extracted = analyzeInvoiceText(wordText, file.name)
    }
  }

  // =========================================================================
  // 2. PDF DOCUMENT (.pdf) EXTRACTION
  // =========================================================================
  else if (isPdf) {
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey })
        const base64Data = fileBuffer.toString('base64')
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: extractionPrompt },
                { inlineData: { mimeType: 'application/pdf', data: base64Data } },
              ],
            },
          ],
          config: { responseMimeType: 'application/json', temperature: 0 },
        })
        const rawText = (response.text || '').trim()
        const cleanJson = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
        extracted = JSON.parse(cleanJson)
      } catch (aiPdfErr) {
        console.warn('Gemini PDF multimodal parsing failed:', aiPdfErr?.message)
      }
    }

    if (!extracted) {
      let pdfText = ''
      try {
        const pdfModule = await import('pdf-parse')
        if (pdfModule.PDFParse) {
          const u8 = new Uint8Array(fileBuffer)
          const parser = new pdfModule.PDFParse({ data: u8 })
          const res = await parser.getText()
          pdfText = typeof res === 'string' ? res : (res?.text || '')
          try { if (typeof parser.destroy === 'function') await parser.destroy() } catch (e) {}
        } else if (typeof pdfModule === 'function') {
          const res = await pdfModule(fileBuffer)
          pdfText = res?.text || ''
        } else if (typeof pdfModule.default === 'function') {
          const res = await pdfModule.default(fileBuffer)
          pdfText = res?.text || ''
        }
      } catch (pdfErr) {
        console.warn('pdf-parse fallback warning:', pdfErr?.message)
      }

      // Robust secondary stream extractor for PDFs
      if (!pdfText || pdfText.trim().length < 10) {
        try {
          const str = fileBuffer.toString('latin1')
          const btBlocks = str.match(/BT[\s\S]*?ET/g) || []
          let blockText = ''
          for (const block of btBlocks) {
            const tjs = block.match(/\((.*?)\)\s*Tj/g) || []
            for (const tj of tjs) {
              const m = tj.match(/\((.*?)\)\s*Tj/)
              if (m && m[1]) blockText += m[1] + ' '
            }
            blockText += '\n'
          }
          if (blockText.trim().length > 10) {
            pdfText = blockText
          } else {
            const matches = str.match(/[\x20-\x7E\t\r\n]{4,}/g) || []
            pdfText = matches.filter(s => !/^(\/|%|xref|trailer|obj|endobj|stream|endstream)/i.test(s)).join('\n')
          }
        } catch (e) {}
      }

      if (pdfText && pdfText.trim().length > 10) {
        extracted = analyzeInvoiceText(pdfText, file.name)
      }
    }
  }

  // =========================================================================
  // 3. IMAGE (.jpg, .png, .webp, etc.) EXTRACTION
  // =========================================================================
  else {
    if (apiKey) {
      const modelsToTry = [
        process.env.GEMINI_MODEL && !process.env.GEMINI_MODEL.includes('2.0') && !process.env.GEMINI_MODEL.includes('2.5')
          ? process.env.GEMINI_MODEL
          : 'gemini-3.8-flash',
        'gemini-3.5-flash-lite',
        'gemini-flash-latest',
      ]

      for (const model of modelsToTry) {
        try {
          const ai = new GoogleGenAI({ apiKey })
          const base64Data = fileBuffer.toString('base64')
          const response = await ai.models.generateContent({
            model,
            contents: [
              {
                role: 'user',
                parts: [
                  { text: extractionPrompt },
                  { inlineData: { mimeType: file.type || 'image/jpeg', data: base64Data } },
                ],
              },
            ],
            config: { responseMimeType: 'application/json', temperature: 0 },
          })

          const rawText = (response.text || '').trim()
          const cleanJson = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
          extracted = JSON.parse(cleanJson)
          break
        } catch (err) {}
      }
    }

    if (!extracted) {
      try {
        const path = await import('path')
        const { createWorker } = await import('tesseract.js')
        const worker = await createWorker('eng', 1, {
          workerPath: path.resolve(process.cwd(), 'node_modules/tesseract.js/src/worker-script/node/index.js'),
        })
        const { data: { text } } = await worker.recognize(fileBuffer)
        await worker.terminate()

        if (text && text.trim().length > 10) {
          extracted = analyzeInvoiceText(text, file.name)
        }
      } catch (ocrErr) {
        console.warn('OCR analysis fallback failed:', ocrErr?.message)
      }
    }
  }

  // 4. Fallback to default analyzer if text was unreadable
  if (!extracted) {
    extracted = analyzeInvoiceText('', file.name)
  }

  // Sanitize all numeric and accounting types
  extracted.amount = Number(extracted.amount || extracted.finalPayable || 0)
  extracted.finalPayable = Number(extracted.finalPayable || extracted.amount || 0)
  extracted.baseAmount = Number(extracted.baseAmount !== undefined ? extracted.baseAmount : extracted.finalPayable)
  extracted.taxAmount = Number(extracted.taxAmount || 0)
  extracted.other = Number(extracted.other || 0)
  extracted.otherType = extracted.otherType === 'debit' ? 'debit' : 'credit'
  extracted.advPayment = Number(extracted.advPayment || 0)
  if (!extracted.date) extracted.date = new Date().toISOString().slice(0, 10)
  if (!extracted.partyType) extracted.partyType = 'purchase'
  if (!extracted.type) extracted.type = 'debit'

  return NextResponse.json({
    extracted,
    success: true,
  })
}
