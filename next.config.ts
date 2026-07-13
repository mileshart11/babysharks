import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Azure Static Web Apps serves hybrid Next.js through a managed
      // reverse-proxy layer, so the Origin header on Server Action POSTs
      // (login, signup, picks, follows, etc.) doesn't match the Host header
      // Next.js sees by default — without this, every Server Action 500s.
      allowedOrigins: ['*.azurestaticapps.net'],
    },
  },
};

export default nextConfig;
