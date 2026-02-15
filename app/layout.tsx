import "./globals.css";

import type { Metadata } from "next";

import { Providers } from "@/app/providers";
import { GlobalNav } from "@/components/global-nav";
import { RouteTransitionProvider } from "@/components/route-transition";

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
    <html lang="en">
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
