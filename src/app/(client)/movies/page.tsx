import type { Metadata } from "next";
import Link from "next/link";

import { Pagination } from "@/components/web/pagination";
import { VideoGrid } from "@/components/web/video-grid";
import { buttonVariants } from "@/components/ui/button";
import {
  listAllFiles,
  listFiles,
  type DoodVideo,
} from "@/lib/doodstream";
import { pageMetadata } from "@/lib/seo";
import { withMeta } from "@/lib/videos";

const sorts = [
  { value: "new", label: "New" },
  { value: "views", label: "Most viewed" },
] as const;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const page = Math.max(Number(pageParam) || 1, 1);

  return pageMetadata({
    title: page > 1 ? `Movies – page ${page}` : "Movies",
    description:
      "Browse every video in the Lustora library, sorted by newest uploads or most viewed.",
    path: page > 1 ? `/movies?page=${page}` : "/movies",
  });
}

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const { page: pageParam, sort: sortParam } = await searchParams;
  const sort = sortParam === "views" ? "views" : "new";
  const requestedPage = Math.max(Number(pageParam) || 1, 1);

  let files: DoodVideo[];
  let totalPages: number;
  let page: number;

  if (sort === "views") {
    const all = await withMeta(await listAllFiles());
    all.sort((a, b) => Number(b.views) - Number(a.views));
    totalPages = Math.max(Math.ceil(all.length / 24), 1);
    page = Math.min(requestedPage, totalPages);
    files = all.slice((page - 1) * 24, page * 24);
  } else {
    const result = await listFiles({ page: requestedPage, perPage: 24 });
    totalPages = Math.max(result.total_pages, 1);
    page = Math.min(requestedPage, totalPages);
    files = await withMeta(result.files);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Movies</h1>
          <p className="text-sm text-muted-foreground">
            Every video in the library.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {sorts.map((option) => (
            <Link
              key={option.value}
              href={
                option.value === "views" ? "/movies?sort=views" : "/movies"
              }
              className={buttonVariants({
                variant: sort === option.value ? "default" : "outline",
                size: "sm",
              })}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <VideoGrid videos={files} />

      <Pagination
        page={page}
        totalPages={totalPages}
        hrefFor={(next) => {
          const params = new URLSearchParams();
          if (sort === "views") params.set("sort", "views");
          if (next > 1) params.set("page", String(next));

          const query = params.toString();
          return query ? `/movies?${query}` : "/movies";
        }}
      />
    </section>
  );
}

export const instant = false;
