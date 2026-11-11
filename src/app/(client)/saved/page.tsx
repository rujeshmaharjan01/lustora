import { redirect } from "next/navigation";

import { VideoGrid } from "@/components/web/video-grid";
import { getSession } from "@/lib/session";
import { pageMetadata } from "@/lib/seo";
import { getSavedVideos } from "@/lib/videos";

export const metadata = pageMetadata({
  title: "Saved videos",
  description: "Videos you saved for later on Lustora.",
  path: "/saved",
  noIndex: true,
});

export default async function SavedPage() {
  const session = await getSession();

  if (!session) redirect("/login?next=/saved");

  const videos = await getSavedVideos(session.user.id);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Saved videos</h1>
        <p className="text-sm text-muted-foreground">
          Videos you bookmarked for later.
        </p>
      </div>

      <VideoGrid videos={videos} />
    </section>
  );
}

export const instant = false;
