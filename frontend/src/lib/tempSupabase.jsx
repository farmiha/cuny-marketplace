import { createClient } from "@supabase/supabase-js";


// A throwaway Supabase client that never saves a session in the browser.
// We use it to send and check a code for a backup email without touching
// the real login (so the person stays logged in as themselves).
export function createTempClient() {
 return createClient(
   import.meta.env.VITE_SUPABASE_URL,
   import.meta.env.VITE_SUPABASE_ANON_KEY,
   {
     auth: {
       persistSession: false,
       autoRefreshToken: false,
       detectSessionInUrl: false,
       storageKey: "cuny-temp-auth",
     },
   },
 );
}
