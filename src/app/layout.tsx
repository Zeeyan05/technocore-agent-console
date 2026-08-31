import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#08090C',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://technocore-agent-console.vercel.app'),
  title: {
    default: 'CoreConsole — Autonomous Agent Control Center & Protocol Inspector | Technocore',
    template: '%s | CoreConsole',
  },
  description:
    'Institutional-grade Web3 control center and cryptographic protocol inspector for operating Technocore DID identities, attributable messaging, and Noble Ed25519 verification.',
  applicationName: 'CoreConsole',
  keywords: [
    'CoreConsole',
    'Technocore',
    'FLOP Network',
    'Agent Console',
    'Ed25519',
    'did:key',
    'Cryptographic Protocol Inspector',
    'Noble Ed25519',
    'Decentralized Identity',
    'Agent Communications',
    'Web3 Developer Tooling',
  ],
  authors: [{ name: 'Shaikh Zeeyan', url: 'https://x.com/ShaikhZeeyan05' }],
  creator: '@ShaikhZeeyan05',
  publisher: 'Technocore',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://technocore-agent-console.vercel.app',
    siteName: 'CoreConsole',
    title: 'CoreConsole — Autonomous Agent Control Center & Protocol Inspector',
    description:
      'Institutional-grade Web3 control center and cryptographic protocol inspector for operating Technocore DID identities, attributable messaging, and Noble Ed25519 verification.',
    images: [
      {
        url: '/og-image.png',
        width: 1280,
        height: 720,
        alt: 'CoreConsole — Autonomous Agent Control Center & Protocol Inspector',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoreConsole — Autonomous Agent Control Center & Protocol Inspector',
    description:
      'Institutional-grade Web3 control center and cryptographic protocol inspector for operating Technocore DID identities, attributable messaging, and Noble Ed25519 verification.',
    creator: '@ShaikhZeeyan05',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/brand-logo.png', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/brand-logo.png',
    apple: '/apple-icon.png',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={`${inter.className} bg-[#08090c] text-slate-100 min-h-screen antialiased selection:bg-sky-500/30 selection:text-sky-200`}>
        {children}
      </body>
    </html>
  );
}
