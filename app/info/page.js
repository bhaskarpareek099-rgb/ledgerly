import RealPortal from '@/components/portal'
import LocalPortal from '@/components/local-portal'
import { firebaseConfigured } from '@/lib/firebase/client'

export default function InfoPage() {
  if (firebaseConfigured) {
    return <RealPortal path="/info" />
  }
  return <LocalPortal path="/info" />
}
