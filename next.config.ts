import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Login pages dùng trang riêng
      { source: "/manager/login",      destination: "/admin/staff-login" },
      { source: "/collaborator/login", destination: "/admin/staff-login" },
      // Root path (dashboard)
      { source: "/manager",      destination: "/admin" },
      { source: "/collaborator", destination: "/admin" },
      // Sub-pages
      { source: "/manager/:path*",      destination: "/admin/:path*" },
      { source: "/collaborator/:path*", destination: "/admin/:path*" },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "qr.sepay.vn" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
