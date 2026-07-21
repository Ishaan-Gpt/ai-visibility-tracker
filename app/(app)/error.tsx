"use client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-border bg-white p-6 text-center">
      <h2 className="mb-2 text-lg font-semibold text-foreground">Something went wrong</h2>
      <p className="mb-4 text-sm text-muted">{error.message || "Please try again."}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
      >
        Try again
      </button>
    </div>
  );
}
