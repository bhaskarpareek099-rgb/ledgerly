import RealPortal from '@/components/portal'
import LocalPortal from '@/components/local-portal'
import { firebaseConfigured } from '@/lib/firebase/client'

export default function AttendancePage() {
  if (firebaseConfigured) {
    return <RealPortal path="/attendance" />
  }
  return <LocalPortal path="/attendance" />
}
