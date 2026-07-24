import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StreamForge Studio",
    short_name: "StreamForge",
    description: "A private, local-first browser broadcasting and recording studio.",
    start_url: "/",
    display: "standalone",
    background_color: "#111318",
    theme_color: "#1a1d24",
    icons: [{ src: "/streamforge-logo.png", sizes: "1254x1254", type: "image/png" }],
  };
}
