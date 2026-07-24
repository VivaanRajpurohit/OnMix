import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const description = "A private, local-first browser studio for composing scenes, capturing media, and recording professional video without uploading your content.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: "OnMix — Browser Broadcasting & Recording", template: "%s | OnMix" },
  description,
  applicationName: "OnMix",
  keywords: ["browser studio", "video recording", "screen recorder", "broadcasting studio", "local-first", "OBS alternative"],
  authors: [{ name: "Vivaan Rajpurohit", url: "https://github.com/VivaanRajpurohit" }],
  creator: "Vivaan Rajpurohit",
  publisher: "OnMix",
  alternates: { canonical: "/" },
  verification: { google: "XxSJDevDde_Bb1--E1hu_H45oIuNnyw2KM2A9wFQnMg" },
  icons: { icon: "/onmix-logo.png", apple: "/onmix-logo.png" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "OnMix",
    title: "OnMix — Browser Broadcasting & Recording",
    description,
    images: [{ url: "/onmix-logo.png", width: 1254, height: 1254, alt: "OnMix logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "OnMix — Browser Broadcasting & Recording",
    description,
    images: ["/onmix-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
