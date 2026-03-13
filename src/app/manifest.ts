import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RiderMeter",
    short_name: "RiderMeter",
    description: "Analytics and shift tracking for delivery riders.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1ea",
    theme_color: "#ef5a29",
    lang: "el-GR",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
