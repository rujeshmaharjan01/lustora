import Link from "next/link";

import { formatCount, formatDuration } from "@/lib/format";
import type { DoodVideo } from "@/lib/doodstream";

export function VideoCard({ video }: { video: DoodVideo }) {
  return (
    <Link href={`/watch/${video.file_code}`} className="group space-y-2">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        {/* DoodStream thumbnail domains change, so skip next/image. */}
        <img
          src={video.single_img}
          alt={video.title}
          loading="lazy"
          className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
        />
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
          {formatDuration(video.length)}
        </span>
      </div>
      <div>
        <h3 className="line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-primary">
          {video.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatCount(video.views)} views · {video.uploaded.slice(0, 10)}
        </p>
      </div>
    </Link>
  );
}
