import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AdminStoreProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: { default: 'EduLink Admin', template: '%s · EduLink Admin' },
  description: "Tableau de bord d'administration EduLink — École Internationale Horizon",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F8FC' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1220' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AdminStoreProvider>{children}</AdminStoreProvider>
      </body>
    </html>
  );
}
