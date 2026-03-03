import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oqjblzxhfszvluhvfclv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xamJsenhoZnN6dmx1aHZmY2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMzczMDksImV4cCI6MjA2MTcxMzMwOX0.oKNbUCKXTds68cy2wGPZMJhoQ9mAXUOOQz2oUreh018';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    // FATAL PWA BUG FIX:
    // Android Chrome 'Pull-to-refresh' abruptly kills the PWA document while it's holding `navigator.locks` for the Auth token.
    // When the page reloads, Supabase-js waits INFINITELY for that dead Web Lock to clear, deadlocking ALL `.from()` queries.
    // Bypassing the cross-tab lock entirely fixes this for mobile PWAs where users only have one active tab anyway.
    lock: async (name, acquire) => {
      // Must await the acquire callback to satisfy Supabase-js Promise signature
      return await acquire();
    },
  },
});
