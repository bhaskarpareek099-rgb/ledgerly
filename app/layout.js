import './globals.css'

export const metadata = {
  title: 'Ledgerly — Small Business Management & AI Bill Scanning',
  description: 'Simple, fast stock, ledger, attendance, and smart bill scanning for small businesses.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
