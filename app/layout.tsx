import "./globals.css";

import type { Metadata } from "next";

import { Providers } from "@/app/providers";

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
