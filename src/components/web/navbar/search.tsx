"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

const SearchBar = ({ className }: { className?: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(
    searchParams.get("q") ?? ""
  );

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const searchQuery = query.trim();

    if (!searchQuery) return;

    const params = new URLSearchParams();
    params.set("q", searchQuery);

    router.push(`/search?${params.toString()}`);
  };

  const clearSearch = () => {
    setQuery("");
  };

  return (
    <form
      role="search"
      onSubmit={handleSearch}
      className={cn("relative", className)}
    >
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />

      <Input
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search titles or tags..."
        aria-label="Search movies and series"
        autoComplete="off"
        className="h-9 rounded-full bg-muted/50 pl-9 pr-9"
      />

      {query.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={clearSearch}
          aria-label="Clear search"
          className="absolute right-1 top-1/2 size-7 -translate-y-1/2 rounded-full"
        >
          <X className="size-4" />
        </Button>
      )}
    </form>
  );
};

export default SearchBar;