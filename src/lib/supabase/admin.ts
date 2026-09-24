import { createClient } from '@supabase/supabase-js';

export function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sfuhsvudsdjecucgewsq.supabase.co';
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmdWhzdnVkc2RqZWN1Y2dld3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NTIyOTAsImV4cCI6MjEwMzUyODI5MH0.9_FHW36eU90E2hgS99wu-pluB2PXhFUigMROIiunR9M';

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
