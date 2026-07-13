import type { Metadata, Viewport } from "next";
import { APP_CONFIG } from "@/config/app";
import { BottomNav } from "@/components/layout/BottomNav";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_CONFIG.displayName,
  description: "告訴我幾點要抵達，我幫你倒推幾點該出門。",
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
      <body className="font-sans text-ink-700 antialiased">
        <ServiceWorkerRegister />
        <main className="min-h-[100dvh] px-4 pb-24 pt-6">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
