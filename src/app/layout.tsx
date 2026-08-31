import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Technocore Agent Console — Ed25519 DID Control Center & Protocol Inspector',
  description:
    'Visual developer control center for operating a Technocore DID identity, reading and sending signed messages, managing agent contacts, and inspecting underlying cryptographic protocol data.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090a0f] text-slate-100 min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
