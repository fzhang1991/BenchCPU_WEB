/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async rewrites() {
    return [{ source: "/backend/:path*", destination: "http://localhost:8010/:path*" }];
  },
};

export default nextConfig;
