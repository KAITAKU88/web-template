import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "TemplateLab — Template Notion & Google Sheets",
  description:
    "Mua template Notion và Google Sheets chất lượng cao. Thanh toán nhanh qua QR, nhận link ngay sau khi chuyển khoản.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* Script chống flash khi load — đọc theme từ localStorage trước khi render */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t==='system'||!t)&&window.matchMedia('(prefers-color-scheme:dark)').matches){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />

        {/* Google Analytics 4 — thay G-XXXXXXXXXX bằng Measurement ID thật của bạn */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}',{page_path:window.location.pathname});`,
              }}
            />
          </>
        )}
      </head>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-950`}>
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>

        <footer className="mt-20 border-t border-gray-100 bg-white py-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 text-sm text-gray-400 sm:flex-row">
            <span>© {new Date().getFullYear()} TemplateLab</span>
            <a
              href="https://zalo.me/g/crgzsa7qsx96olfpcerb"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-emerald-500 transition hover:text-emerald-600"
            >
              {/* Chat bubble icon */}
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
              Hỗ trợ qua Zalo Group
              <span>→</span>
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
