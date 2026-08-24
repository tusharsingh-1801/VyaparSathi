// Supabase/PostgREST errors are plain objects ({ message, code, details, hint }),
// not JS Error instances, so a naive `err instanceof Error` check misses them.
export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof (err as any).message === "string") {
    return (err as any).message;
  }
  return "Unknown error.";
}
