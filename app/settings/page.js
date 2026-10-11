import RealPortal from '@/components/portal'
import LocalPortal from '@/components/local-portal'
import { firebaseConfigured } from '@/lib/firebase/client'

export default function SettingsPage() {
  if (firebaseConfigured) {
    return <RealPortal path="/settings" />
  }
  return <LocalPortal path="/settings" />
}
