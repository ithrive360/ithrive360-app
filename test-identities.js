import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error("Missing Service Role Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) { console.error(error); return; }

    const user = users.users.find(u => u.email?.toLowerCase() === 'yiannis123@gmail.com');
    if (!user) { console.log('User not found'); return; }

    console.log("User found:", user.id);

    const { data: { user: adminUser }, error: adminErr } = await supabase.auth.admin.getUserById(user.id);
    if (adminErr) { console.error(adminErr); return; }

    const googleIdentity = adminUser.identities?.find(i => i.provider === 'google');
    if (!googleIdentity) { console.log("No google identity"); return; }

    console.log("Identity Data Keys:", Object.keys(googleIdentity.identity_data));
    console.log("Provider Token Present?", !!googleIdentity.identity_data.provider_token);
    console.log("Provider Refresh Token Present?", !!googleIdentity.identity_data.provider_refresh_token);
}

run();
