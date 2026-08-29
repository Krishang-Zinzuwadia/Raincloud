import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata = { title: "Farlands Live" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <nav className="flex gap-4 border-b border-[var(--line)] px-6 py-4 text-sm">
            <a href="/">Servers</a>
            <a href="/review">Review</a>
            <a href="/progress">Progress</a>
            <a href="/plugin-builder">Builder</a>
            <a href="/proposals">Proposals</a>
          </nav>
          <main className="mx-auto max-w-3xl p-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
