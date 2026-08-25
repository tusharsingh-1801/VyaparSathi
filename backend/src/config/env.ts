import dotenv from "dotenv";
import dns from "node:dns";

dotenv.config();

// Some networks advertise NAT64 IPv6 addresses for Supabase/Sarvam that aren't actually
// routable here, and Node's fetch tries them before falling back to IPv4 — adding several
// seconds of stall (or an outright ENOTFOUND) to every outbound call. Forcing IPv4 first
// avoids that detour. Must run before any fetch/supabase-js call, so this file (imported
// first, see server.ts) is the right place.
dns.setDefaultResultOrder("ipv4first");

// Fail fast and loud if the backend cannot talk to Supabase — nothing else works without it.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable "${name}". Copy .env.example to .env and fill it in.`
    );
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT) || 4000,
  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),

  // Sarvam is required for /api/business/analyze and /api/ai/test, but the server
  // can still boot without it so /api/health keeps working during setup.
  sarvamApiKey: process.env.SARVAM_API_KEY || "",
  sarvamApiUrl: process.env.SARVAM_API_URL || "https://api.sarvam.ai/v1/chat/completions",
  sarvamModel: process.env.SARVAM_MODEL || "sarvam-105b",
};

// Safe startup check — reports only whether each secret is present, never the value itself.
console.log(
  `[startup] SUPABASE_URL: ${env.supabaseUrl ? "present" : "MISSING"} | ` +
    `SUPABASE_SERVICE_ROLE_KEY: ${env.supabaseServiceRoleKey ? "present" : "MISSING"} | ` +
    `SARVAM_API_KEY: ${env.sarvamApiKey ? "present" : "MISSING"}`
);

if (!env.sarvamApiKey) {
  console.warn(
    "[env] SARVAM_API_KEY is not set. /api/business/analyze and /api/ai/test will return a clear error until it is configured."
  );
}
