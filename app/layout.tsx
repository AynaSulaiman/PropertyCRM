import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'PropertyCRM | Real Estate Lead Management',
  description: 'Professional CRM system for property dealers in Pakistan',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#39375B',
              color: '#fff',
              fontSize: '14px',
            },
            success: {
              style: {
                background: 'linear-gradient(135deg, #745C97, #DC6ACF)',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#DC6ACF',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
