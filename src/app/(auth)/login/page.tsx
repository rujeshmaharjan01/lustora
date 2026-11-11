import { redirect } from "next/navigation";

import Logo from "@/components/logo";
import { safeNextPath } from "@/lib/safe-next";
import { getSession } from "@/lib/session";
import LoginForm from "./login-form";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next);
  const session = await getSession();

  if (session) {
    const role = (session.user as { role?: string | null }).role;
    redirect(next ?? (role === "admin" ? "/admin" : "/"));
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>
        <LoginForm next={next} />
      </div>
    </main>
  );
}

export const instant = false;
