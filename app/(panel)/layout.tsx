import { ThemeToggle } from "./_components/ThemeToggle";

// Panel data changes weekly via cron; always render fresh, never cache a build-time snapshot.
export const dynamic = "force-dynamic";

export default function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-page text-ink">
      <header className="flex items-center justify-between border-b border-line px-8 py-5">
        <div className="flex items-baseline gap-3">
          <span className="font-logo text-2xl tracking-[0.02em] text-ink">LOVU</span>
          <span className="font-subtitle text-xs uppercase tracking-[0.28em] text-muted">
            Market Intelligence
          </span>
        </div>
        <ThemeToggle />
      </header>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
