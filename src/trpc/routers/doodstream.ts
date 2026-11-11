import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createFolder,
  moveFile,
  renameFile,
  renameFolder,
} from "@/lib/doodstream";
import { prisma } from "@/lib/prisma";
import { adminProcedure, createTRPCRouter } from "@/trpc/init";

async function attempt<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (error) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message:
        error instanceof Error ? error.message : "DoodStream request failed",
    });
  }
}

export const DoodStream = createTRPCRouter({
  renameFile: adminProcedure
    .input(z.object({ fileCode: z.string().min(1), title: z.string().trim().min(1) }))
    .mutation(({ input }) => attempt(() => renameFile(input.fileCode, input.title))),

  moveFile: adminProcedure
    .input(z.object({ fileCode: z.string().min(1), folderId: z.string().min(1) }))
    .mutation(({ input }) => attempt(() => moveFile(input.fileCode, input.folderId))),

  createFolder: adminProcedure
    .input(z.object({ name: z.string().trim().min(1) }))
    .mutation(({ input }) => attempt(() => createFolder(input.name))),

  renameFolder: adminProcedure
    .input(z.object({ folderId: z.string().min(1), name: z.string().trim().min(1) }))
    .mutation(({ input }) => attempt(() => renameFolder(input.folderId, input.name))),

  // DoodStream has no delete endpoint, so "delete" only hides the video on the site.
  setHidden: adminProcedure
    .input(
      z.object({ fileCode: z.string().min(1), hidden: z.boolean() }),
    )
    .mutation(async ({ input }) => {
      if (input.hidden) {
        await prisma.hiddenVideo.upsert({
          where: { fileCode: input.fileCode },
          create: { fileCode: input.fileCode },
          update: {},
        });
      } else {
        await prisma.hiddenVideo.deleteMany({
          where: { fileCode: input.fileCode },
        });
      }
    }),
});
