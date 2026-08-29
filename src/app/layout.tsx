import type { Metadata, Viewport } from 'next';
import './globals.css';
import { DistributionProvider } from '@/context/DistributionContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Distribuidora Aneth | Plataforma de Pedidos en Javas & Facturación',
  description: 'Sistema integral de distribución de bebidas en javas por código QR, despachos y facturación.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
        <DistributionProvider>{children}</DistributionProvider>
      </body>
    </html>
  );
}
