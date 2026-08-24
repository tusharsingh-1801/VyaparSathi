import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Server-side client using the service role key. This bypasses Row Level Security,
// so this client must NEVER be sent to or used from the Expo frontend.
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
