import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { RouteFocusManager } from "@/app/route-focus-manager";
import { assertLocalRequest } from "@/lib/security/local-access";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Decision Stress Test",
  description: "A structured decision workbench for medium-stakes professional decisions.",
  robots: {
    index: false,
    follow: false,
  },
};

export const runtime = "nodejs";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await assertLocalRequest();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <a
          href="#page-content"
          className="absolute left-4 top-4 z-50 -translate-y-24 rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-amber-200"
        >
          Skip to main content
        </a>
        <Suspense fallback={null}>
          <RouteFocusManager />
        </Suspense>
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-12 pt-8 sm:px-8">
          {children}
        </div>
      </body>
    </html>
  );
}
