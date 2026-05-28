import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Không bundle các AI SDK — để Netlify load trực tiếp từ node_modules
  // Giải quyết lỗi ESM bundling với @google/genai và @anthropic-ai/sdk
  serverExternalPackages: ["@google/genai", "@anthropic-ai/sdk"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "qr.sepay.vn" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
