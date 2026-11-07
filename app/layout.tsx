import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { startAlertChecker } from "@/lib/alert-scheduler";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

startAlertChecker();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s · Paywise",
    default: "Paywise",
  },
  description: "AI shopping assistant and price comparison for the US market.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-stone-900">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-stone-200 bg-stone-50">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
            <p>Paywise · US prices in USD</p>
            <p>Compare the price, then pay when it is low</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
