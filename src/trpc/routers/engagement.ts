import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

const fileCode = z.string().trim().min(1).max(64);

export const engagementRouter = createTRPCRouter({
  addComment: protectedProcedure
    .input(
      z.object({
        fileCode,
        body: z.string().trim().min(1).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await prisma.videoComment.create({
        data: {
          fileCode: input.fileCode,
          body: input.body,
          userId: ctx.session.user.id,
        },
      });

      return { id: comment.id };
    }),

  toggleLike: protectedProcedure
    .input(z.object({ fileCode }))
    .mutation(async ({ ctx, input }) => {
      const key = {
        userId_fileCode: {
          userId: ctx.session.user.id,
          fileCode: input.fileCode,
        },
      };
      const existing = await prisma.videoLike.findUnique({ where: key });

      if (existing) {
        await prisma.videoLike.delete({ where: key });
      } else {
        await prisma.videoLike.create({
          data: { userId: ctx.session.user.id, fileCode: input.fileCode },
        });
      }

      const count = await prisma.videoLike.count({
        where: { fileCode: input.fileCode },
      });

      return { liked: !existing, count };
    }),

  toggleSave: protectedProcedure
    .input(z.object({ fileCode }))
    .mutation(async ({ ctx, input }) => {
      const key = {
        userId_fileCode: {
          userId: ctx.session.user.id,
          fileCode: input.fileCode,
        },
      };
      const existing = await prisma.videoSave.findUnique({ where: key });

      if (existing) {
        await prisma.videoSave.delete({ where: key });
      } else {
        await prisma.videoSave.create({
          data: { userId: ctx.session.user.id, fileCode: input.fileCode },
        });
      }

      return { saved: !existing };
    }),
});
