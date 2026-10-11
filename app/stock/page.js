import RealPortal from '@/components/portal'
import LocalPortal from '@/components/local-portal'
import { firebaseConfigured } from '@/lib/firebase/client'

export default function StockPage() {
  if (firebaseConfigured) {
    return <RealPortal path="/stock" />
  }
  return <LocalPortal path="/stock" />
}
