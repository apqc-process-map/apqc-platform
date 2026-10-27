import "server-only";
import { after } from "next/server";

/**
 * Slow server-render diagnostic. Runs AFTER the response so it does not block
 * TTFB, and deliberately omits route parameters, user IDs and private data.
 * It is a server-processing indicator, not a substitute for browser LCP/INP.
 */
export function noteSlowPage(route: string) {
  const startedAt = performance.now();
  after(() => {
    const elapsedMs = Math.round(performance.now() - startedAt);
    if (elapsedMs >= 850) {
      console.info(JSON.stringify({
        event: "apqc_slow_page",
        route,
        render_elapsed_ms: elapsedMs
      }));
    }
  });
}
