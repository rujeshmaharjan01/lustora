"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Bookmark, Heart, Share2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

export function VideoActions({
  fileCode,
  title,
  signedIn,
  liked: initialLiked,
  saved: initialSaved,
  likeCount: initialLikeCount,
}: {
  fileCode: string;
  title: string;
  signedIn: boolean;
  liked: boolean;
  saved: boolean;
  likeCount: number;
}) {
  const router = useRouter();
  const trpc = useTRPC();
  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(initialSaved);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [copied, setCopied] = useState(false);

  const loginHref = `/login?next=${encodeURIComponent(`/watch/${fileCode}`)}`;
  const likeLabel = likeCount > 0 ? `Like ${likeCount}` : "Like";

  const like = useMutation(
    trpc.engagement.toggleLike.mutationOptions({
      onSuccess: (result) => {
        setLiked(result.liked);
        setLikeCount(result.count);
        router.refresh();
      },
    }),
  );

  const save = useMutation(
    trpc.engagement.toggleSave.mutationOptions({
      onSuccess: (result) => {
        setSaved(result.saved);
        router.refresh();
      },
    }),
  );

  async function share() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Dismissing the share sheet is not an error worth showing.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {signedIn ? (
        <Button
          variant={liked ? "default" : "outline"}
          size="sm"
          disabled={like.isPending}
          onClick={() => like.mutate({ fileCode })}
        >
          <Heart className={liked ? "fill-current" : undefined} />
          {likeLabel}
        </Button>
      ) : (
        <Link
          href={loginHref}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Heart />
          {likeLabel}
        </Link>
      )}

      {signedIn ? (
        <Button
          variant={saved ? "default" : "outline"}
          size="sm"
          disabled={save.isPending}
          onClick={() => save.mutate({ fileCode })}
        >
          <Bookmark className={saved ? "fill-current" : undefined} />
          {saved ? "Saved" : "Save"}
        </Button>
      ) : (
        <Link
          href={loginHref}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Bookmark />
          Save
        </Link>
      )}

      <Button variant="outline" size="sm" onClick={share}>
        <Share2 />
        {copied ? "Link copied" : "Share"}
      </Button>

      {(like.error || save.error) && (
        <p className="w-full text-sm text-destructive">
          {like.error?.message ?? save.error?.message}
        </p>
      )}
    </div>
  );
}
