import type { MetadataRoute } from "next";

import { listAllFiles } from "@/lib/doodstream";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [files, hidden, metas] = await Promise.all([
    listAllFiles(),
    prisma.hiddenVideo.findMany({ select: { fileCode: true } }),
    prisma.videoMeta.findMany({ select: { fileCode: true, tags: true } }),
  ]);

  const hiddenCodes = new Set(hidden.map((video) => video.fileCode));
  const visible = files.filter((file) => !hiddenCodes.has(file.file_code));
  const visibleCodes = new Set(visible.map((file) => file.file_code));
  const tags = new Set(
    metas
      .filter((meta) => visibleCodes.has(meta.fileCode))
      .flatMap((meta) => meta.tags),
  );

  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/movies`, changeFrequency: "daily", priority: 0.8 },
    {
      url: `${siteUrl}/categories`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...[...tags].map((tag) => ({
      url: `${siteUrl}/categories/${encodeURIComponent(tag)}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...visible.map((file) => ({
      url: `${siteUrl}/watch/${file.file_code}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
