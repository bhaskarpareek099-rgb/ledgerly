import RealPortal from '@/components/portal'
import LocalPortal from '@/components/local-portal'
import { firebaseConfigured } from '@/lib/firebase/client'

export default function ScanPage() {
  if (firebaseConfigured) {
    return <RealPortal path="/scan" />
  }
  return <LocalPortal path="/scan" />
}
