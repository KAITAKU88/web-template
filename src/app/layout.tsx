import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = settings.site_name ?? "TemplateLab";
  const description = settings.site_description ?? "Mua template Notion và Google Sheets chất lượng cao. Thanh toán nhanh qua QR, nhận link ngay sau khi chuyển khoản.";
  const faviconUrl = settings.favicon_url ?? undefined;
  const ogImageUrl = settings.og_image_url ?? undefined;

  return {
    title: `${siteName} — Template Notion & Google Sheets`,
    description,
    icons: faviconUrl ? { icon: faviconUrl } : undefined,
    openGraph: {
      title: siteName,
      description,
      siteName,
      ...(ogImageUrl && { images: [{ url: ogImageUrl, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description,
      ...(ogImageUrl && { images: [ogImageUrl] }),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();
  const brandColor = settings.brand_color ?? "#16a34a";
  const siteName = settings.site_name ?? "TemplateLab";
  const brandName = settings.brand_name ?? siteName;
  const logoValue = settings.logo_url ?? undefined;
  const zaloLink = settings.zalo_link ?? null;
  const gaId = settings.ga_id || process.env.NEXT_PUBLIC_GA_ID || null;

  return (
    <html
      lang="vi"
      style={{ "--brand": brandColor } as React.CSSProperties}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t==='system'||!t)&&window.matchMedia('(prefers-color-scheme:dark)').matches){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />

        {/* Google Analytics 4 */}
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{page_path:window.location.pathname});`,
              }}
            />
          </>
        )}
      </head>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-950`}>
        <Header brandName={brandName} logoValue={logoValue} />
        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>

        <footer className="mt-20 border-t border-gray-100 bg-white py-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 text-sm text-gray-400 sm:flex-row">
            <span>© {new Date().getFullYear()} {siteName}</span>
            {zaloLink && (
              <a
                href={zaloLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-brand transition hover:opacity-80"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                Hỗ trợ qua Zalo
                <span>→</span>
              </a>
            )}
          </div>
        </footer>
      </body>
    </html>
  );
}
