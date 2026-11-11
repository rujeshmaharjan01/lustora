import { auth } from "@/lib/auth";
import { initTRPC, TRPCError } from "@trpc/server";

/**
 * This context creator accepts `headers` so it can be reused in both
 * the RSC server caller (where you pass `next/headers`) and the
 * API route handler (where you pass the request headers).
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  return { headers: opts.headers };
};

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    /**
     * @see https://trpc.io/docs/server/data-transformers
     */
    // transformer: superjson,
  });

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = await auth.api.getSession({ headers: ctx.headers });

  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to do that",
    });
  }

  return next({ ctx: { ...ctx, session } });
});
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const role = (ctx.session.user as { role?: string | null }).role;

  if (role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action",
    });
  }

  return next();
});
