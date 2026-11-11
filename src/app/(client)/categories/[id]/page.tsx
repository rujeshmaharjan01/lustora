import { cache } from "react";
import type { Metadata } from "next";

import { Pagination } from "@/components/web/pagination";
import { VideoGrid } from "@/components/web/video-grid";
import { pageMetadata } from "@/lib/seo";
import { getVideosByTag } from "@/lib/videos";

const getCategory = cache((tag: string, page: number) =>
  getVideosByTag(tag, page),
);

function categoryPath(tag: string, page: number) {
  const base = `/categories/${encodeURIComponent(tag)}`;
  return page > 1 ? `${base}?page=${page}` : base;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const tag = id.trim().toLowerCase();
  const requestedPage = Math.max(Number(pageParam) || 1, 1);
  const { videos, page, total } = await getCategory(tag, requestedPage);
  const label = tag ? tag[0].toUpperCase() + tag.slice(1) : "Category";

  return pageMetadata({
    title: `${label} videos`,
    description: `Watch ${total} ${tag} video${total === 1 ? "" : "s"} on Lustora.`,
    path: categoryPath(tag, page),
    images: videos[0] ? [videos[0].single_img] : undefined,
    noIndex: total === 0,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const tag = id.trim().toLowerCase();
  const requestedPage = Math.max(Number(pageParam) || 1, 1);

  const { videos, page, totalPages } = await getCategory(tag, requestedPage);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold capitalize tracking-tight">
          {tag || "Category"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Videos tagged &ldquo;{tag}&rdquo;.
        </p>
      </div>

      <VideoGrid videos={videos} />

      <Pagination
        page={page}
        totalPages={totalPages}
        hrefFor={(next) => categoryPath(tag, next)}
      />
    </section>
  );
}

export const instant = false;
