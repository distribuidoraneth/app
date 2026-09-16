import { createClient } from '@supabase/supabase-js';

export function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sfuhsvudsdjecucgewsq.supabase.co';
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmdWhzdnVkc2RqZWN1Y2dld3NxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzk1MjI5MCwiZXhwIjoyMTAzNTI4MjkwfQ.lrgcRzosMWhNLD3PoPz5hrNXxPylEgsqDa6HkSkZDC0';

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
