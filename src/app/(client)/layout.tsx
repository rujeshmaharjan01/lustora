import Navbar from "@/components/web/navbar/Navbar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-8 lg:px-8">
        {children}
      </main>
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 py-6 text-sm text-muted-foreground lg:px-8">
          <span>Lustora</span>
        </div>
      </footer>
    </div>
  );
}
