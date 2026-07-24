import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const description = "A private, local-first browser studio for composing scenes, capturing media, and recording professional video without uploading your content.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: "StreamForge Studio — Browser Broadcasting & Recording", template: "%s | StreamForge Studio" },
  description,
  applicationName: "StreamForge Studio",
  keywords: ["browser studio", "video recording", "screen recorder", "broadcasting studio", "local-first", "OBS alternative"],
  authors: [{ name: "Vivaan Rajpurohit", url: "https://github.com/VivaanRajpurohit" }],
  creator: "Vivaan Rajpurohit",
  publisher: "StreamForge Studio",
  alternates: { canonical: "/" },
  icons: { icon: "/streamforge-logo.png", apple: "/streamforge-logo.png" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "StreamForge Studio",
    title: "StreamForge Studio — Browser Broadcasting & Recording",
    description,
    images: [{ url: "/streamforge-logo.png", width: 1254, height: 1254, alt: "StreamForge Studio logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "StreamForge Studio — Browser Broadcasting & Recording",
    description,
    images: ["/streamforge-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
