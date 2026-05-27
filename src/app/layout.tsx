import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Template Store — Notion & Google Sheets",
  description:
    "Mua template Notion và Google Sheets chất lượng cao. Thanh toán nhanh qua QR, nhận link ngay sau khi chuyển khoản.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <header className="border-b border-gray-100 bg-white">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl">📦</span>
              <span className="font-bold text-gray-900">TemplateStore</span>
            </a>
            <span className="text-sm text-gray-500">
              Thanh toán tự động qua QR
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>

        <footer className="mt-20 border-t border-gray-100 bg-white py-8 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} TemplateStore. Thanh toán bảo mật qua SePay.
        </footer>
      </body>
    </html>
  );
}
