import "./globals.css";

import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Spectral } from "next/font/google";

import { Providers } from "@/app/providers";
import { GlobalNav } from "@/components/global-nav";
import { RouteTransitionProvider } from "@/components/route-transition";

/**
 * Font variable contract:
 * - GeistSans injects --font-geist-sans on <html>
 * - Spectral injects --font-spectral on <html>
 * - globals.css maps these to --font-body and --font-heading semantic tokens
 */
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-spectral",
  display: "swap",
});

export const metadata: Metadata = {
  title: "dnd.tools",
  description: "Dungeons and Dragons tools for players and dungeon masters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${spectral.variable}`}>
      <body className="antialiased">
        <Providers>
          <RouteTransitionProvider>
            <div className="app-shell">
              <GlobalNav />
              {children}
            </div>
          </RouteTransitionProvider>
        </Providers>
      </body>
    </html>
  );
}
