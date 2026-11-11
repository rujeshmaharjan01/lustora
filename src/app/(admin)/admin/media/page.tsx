import Link from "next/link";

import { MediaManager } from "@/components/admin/media-manager";
import { Pagination } from "@/components/web/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFolder, listFiles, searchFiles } from "@/lib/doodstream";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Media" };

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const query = (q ?? "").trim();
  const requestedPage = Math.max(Number(pageParam) || 1, 1);

  const [folders, result] = await Promise.all([
    getFolder("0"),
    query
      ? searchFiles(query).then((files) => ({
          files,
          total_pages: 1,
          results_total: String(files.length),
        }))
      : listFiles({ page: requestedPage, perPage: 20, revalidate: 0 }),
  ]);

  const totalPages = Math.max(result.total_pages, 1);
  const page = Math.min(requestedPage, totalPages);
  const hidden = await prisma.hiddenVideo.findMany({
    where: { fileCode: { in: result.files.map((file) => file.file_code) } },
    select: { fileCode: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Media</h1>
          <p className="text-sm text-muted-foreground">
            {result.results_total ?? result.files.length} videos
            {query ? ` matching "${query}"` : ""}
          </p>
        </div>

        <form action="/admin/media" className="flex w-full max-w-md gap-2">
          <Input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search titles..."
            aria-label="Search videos"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      {query && (
        <Link
          href="/admin/media"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Clear search
        </Link>
      )}

      <MediaManager
        files={result.files}
        folders={folders.folders}
        hiddenFileCodes={hidden.map((video) => video.fileCode)}
      />

      {!query && (
        <Pagination
          page={page}
          totalPages={totalPages}
          hrefFor={(next) =>
            next === 1 ? "/admin/media" : `/admin/media?page=${next}`
          }
        />
      )}
    </div>
  );
}

export const instant = false;
