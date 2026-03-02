import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sileo';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sistema POS - Don Camote',
  description: 'Sistema de gestión para restaurante',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={geist.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}