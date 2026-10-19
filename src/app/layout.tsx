import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Process Map | APQC Governance", description: "Desktop process governance workspace aligned to APQC PCF 8.0." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" className="antialiased"><body>{children}</body></html>;
}