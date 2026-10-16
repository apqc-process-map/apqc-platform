"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="route-error" role="alert">
      <p className="section-kicker">PROCESS MAP</p>
      <h1>Unable to load this page</h1>
      <p>A temporary data error occurred. Please try again.</p>
      <button className="primary-button" onClick={() => reset()}>Try again</button>
    </main>
  );
}
