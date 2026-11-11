import "server-only";

import { prisma } from "@/lib/prisma";
import {
  getFiles,
  listAllFiles,
  listFiles,
  searchFiles,
  type DoodFileInfo,
  type DoodVideo,
} from "@/lib/doodstream";

function fromFileInfo(file: DoodFileInfo): DoodVideo {
  return {
    file_code: file.filecode,
    title: file.title,
    length: file.length,
    views: file.views,
    uploaded: file.uploaded,
    single_img: file.single_img,
    splash_img: file.splash_img,
    canplay: file.canplay,
  };
}

export async function withMeta(videos: DoodVideo[]): Promise<DoodVideo[]> {
  if (videos.length === 0) return videos;

  const codes = videos.map((video) => video.file_code);
  const [metas, hidden] = await Promise.all([
    prisma.videoMeta.findMany({
      where: { fileCode: { in: codes } },
      select: { fileCode: true, title: true, thumbnail: true },
    }),
    prisma.hiddenVideo.findMany({
      where: { fileCode: { in: codes } },
      select: { fileCode: true },
    }),
  ]);
  const hiddenCodes = new Set(hidden.map((video) => video.fileCode));
  const titles = new Map(metas.map((meta) => [meta.fileCode, meta.title]));
  const thumbnails = new Map(
    metas
      .filter((meta) => meta.thumbnail)
      .map((meta) => [meta.fileCode, meta.thumbnail!]),
  );

  return videos
    .filter((video) => !hiddenCodes.has(video.file_code))
    .map((video) => ({
      ...video,
      title: titles.get(video.file_code) ?? video.title,
      single_img: thumbnails.get(video.file_code) ?? video.single_img,
    }));
}

export async function getVideosByCodes(codes: string[]) {
  if (codes.length === 0) return [];

  const files = await getFiles(codes.slice(0, 50));
  const byCode = new Map(files.map((file) => [file.filecode, file]));
  const videos = codes
    .map((code) => byCode.get(code))
    .filter((file): file is DoodFileInfo => file !== undefined)
    .map(fromFileInfo);

  return withMeta(videos);
}

export async function listTags() {
  const [metas, hidden, files] = await Promise.all([
    prisma.videoMeta.findMany({ select: { fileCode: true, tags: true } }),
    prisma.hiddenVideo.findMany({ select: { fileCode: true } }),
    listAllFiles(),
  ]);
  const existing = new Set(files.map((file) => file.file_code));
  const hiddenCodes = new Set(hidden.map((video) => video.fileCode));
  const counts = new Map<string, number>();

  for (const meta of metas) {
    if (hiddenCodes.has(meta.fileCode) || !existing.has(meta.fileCode)) continue;
    for (const tag of meta.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getVideosByTag(tag: string, page = 1, perPage = 24) {
  const [metas, hidden, files] = await Promise.all([
    prisma.videoMeta.findMany({
      where: { tags: { has: tag } },
      orderBy: { createdAt: "desc" },
      select: { fileCode: true },
    }),
    prisma.hiddenVideo.findMany({ select: { fileCode: true } }),
    listAllFiles(),
  ]);
  const existing = new Set(files.map((file) => file.file_code));
  const hiddenCodes = new Set(hidden.map((video) => video.fileCode));
  const codes = metas
    .map((meta) => meta.fileCode)
    .filter((code) => existing.has(code) && !hiddenCodes.has(code));

  const totalPages = Math.max(Math.ceil(codes.length / perPage), 1);
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const videos = await getVideosByCodes(
    codes.slice((currentPage - 1) * perPage, currentPage * perPage),
  );

  return { videos, page: currentPage, totalPages, total: codes.length };
}

export async function searchLibrary(query: string) {
  const [remote, metas] = await Promise.all([
    searchFiles(query),
    prisma.videoMeta.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { tags: { has: query.toLowerCase() } },
        ],
      },
      select: { fileCode: true },
      take: 24,
    }),
  ]);

  const [remoteVideos, localVideos] = await Promise.all([
    withMeta(remote),
    getVideosByCodes(metas.map((meta) => meta.fileCode)),
  ]);

  const seen = new Set<string>();
  const merged: DoodVideo[] = [];

  for (const video of [...localVideos, ...remoteVideos]) {
    if (seen.has(video.file_code)) continue;
    seen.add(video.file_code);
    merged.push(video);
  }

  return merged;
}

export async function getRelatedVideos(
  fileCode: string,
  tags: string[],
  limit = 5,
) {
  const tagged = tags.length
    ? await prisma.videoMeta.findMany({
        where: { fileCode: { not: fileCode }, tags: { hasSome: tags } },
        orderBy: { updatedAt: "desc" },
        select: { fileCode: true },
        take: limit,
      })
    : [];

  const videos = await getVideosByCodes(tagged.map((meta) => meta.fileCode));
  if (videos.length >= limit) return videos;

  const { files } = await listFiles({ perPage: 100 });
  const seen = new Set([fileCode, ...videos.map((video) => video.file_code)]);

  for (const file of files) {
    if (videos.length >= limit) break;
    if (seen.has(file.file_code)) continue;
    seen.add(file.file_code);
    videos.push(file);
  }

  return withMeta(videos);
}

export async function getSavedVideos(userId: string) {
  const saves = await prisma.videoSave.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { fileCode: true },
    take: 50,
  });

  return getVideosByCodes(saves.map((save) => save.fileCode));
}
