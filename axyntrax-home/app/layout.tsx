import './globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import MouseParticles from '@/components/MouseParticles';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AXYNTRAX Automation Suite | IA para PYMES',
  description: 'Automatización inteligente B2B con Cecilia IA y Jarvis OS.',
  metadataBase: new URL('https://axyntrax-automation.net'),
  openGraph: {
    title: 'AXYNTRAX Automation Suite',
    description: 'Liderando la automatización con IA en Perú.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.svg',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-[#020617] text-slate-200 antialiased selection:bg-[#00D4FF]/30`}>
        <MouseParticles />
        {children}
      </body>
    </html>
  );
}
