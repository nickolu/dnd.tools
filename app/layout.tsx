import "./globals.css";

import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Spectral } from "next/font/google";

import { Providers } from "@/app/providers";
import { GlobalNav } from "@/components/global-nav";
import { RouteTransitionProvider } from "@/components/route-transition";
import { UndoDeleteToast } from "@/components/undo-delete-toast";

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
    <html
      lang="en"
      data-theme="dark"
      className={`${GeistSans.variable} ${spectral.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t}else if(window.matchMedia('(prefers-color-scheme:light)').matches){document.documentElement.dataset.theme='light'}else{document.documentElement.dataset.theme='dark'}}catch(e){document.documentElement.dataset.theme='dark'}})()`,
          }}
        />
      </head>
      <body className="antialiased">
        <Providers>
          <RouteTransitionProvider>
            <div className="app-shell">
              <GlobalNav />
              {children}
            </div>
            <UndoDeleteToast />
          </RouteTransitionProvider>
        </Providers>
      </body>
    </html>
  );
}
