import { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        crawlDelay: 10,
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        crawlDelay: 10,
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        crawlDelay: 10,
      },
      {
        userAgent: "Claude-Web",
        allow: "/",
        crawlDelay: 10,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        crawlDelay: 10,
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        crawlDelay: 10,
      },
      {
        userAgent: "CCBot",
        allow: "/",
        crawlDelay: 10,
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        crawlDelay: 10,
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
        crawlDelay: 10,
      },
      {
        userAgent: "cohere-ai",
        allow: "/",
        crawlDelay: 10,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
