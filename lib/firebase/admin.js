// Firebase Admin SDK configuration. Fill the FIREBASE_ADMIN_* values in .env.local from a Firebase service account.
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const adminConfigured = Boolean(
  process.env.FIREBASE_ADMIN_PROJECT_ID &&
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
  process.env.FIREBASE_ADMIN_PRIVATE_KEY
)

function getAdminApp() {
  if (!adminConfigured) return null
  return (
    getApps()[0] ||
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    })
  )
}

const adminApp = getAdminApp()
export const adminAuth = adminApp ? getAuth(adminApp) : null
export const adminDb = adminApp ? getFirestore(adminApp) : null

export async function requireUser(request) {
  if (!adminAuth) throw new Error('FIREBASE_ADMIN_NOT_CONFIGURED')
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) throw new Error('UNAUTHENTICATED')
  return adminAuth.verifyIdToken(header.slice(7))
}
