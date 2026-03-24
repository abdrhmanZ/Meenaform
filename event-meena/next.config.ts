import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "form.meena.sa",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "form.meena.sa",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "events.meena.sa",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "events.meena.sa",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;


