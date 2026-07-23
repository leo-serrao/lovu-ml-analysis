// Panel data changes weekly via cron; always render fresh, never cache a build-time snapshot.
export const dynamic = "force-dynamic";

export default function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 px-8 py-4 dark:border-zinc-800">
        <h1 className="text-lg font-semibold text-black dark:text-zinc-50">
          Lovu — Market Intelligence
        </h1>
      </header>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
