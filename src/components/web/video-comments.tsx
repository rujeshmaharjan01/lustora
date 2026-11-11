"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client";

export type VideoCommentItem = {
  id: string;
  body: string;
  userName: string;
  createdAt: string;
};

export function VideoComments({
  fileCode,
  signedIn,
  comments,
}: {
  fileCode: string;
  signedIn: boolean;
  comments: VideoCommentItem[];
}) {
  const router = useRouter();
  const trpc = useTRPC();
  const [body, setBody] = useState("");

  const addComment = useMutation(
    trpc.engagement.addComment.mutationOptions({
      onSuccess: () => {
        setBody("");
        router.refresh();
      },
    }),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addComment.mutate({ fileCode, body });
  }

  return (
    <section className="space-y-4 border-t pt-6">
      <h2 className="text-lg font-medium">
        Comments{comments.length > 0 ? ` (${comments.length})` : ""}
      </h2>

      {signedIn ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Add a comment..."
            aria-label="Comment"
            maxLength={2000}
            rows={3}
            required
          />
          {addComment.error && (
            <p className="text-sm text-destructive">
              {addComment.error.message}
            </p>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={addComment.isPending || !body.trim()}
          >
            {addComment.isPending ? "Posting..." : "Post comment"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link
            href={`/login?next=${encodeURIComponent(`/watch/${fileCode}`)}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>{" "}
          to like, save and comment.
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{comment.userName}</span>
                <span className="text-xs text-muted-foreground">
                  {comment.createdAt.slice(0, 10)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-line break-words text-sm">
                {comment.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
