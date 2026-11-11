"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type UploadResult = {
  filecode: string;
  title: string;
  warning?: string;
};

type Frame = { blob: Blob; url: string };

const FRAME_POSITIONS = [0.05, 0.2, 0.35, 0.5, 0.65, 0.8];

async function captureFrames(file: File): Promise<Blob[]> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");

  try {
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not read the video."));
    });

    if (
      !video.videoWidth ||
      !Number.isFinite(video.duration) ||
      video.duration <= 0
    ) {
      throw new Error("Could not read the video.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.min(video.videoWidth, 640);
    canvas.height = Math.round(
      (canvas.width / video.videoWidth) * video.videoHeight,
    );
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not read the video.");

    const blobs: Blob[] = [];

    for (const position of FRAME_POSITIONS) {
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error("Could not read the video."));
        video.currentTime = video.duration * position;
      });

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.82),
      );
      if (blob) blobs.push(blob);
    }

    return blobs;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function UploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const captureId = useRef(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<UploadResult | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [selectedFrame, setSelectedFrame] = useState(0);
  const [readingFrames, setReadingFrames] = useState(false);
  const [framesError, setFramesError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      for (const frame of frames) URL.revokeObjectURL(frame.url);
    };
  }, [frames]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const capture = ++captureId.current;

    setFrames([]);
    setSelectedFrame(0);
    setFramesError(null);

    if (!file) return;

    setReadingFrames(true);

    try {
      const blobs = await captureFrames(file);
      if (capture !== captureId.current) return;

      if (blobs.length === 0) {
        setFramesError("Could not read frames from this video.");
        return;
      }

      setFrames(
        blobs.map((blob) => ({ blob, url: URL.createObjectURL(blob) })),
      );
    } catch {
      if (capture === captureId.current) {
        setFramesError(
          "Could not read frames from this video. You can still upload without a custom thumbnail.",
        );
      }
    } finally {
      if (capture === captureId.current) setReadingFrames(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setUploaded(null);

    const formData = new FormData(event.currentTarget);
    const selected = frames[selectedFrame];

    if (selected) {
      formData.append("thumbnail", selected.blob, "thumbnail.jpg");
    }

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => ({}))) as
        | UploadResult
        | { error?: string };

      if (!response.ok || !("filecode" in data)) {
        setError("error" in data && data.error ? data.error : "Upload failed");
      } else {
        setUploaded(data);
        setFrames([]);
        formRef.current?.reset();
        router.refresh();
      }
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="upload-title">Title</Label>
        <Input
          id="upload-title"
          name="title"
          maxLength={200}
          placeholder="Video title"
          required
        />
        <p className="text-xs text-muted-foreground">
          Used as the video title on the site and in DoodStream.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="upload-description">Description</Label>
        <Textarea
          id="upload-description"
          name="description"
          rows={4}
          maxLength={5000}
          placeholder="What is this video about?"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="upload-tags">Tags (optional)</Label>
        <Input
          id="upload-tags"
          name="tags"
          placeholder="tag-one, tag-two, tag-three"
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to upload without a category. The first tag is also used
          as the DoodStream folder.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="upload-file">Video file</Label>
        <Input
          id="upload-file"
          type="file"
          name="file"
          accept="video/*"
          required
          className="max-w-full"
          onChange={handleFileChange}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Thumbnail (optional)</Label>
        <p className="text-xs text-muted-foreground">
          Frames are read from the selected video in your browser. DoodStream&apos;s
          own thumbnail is unchanged.
        </p>
        {readingFrames && (
          <p className="text-xs text-muted-foreground">Reading frames...</p>
        )}
        {framesError && <p className="text-xs text-destructive">{framesError}</p>}
        {frames.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {frames.map((frame, index) => (
                <button
                  key={frame.url}
                  type="button"
                  aria-label={`Use frame ${index + 1} as the thumbnail`}
                  aria-pressed={index === selectedFrame}
                  onClick={() =>
                    setSelectedFrame(index === selectedFrame ? -1 : index)
                  }
                  className={`overflow-hidden rounded-md border-2 transition-colors ${
                    index === selectedFrame
                      ? "border-primary"
                      : "border-transparent hover:border-muted-foreground/40"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={frame.url}
                    alt=""
                    className="aspect-video w-full object-cover"
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Pick a frame, or click it again to use DoodStream&apos;s thumbnail.
            </p>
          </>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {uploaded && (
        <div className="space-y-1 rounded-lg border p-3 text-sm">
          <p>
            Uploaded{" "}
            <Link
              href={`/watch/${uploaded.filecode}`}
              className="font-medium hover:text-primary"
            >
              {uploaded.title}
            </Link>
            .
          </p>
          {uploaded.warning && (
            <p className="text-destructive">{uploaded.warning}</p>
          )}
        </div>
      )}

      <Button type="submit" disabled={pending || readingFrames}>
        {pending ? "Uploading..." : "Upload video"}
      </Button>
    </form>
  );
}
