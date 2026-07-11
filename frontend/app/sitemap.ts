import { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const lastModified = new Date();

const routes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  {
    path: "/",
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    path: "/lipyd",
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    path: "/team",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/about",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    path: "/privacy",
    changeFrequency: "monthly",
    priority: 0.3,
  },
  {
    path: "/terms",
    changeFrequency: "monthly",
    priority: 0.3,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}