import Link from "next/link";

import { pageMetadata } from "@/lib/seo";
import { listTags } from "@/lib/videos";

export const metadata = pageMetadata({
  title: "Categories",
  description:
    "Browse all Lustora categories and discover videos by tag.",
  path: "/categories",
});

export default async function CategoriesPage() {
  const tags = await listTags();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Browse the library by tag.
        </p>
      </div>

      {tags.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No categories yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <Link
              key={tag.name}
              href={`/categories/${encodeURIComponent(tag.name)}`}
              className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <p className="font-medium capitalize">{tag.name}</p>
              <p className="text-sm text-muted-foreground">
                {tag.count} {tag.count === 1 ? "video" : "videos"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export const instant = false;
