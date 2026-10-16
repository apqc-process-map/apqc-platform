export default function Loading() {
  return (
    <main className="route-loading" aria-live="polite" aria-busy="true">
      <div className="loading-spinner" aria-hidden="true" />
      <p>Loading Process Map...</p>
    </main>
  );
}
