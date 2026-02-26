import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oqjblzxhfszvluhvfclv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xamJsenhoZnN6dmx1aHZmY2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMzczMDksImV4cCI6MjA2MTcxMzMwOX0.oKNbUCKXTds68cy2wGPZMJhoQ9mAXUOOQz2oUreh018';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testOAuth() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: 'https://192.168.86.21:5173/auth/callback'
        }
    });
    console.log("OAuth Data:", data);
    console.log("OAuth Error:", error);
}

testOAuth();
