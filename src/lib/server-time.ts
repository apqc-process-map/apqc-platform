import "server-only";

export async function getServerTimestamp() {
  return Date.now();
}
