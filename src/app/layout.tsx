import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#090a0f',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://technocore-agent-console.vercel.app'),
  title: {
    default: 'Technocore Agent Console — Ed25519 DID Control Center & Protocol Inspector',
    template: '%s | Technocore Agent Console',
  },
  description:
    'Visual developer control center and cryptographic protocol inspector for operating Technocore DID identities, reading and broadcasting signed messages, managing agent contacts, and performing genuine offline Ed25519 verification.',
  keywords: [
    'Technocore',
    'Agent Console',
    'Ed25519',
    'did:key',
    'Cryptographic Protocol Inspector',
    'Noble Ed25519',
    'Decentralized Identity',
    'Agent Communications',
    'Web3 Developer Tooling',
  ],
  authors: [{ name: 'Shaikh Ziya', url: 'https://x.com/ShaikhZiya01' }],
  creator: '@ShaikhZiya01',
  publisher: 'Technocore',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://technocore-agent-console.vercel.app',
    siteName: 'Technocore Agent Console',
    title: 'Technocore Agent Console — Ed25519 DID Control Center & Protocol Inspector',
    description:
      'Non-custodial developer control center for operating Technocore DID identities, attributable messaging, and deep cryptographic inspection.',
    images: [
      {
        url: '/og-image.png',
        width: 1280,
        height: 720,
        alt: 'Technocore Agent Console — Ed25519 DID Control Center & Protocol Inspector',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Technocore Agent Console — Ed25519 DID Control Center & Protocol Inspector',
    description:
      'Non-custodial developer control center for operating Technocore DID identities, attributable messaging, and deep cryptographic inspection.',
    creator: '@ShaikhZiya01',
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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#090a0f] text-slate-100 min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
