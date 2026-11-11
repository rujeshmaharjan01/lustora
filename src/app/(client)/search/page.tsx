import { VideoGrid } from "@/components/web/video-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageMetadata } from "@/lib/seo";
import { searchLibrary } from "@/lib/videos";

export const metadata = pageMetadata({
  title: "Search",
  description: "Search the Lustora library by video title or tag.",
  path: "/search",
  noIndex: true,
});

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  // shortcut: search/videos has no pagination, so results stop at the API's default page size.
  const results = query ? await searchLibrary(query) : [];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground">
          Find a video by title or tag.
        </p>
      </div>

      <form action="/search" className="flex max-w-xl gap-2">
        <Input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search titles or tags..."
          aria-label="Search videos"
        />
        <Button type="submit">Search</Button>
      </form>

      {query ? (
        <>
          <p className="text-sm text-muted-foreground">
            {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;
            {query}&rdquo;
          </p>
          <VideoGrid videos={results} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Type a title or tag above to start searching.
        </p>
      )}
    </section>
  );
}

export const instant = false;
