import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://projectsphere.io";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/register", "/login"],
        disallow: [
          "/api/",
          "/workspaces/",
          "/settings/",
          "/onboarding/",
          "/(dashboard)/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
