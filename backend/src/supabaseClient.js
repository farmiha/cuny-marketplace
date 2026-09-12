const { createClient } = require("@supabase/supabase-js");
require("dotenv/config");

// Backend uses the SECRET key (not the publishable one) since server-side
// code is trusted and sometimes needs to bypass RLS (e.g. admin actions).
// Never send this key to the frontend.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
);

module.exports = supabase;
