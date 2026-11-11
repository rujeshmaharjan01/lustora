import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-between gap-4"
    >
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Previous
        </Link>
      ) : (
        <span />
      )}

      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Next
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
