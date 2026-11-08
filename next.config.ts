import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ensure the private paid-download ZIP is included in the Vercel function bundle.
  outputFileTracingIncludes: {
    '/api/download': ['./private/downloads/**/*'],
  },
};

export default nextConfig;
