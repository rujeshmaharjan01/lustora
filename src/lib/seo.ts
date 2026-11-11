import type { Metadata } from "next";

export const siteName = "Lustora";

export const siteDescription =
  "Browse and watch the Lustora video library. Discover new videos, browse categories, search the library, and save your favorites.";

const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (vercelUrl ? `https://${vercelUrl}` : process.env.BETTER_AUTH_URL) ??
  "http://localhost:3000"
).replace(/\/+$/, "");

export function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${siteUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function pageMetadata({
  title,
  description = siteDescription,
  path,
  images,
  noIndex = false,
}: {
  title: string;
  description?: string;
  path: string;
  images?: string[];
  noIndex?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title,
      description,
      url: path,
      siteName,
      ...(images?.length ? { images } : {}),
    },
    twitter: {
      card: images?.length ? "summary_large_image" : "summary",
      title,
      description,
      ...(images?.length ? { images } : {}),
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}
