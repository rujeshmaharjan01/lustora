import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { findOrCreateFolder, moveFile, renameFile, uploadFile } from "@/lib/doodstream";

export async function POST(request: Request) {
  const session = await getSession();
  const role = (session?.user as { role?: string | null } | undefined)?.role;

  if (!session || role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const tags = [
      ...new Set(
        String(form.get("tags") ?? "")
          .split(",")
          .map((tag) => tag.trim().replace(/^#/, "").toLowerCase())
          .filter(Boolean),
      ),
    ];

    if (!(file instanceof File) || file.size === 0) {
      return Response.json(
        { error: "Choose a video file to upload." },
        { status: 400 },
      );
    }

    if (!title) {
      return Response.json({ error: "Title is required." }, { status: 400 });
    }

    if (title.length > 200) {
      return Response.json(
        { error: "Title must be 200 characters or fewer." },
        { status: 400 },
      );
    }

    if (description.length > 5000) {
      return Response.json(
        { error: "Description must be 5000 characters or fewer." },
        { status: 400 },
      );
    }

    if (tags.length > 20 || tags.some((tag) => tag.length > 40)) {
      return Response.json(
        { error: "Use at most 20 tags of 40 characters each." },
        { status: 400 },
      );
    }

    const thumbnail = form.get("thumbnail");
    const hasThumbnail = thumbnail instanceof File && thumbnail.size > 0;

    if (
      hasThumbnail &&
      (thumbnail.type !== "image/jpeg" || thumbnail.size > 1_000_000)
    ) {
      return Response.json(
        { error: "The thumbnail must be a JPEG under 1 MB." },
        { status: 400 },
      );
    }

    const uploaded = await uploadFile(file);
    let renameFailed = false;

    // DoodStream would keep the original file name, so the typed title overwrites it.
    try {
      await renameFile(uploaded.filecode, title);
    } catch (error) {
      renameFailed = true;
      console.error(
        "Renaming the video on DoodStream failed:",
        error instanceof Error ? error.message : error,
      );
    }

    let thumbnailPath: string | undefined;

    if (hasThumbnail) {
      try {
        const directory = path.join(process.cwd(), "public", "thumbnails");
        await mkdir(directory, { recursive: true });
        await writeFile(
          path.join(directory, `${uploaded.filecode}.jpg`),
          Buffer.from(await (thumbnail as File).arrayBuffer()),
        );
        thumbnailPath = `/thumbnails/${uploaded.filecode}.jpg`;
      } catch (error) {
        // Best effort: a missing thumbnail should not lose the uploaded video.
        console.error(
          "Saving the thumbnail failed:",
          error instanceof Error ? error.message : error,
        );
      }
    }

    // The site title is stored locally too, so titles survive DoodStream hiccups.
    try {
      await prisma.videoMeta.upsert({
        where: { fileCode: uploaded.filecode },
        create: {
          fileCode: uploaded.filecode,
          title,
          description,
          tags,
          thumbnail: thumbnailPath,
        },
        update: {
          title,
          description,
          tags,
          ...(thumbnailPath ? { thumbnail: thumbnailPath } : {}),
        },
      });
    } catch (error) {
      console.error(
        "Saving video metadata failed:",
        error instanceof Error ? error.message : error,
      );

      return Response.json({
        filecode: uploaded.filecode,
        title,
        warning:
          "Video uploaded, but the title, description and tags were not saved.",
      });
    }

    const folderName = tags[0];

    if (folderName) {
      try {
        const folderId = await findOrCreateFolder(folderName);
        await moveFile(uploaded.filecode, folderId);
      } catch (error) {
        // Best effort: the video is already uploaded, so keep it in the root folder.
        console.error(
          "Moving video into its category folder failed:",
          error instanceof Error ? error.message : error,
        );
      }
    }

    return Response.json({
      filecode: uploaded.filecode,
      title,
      ...(renameFailed
        ? {
            warning:
              "Video uploaded, but DoodStream kept the original file name.",
          }
        : {}),
    });
  } catch (error) {
    console.error("Upload failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 502 },
    );
  }
}
