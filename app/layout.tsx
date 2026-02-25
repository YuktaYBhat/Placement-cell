import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import FCMHandler from "@/components/providers/FCMHandler";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SDMCET - Campus Connect",
  description: "Connect students with placement opportunities at SDMCET",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${manrope.variable} font-sans antialiased min-h-screen bg-white selection:bg-primary/20`}
      >
        <SessionProvider>
          <FCMHandler />
          <div className="relative flex min-h-screen flex-col">
            {children}
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--background)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
