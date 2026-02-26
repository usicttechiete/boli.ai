import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
        '[DB] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables'
    );
}

/**
 * Supabase admin client — uses service role key, bypasses RLS.
 * Use ONLY for server-side operations. Never expose this to the client.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
