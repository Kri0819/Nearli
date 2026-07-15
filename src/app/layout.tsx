import type { Metadata, Viewport } from "next";
import { APP_CONFIG } from "@/config/app";
import { BottomNav } from "@/components/layout/BottomNav";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_CONFIG.displayName,
  description: APP_CONFIG.tagline,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_CONFIG.shortName,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#98d0da",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant-TW">
      <body className="min-h-[100dvh] bg-page font-sans text-ink-700 antialiased">
        <ServiceWorkerRegister />
        {/* App 畫布：桌面版置中並限制在手機閱讀寬度，手機版自然滿版 */}
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-cream-100">
          <main className="flex-1 px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))]">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
