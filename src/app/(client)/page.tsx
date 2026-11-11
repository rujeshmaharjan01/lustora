
import Link from "next/link";

import { VideoGrid } from "@/components/web/video-grid";
import { buttonVariants } from "@/components/ui/button";
import { listAllFiles } from "@/lib/doodstream";
import { withMeta } from "@/lib/videos";

import { pageMetadata } from "@/lib/seo";

const HOME_TITLE = "Lustora";
const HOME_SUBTITLE = "Fresh from the library.";

export const metadata = pageMetadata({
  title: "Free Video Library",
  description:
    "Watch the newest and most viewed videos in the Lustora library. Browse categories, search the library, and save videos for later.",
  path: "/",
});

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: sortParam } = await searchParams;
  const sort = sortParam === "views" ? "views" : "new";

  const all = await withMeta(await listAllFiles());
  const videos = all
    .sort((a, b) =>
      sort === "views"
        ? Number(b.views) - Number(a.views)
        : b.uploaded.localeCompare(a.uploaded),
    )
    .slice(0, 12);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {HOME_TITLE}
          </h1>
          <p className="text-sm text-muted-foreground">{HOME_SUBTITLE}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className={buttonVariants({
              variant: sort === "new" ? "default" : "outline",
              size: "sm",
            })}
          >
            Latest
          </Link>
          <Link
            href="/?sort=views"
            className={buttonVariants({
              variant: sort === "views" ? "default" : "outline",
              size: "sm",
            })}
          >
            Most viewed
          </Link>
        </div>
      </div>

      <VideoGrid videos={videos} />
    </section>
  );
}

export const instant = false;
