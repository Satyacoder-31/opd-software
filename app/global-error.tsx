"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
              Application error
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
              Dr Orthos encountered a problem
            </h1>
            <p className="max-w-md text-sm text-neutral-600">
              Please refresh the page. If the problem continues, contact support.
            </p>
          </div>

          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
