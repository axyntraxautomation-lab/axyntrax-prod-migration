import { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// Directiva absoluta: No indexar JARVIS en buscadores
export const metadata: Metadata = {
  title: 'JARVIS PRIME | Neural Core',
  description: 'Internal Management Interface - Authorized Personnel Only',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function JarvisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} bg-[#050507] text-[#00D4FF] min-h-screen selection:bg-[#00D4FF]/20`}>
      {children}
    </div>
  );
}
