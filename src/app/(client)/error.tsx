"use client";

import { Button } from "@/components/ui/button";

export default function ClientError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Couldn&apos;t load videos</h1>
      <p className="text-sm text-muted-foreground">
        The library is temporarily unavailable. Try again in a moment.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
