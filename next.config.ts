import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/download': ['./private/downloads/**/*'],
  },
};

export default nextConfig;