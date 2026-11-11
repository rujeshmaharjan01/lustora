import { VideoCard } from "@/components/web/video-card";
import type { DoodVideo } from "@/lib/doodstream";

export function VideoGrid({ videos }: { videos: DoodVideo[] }) {
  if (videos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No videos yet.
      </p>
    );
  }

  return (
    <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {videos.map((video) => (
        <VideoCard key={video.file_code} video={video} />
      ))}
    </div>
  );
}
