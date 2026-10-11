import RealPortal from '@/components/portal'
import LocalPortal from '@/components/local-portal'
import { firebaseConfigured } from '@/lib/firebase/client'

export default function DashboardPage() {
  if (firebaseConfigured) {
    return <RealPortal path="/dashboard" />
  }
  return <LocalPortal path="/dashboard" />
}
