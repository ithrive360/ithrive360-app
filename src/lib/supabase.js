import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oqjblzxhfszvluhvfclv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xamJsenhoZnN6dmx1aHZmY2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMzczMDksImV4cCI6MjA2MTcxMzMwOX0.oKNbUCKXTds68cy2wGPZMJhoQ9mAXUOOQz2oUreh018';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
});
