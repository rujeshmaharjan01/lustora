"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        DoodStream or the database did not respond. Try again in a moment.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
