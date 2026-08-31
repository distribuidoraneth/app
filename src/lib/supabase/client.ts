import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sfuhsvudsdjecucgewsq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmdWhzdnVkc2RqZWN1Y2dld3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NTIyOTAsImV4cCI6MjEwMzUyODI5MH0.9_FHW36eU90E2hgS99wu-pluB2PXhFUigMROIiunR9M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Sign in with Google using Supabase OAuth
 */
export async function signInWithGoogle() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://distribuidora-aneth.vercel.app';
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/admin`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('Error signing in with Google:', error.message);
    throw error;
  }

  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error.message);
    throw error;
  }
}
