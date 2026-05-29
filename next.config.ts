import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Login pages dùng trang riêng, không rewrite
      { source: "/manager/login",      destination: "/admin/staff-login" },
      { source: "/collaborator/login", destination: "/admin/staff-login" },
      // Các trang còn lại map về /admin
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
