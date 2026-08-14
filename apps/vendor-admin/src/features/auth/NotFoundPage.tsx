export function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 text-[var(--color-text)]">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-sm text-[var(--color-text-muted)]">This page doesn&apos;t exist.</p>
    </div>
  );
}
