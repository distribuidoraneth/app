import type { Metadata, Viewport } from 'next';
import './globals.css';
import { DistributionProvider } from '@/context/DistributionContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#081225',
};

export const metadata: Metadata = {
  title: 'Distribuidora Aneth | Plataforma de Pedidos & Facturación SRI',
  description: 'Sistema integral de distribución mayorista de bebidas en javas, despacho en ruta y facturación electrónica SRI Ecuador.',
  applicationName: 'Distribuidora Aneth',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Aneth',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="apple-mobile-web-app-title" content="Aneth" />
        <meta name="application-name" content="Aneth" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
        <DistributionProvider>{children}</DistributionProvider>
      </body>
    </html>
  );
}
