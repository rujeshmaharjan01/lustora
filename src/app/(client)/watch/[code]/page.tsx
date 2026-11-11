import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { VideoActions } from "@/components/web/video-actions";
import { VideoComments } from "@/components/web/video-comments";
import { VideoGrid } from "@/components/web/video-grid";
import { getFile } from "@/lib/doodstream";
import { formatBytes, formatCount } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, siteName } from "@/lib/seo";
import { getSession } from "@/lib/session";
import { getRelatedVideos } from "@/lib/videos";

function absoluteDoodstreamUrl(path: string) {
  return path.startsWith("http") ? path : `https://dood.to${path}`;
}

const getWatchData = cache(async (code: string) => {
  const file = await getFile(code);
  if (!file) return null;

  const [meta, hidden] = await Promise.all([
    prisma.videoMeta.findUnique({ where: { fileCode: code } }),
    prisma.hiddenVideo.findUnique({ where: { fileCode: code } }),
  ]);

  if (hidden) return null;

  return { file, meta, title: meta?.title || file.title };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const data = await getWatchData(code);

  if (!data) {
    return {
      title: "Video not found",
      robots: { index: false, follow: false },
    };
  }

  const { file, meta, title } = data;
  const description =
    meta?.description.trim() || `Watch ${title} on Lustora.`;
  const images = [
    meta?.thumbnail ? absoluteUrl(meta.thumbnail) : file.single_img,
  ];

  return {
    title,
    description,
    alternates: { canonical: `/watch/${code}` },
    openGraph: {
      type: "video.other",
      title,
      description,
      url: `/watch/${code}`,
      siteName,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const data = await getWatchData(code);

  if (!data) notFound();

  const { file, meta, title } = data;
  const session = await getSession();
  const userId = session?.user.id;

  const [comments, likeCount, like, save, related] = await Promise.all([
    prisma.videoComment.findMany({
      where: { fileCode: code },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { name: true } } },
    }),
    prisma.videoLike.count({ where: { fileCode: code } }),
    userId
      ? prisma.videoLike.findUnique({
          where: { userId_fileCode: { userId, fileCode: code } },
        })
      : null,
    userId
      ? prisma.videoSave.findUnique({
          where: { userId_fileCode: { userId, fileCode: code } },
        })
      : null,
    getRelatedVideos(code, meta?.tags ?? []),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: title,
    description: meta?.description.trim() || `Watch ${title} on Lustora.`,
    thumbnailUrl: [
      meta?.thumbnail ? absoluteUrl(meta.thumbnail) : file.single_img,
    ],
    uploadDate: file.uploaded.slice(0, 10),
    duration: /^\d+$/.test(file.length) ? `PT${file.length}S` : undefined,
    embedUrl: absoluteDoodstreamUrl(file.protected_embed),
  };

  return (
    <article className="mx-auto max-w-5xl space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="aspect-video overflow-hidden rounded-lg border bg-black">
        <iframe
          src={absoluteDoodstreamUrl(file.protected_embed)}
          title={title}
          allowFullScreen
          className="h-full w-full"
        />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatCount(file.views)} views · {file.uploaded.slice(0, 10)} ·{" "}
            {formatBytes(file.size)}
          </p>

          {meta?.description && (
            <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
              {meta.description}
            </p>
          )}

          {meta && meta.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {meta.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="transition-opacity hover:opacity-80"
                >
                  <Badge variant="outline">#{tag}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link
          href={absoluteDoodstreamUrl(file.protected_dl)}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Download />
          Download
        </Link>
      </div>

      <VideoActions
        fileCode={code}
        title={title}
        signedIn={Boolean(session)}
        liked={Boolean(like)}
        saved={Boolean(save)}
        likeCount={likeCount}
      />

      <VideoComments
        fileCode={code}
        signedIn={Boolean(session)}
        comments={comments.map((comment) => ({
          id: comment.id,
          body: comment.body,
          userName: comment.user.name,
          createdAt: comment.createdAt.toISOString(),
        }))}
      />

      {related.length > 0 && (
        <section className="space-y-4 border-t pt-6">
          <h2 className="text-lg font-medium">Related videos</h2>
          <VideoGrid videos={related} />
        </section>
      )}
    </article>
  );
}

export const instant = false;
