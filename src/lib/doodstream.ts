import "server-only";
import dns from "node:dns";
import { z } from "zod";
import { doodstreamApiKey, doodstreamUrl } from "@/lib/DoodstreamUrl";

// DoodStream's Cloudflare IPs are often unreachable over IPv6 here.
dns.setDefaultResultOrder("ipv4first");

const videoSchema = z.object({
  file_code: z.string(),
  title: z.string(),
  length: z.string(),
  views: z.string(),
  uploaded: z.string(),
  single_img: z.string(),
  splash_img: z.string().optional(),
  canplay: z.union([z.number(), z.string()]).optional(),
});

export type DoodVideo = z.infer<typeof videoSchema>;

const folderSchema = z.object({
  fld_id: z.string(),
  name: z.string(),
  total_files: z.string().optional(),
  code: z.string().optional(),
});

export type DoodFolder = z.infer<typeof folderSchema>;

const accountSchema = z.object({
  email: z.string(),
  balance: z.string(),
  storage_used: z.string(),
  storage_left: z.string(),
  premim_expire: z.string().optional(), // DoodStream's spelling
});

export type DoodAccount = z.infer<typeof accountSchema>;

const fileInfoSchema = z.object({
  filecode: z.string(),
  title: z.string(),
  length: z.string(),
  views: z.string(),
  uploaded: z.string(),
  single_img: z.string(),
  splash_img: z.string().optional(),
  canplay: z.union([z.number(), z.string()]).optional(),
  size: z.string(),
  protected_embed: z.string(),
  protected_dl: z.string(),
});

export type DoodFileInfo = z.infer<typeof fileInfoSchema>;

const fileListSchema = z.object({
  files: z.array(videoSchema),
  total_pages: z.number().default(1),
  results_total: z.string().optional(),
});

export type DoodFileList = z.infer<typeof fileListSchema>;

const folderContentsSchema = z.object({
  folders: z.array(folderSchema).default([]),
  files: z.array(videoSchema).default([]),
});

export type DoodFolderContents = z.infer<typeof folderContentsSchema>;

function envelope<T extends z.ZodType>(result: T) {
  return z.object({
    msg: z.string(),
    status: z.coerce.number(),
    server_time: z.string().optional(),
    result,
  });
}

type Params = Record<string, string | number | undefined>;

const RETRIES = 2;

function retryable(status: number) {
  return status === 429 || status >= 500;
}

async function fetchDoodstream(url: URL, init: RequestInit, retry: boolean) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(15000),
      });

      if (!retry || attempt === RETRIES || !retryable(response.status)) {
        return response;
      }
    } catch (error) {
      if (!retry || attempt === RETRIES) {
        throw new Error(
          "DoodStream is temporarily unavailable. Try again in a moment.",
          { cause: error },
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
  }
}

async function request<T>(
  endpoint: string,
  result: z.ZodType<T>,
  params: Params = {},
  revalidate = 0,
  retry = true,
): Promise<T> {
  const url = new URL(doodstreamUrl(endpoint));

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const response = await fetchDoodstream(
    url,
    revalidate > 0 ? { next: { revalidate } } : { cache: "no-store" },
    retry,
  );

  if (!response.ok) {
    throw new Error(`DoodStream request failed (HTTP ${response.status})`);
  }

  const parsed = envelope(result).safeParse(await response.json());

  if (!parsed.success) {
    throw new Error("Unexpected response from DoodStream");
  }

  if (parsed.data.status !== 200) {
    throw new Error(parsed.data.msg || "DoodStream API failed");
  }

  return parsed.data.result;
}

export function getAccountInfo() {
  return request("account/info", accountSchema);
}

export function listFiles({
  page = 1,
  perPage = 24,
  folderId,
  revalidate = 0,
}: {
  page?: number;
  perPage?: number;
  folderId?: string;
  revalidate?: number;
} = {}) {
  return request(
    "file/list",
    fileListSchema,
    { page, per_page: perPage, fld_id: folderId },
    revalidate,
  );
}

// DoodStream's file/list has no sort parameter, so sorting by views needs every page.
export async function listAllFiles(maxPages = 10) {
  const first = await listFiles({ perPage: 200 });
  const pages = Math.min(Math.max(first.total_pages, 1), maxPages);
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      listFiles({ page: index + 2, perPage: 200 }),
    ),
  );

  return [first, ...rest].flatMap((result) => result.files);
}

export function searchFiles(query: string) {
  return request("search/videos", z.array(videoSchema), {
    search_term: query,
  });
}

// file/info can include per-code error entries even when other codes are valid.
function parseFileInfos(items: unknown[]): DoodFileInfo[] {
  return items.flatMap((item) => {
    const parsed = fileInfoSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

export async function getFile(code: string) {
  const files = await request(
    "file/info",
    z.array(z.unknown()),
    { file_code: code },
  );

  return parseFileInfos(files)[0] ?? null;
}

export function getFiles(codes: string[]) {
  if (codes.length === 0) return Promise.resolve([] as DoodFileInfo[]);

  return request(
    "file/info",
    z.array(z.unknown()),
    { file_code: codes.join(",") },
  ).then(parseFileInfos);
}

export function getFolder(folderId = "0") {
  return request("folder/list", folderContentsSchema, { fld_id: folderId });
}

// DoodStream has no file delete endpoint, so deletion stays in their dashboard.
export function renameFile(fileCode: string, title: string) {
  return request(
    "file/rename",
    z.unknown(),
    { file_code: fileCode, title },
    0,
    false,
  );
}

export function moveFile(fileCode: string, folderId: string) {
  return request(
    "file/move",
    z.unknown(),
    { file_code: fileCode, fld_id: folderId },
    0,
    false,
  );
}

export function createFolder(name: string) {
  return request(
    "folder/create",
    z.object({ fld_id: z.string() }),
    { name, parent_id: "0" },
    0,
    false,
  );
}

export async function findOrCreateFolder(name: string) {
  const { folders } = await getFolder("0");
  const existing = folders.find(
    (folder) => folder.name.toLowerCase() === name.toLowerCase(),
  );

  return existing?.fld_id ?? (await createFolder(name)).fld_id;
}

export function renameFolder(folderId: string, name: string) {
  return request(
    "folder/rename",
    z.unknown(),
    { fld_id: folderId, name },
    0,
    false,
  );
}

const uploadedFileSchema = z.object({
  filecode: z.string(),
  title: z.string().optional(),
});

export async function uploadFile(file: File) {
  // upload/server is a read, so it is safe to retry when Cloudflare flakes.
  const server = await request("upload/server", z.string(), {}, 0, true);

  const form = new FormData();
  form.append("api_key", doodstreamApiKey());
  form.append("file", file, file.name);

  const response = await fetch(server, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(30 * 60 * 1000),
  }).catch((error) => {
    throw new Error(
      "DoodStream upload is temporarily unavailable. Try again in a moment.",
      { cause: error },
    );
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      msg?: string;
    } | null;

    throw new Error(
      body?.msg || `DoodStream upload failed (HTTP ${response.status})`,
    );
  }

  const parsed = envelope(
    z.union([z.array(uploadedFileSchema).min(1), uploadedFileSchema]),
  ).safeParse(await response.json());

  if (!parsed.success) {
    throw new Error("Unexpected response from DoodStream");
  }

  if (parsed.data.status !== 200) {
    throw new Error(parsed.data.msg || "DoodStream upload failed");
  }

  return Array.isArray(parsed.data.result)
    ? parsed.data.result[0]
    : parsed.data.result;
}

