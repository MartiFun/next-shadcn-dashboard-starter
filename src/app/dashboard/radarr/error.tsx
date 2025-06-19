"use client";
import * as Sentry from "@sentry/nextjs";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  // Report error to Sentry
  Sentry.captureException(error);

  return (
    <div style={{ padding: 32, textAlign: "center" }}>
      <h2>Something went wrong!</h2>
      <pre style={{ color: "red", margin: 16 }}>{error.message}</pre>
      <button onClick={() => reset()} style={{ marginTop: 16, padding: "8px 16px" }}>
        Try again
      </button>
    </div>
  );
} 