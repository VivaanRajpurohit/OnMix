import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "StreamForge Studio",
  description: "A local-first browser broadcasting and recording studio.",
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
