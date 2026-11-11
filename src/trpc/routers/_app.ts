import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { DoodStream } from "./doodstream";
import { engagementRouter } from "./engagement";

export const appRouter = createTRPCRouter({
  doodStream: DoodStream,
  engagement: engagementRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
