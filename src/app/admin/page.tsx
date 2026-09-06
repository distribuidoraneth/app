'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        // 1. Check local session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // 2. Check if there is an OAuth hash token in the URL that Supabase is processing
        const hasHashToken = typeof window !== 'undefined' && (
          window.location.hash.includes('access_token') ||
          window.location.hash.includes('refresh_token') ||
          window.location.search.includes('code=')
        );

        if (hasHashToken) {
          // Give Supabase client a moment to parse the token
          return;
        }

        // 3. Fallback check: localStorage authenticated flag
        const localAuth = localStorage.getItem('aneth_admin_authenticated');
        if (localAuth === 'true' && isMounted) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // If definitely not authenticated
        if (isMounted) {
          setIsLoading(false);
          router.push('/');
        }
      } catch (e) {
        console.error('Auth error in admin page:', e);
        if (isMounted) {
          setIsLoading(false);
          router.push('/');
        }
      }
    }

    checkAuth();

    // Listen for auth changes (specifically SIGNED_IN from OAuth callback)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        localStorage.setItem('aneth_admin_authenticated', 'true');
        localStorage.setItem('aneth_admin_user', session.user.email || '');
        setIsAuthenticated(true);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('aneth_admin_authenticated');
        localStorage.removeItem('aneth_admin_user');
        setIsAuthenticated(false);
        setIsLoading(false);
        router.push('/');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#081225] flex flex-col items-center justify-center space-y-3 text-white">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-xs font-bold text-slate-400">Verificando sesión...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <AdminDashboard />;
}
