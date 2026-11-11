import Link from "next/link";
import { Suspense } from "react";

import Logo from "@/components/logo";
import SearchBar from "./search";
import { AccountNav } from "./account-nav";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between gap-4 px-4 lg:px-8"
      >
        <Link
          href="/"
          className="shrink-0 transition-opacity hover:opacity-80"
        >
          <Logo />
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <Suspense
            fallback={
              <div className="hidden h-9 w-56 rounded-full bg-muted/50 lg:block xl:w-72" />
            }
          >
            <SearchBar className="hidden w-56 lg:block xl:w-72" />
          </Suspense>
          <AccountNav />
        </div>
      </nav>

      <div className="border-t px-4 py-2 md:hidden">
        <Suspense
          fallback={<div className="h-9 w-full rounded-full bg-muted/50" />}
        >
          <SearchBar className="w-full" />
        </Suspense>
      </div>
    </header>
  );
};

export default Navbar;
