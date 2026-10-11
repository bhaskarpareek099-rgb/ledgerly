import RealPortal from '@/components/portal'
import LocalPortal from '@/components/local-portal'
import { firebaseConfigured } from '@/lib/firebase/client'

export default function PartiesPage() {
  if (firebaseConfigured) {
    return <RealPortal path="/parties" />
  }
  return <LocalPortal path="/parties" />
}
