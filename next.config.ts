import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Support ES2022 private fields & noble crypto
  transpilePackages: ['@noble/ed25519', '@noble/hashes', '@scure/base'],
};

export default nextConfig;
