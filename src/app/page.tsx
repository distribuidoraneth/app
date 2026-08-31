'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnethFullLogo } from '@/components/ui/AnethLogo';
import { supabase, signInWithGoogle } from '@/lib/supabase/client';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active session check on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        router.push('/admin');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        router.push('/admin');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'No se pudo conectar con el servicio de autenticación.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#081225] text-slate-100 flex flex-col justify-between p-6 sm:p-8 selection:bg-blue-600 selection:text-white relative overflow-hidden select-none">
      {/* Dynamic Background Atmospheric Glow */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[420px] h-[220px] bg-blue-600/20 blur-[100px] pointer-events-none -z-0" />
      <div className="absolute -bottom-20 right-0 w-[320px] h-[220px] bg-indigo-600/15 blur-[90px] pointer-events-none -z-0" />

      {/* Top Header / Brand Logo */}
      <header className="relative z-10 w-full flex items-center justify-center pt-2">
        <AnethFullLogo size="lg" variant="white" showSubtitle={true} subtitleText="DISTRIBUIDORA" />
      </header>

      {/* Center Native Card */}
      <main className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center justify-center my-auto">
        <div className="w-full bg-white rounded-3xl p-7 sm:p-8 shadow-2xl shadow-black/50 text-slate-900 space-y-6 border border-slate-100">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Iniciar Sesión
            </h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Acceso exclusivo al sistema operativo de distribución y ventas
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center space-x-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="font-semibold text-xs">{error}</span>
            </div>
          )}

          {/* Premium Google Button */}
          <div className="space-y-3.5 pt-1">
            <button
              type="button"
              disabled={isGoogleLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-300 hover:border-slate-400 rounded-2xl shadow-xs hover:shadow-md flex items-center justify-center space-x-3 transition-all cursor-pointer disabled:opacity-50 group"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span className="text-sm font-bold text-slate-800 tracking-tight">
                {isGoogleLoading ? 'Conectando con Google...' : 'Continuar con Google'}
              </span>
            </button>

            <div className="flex items-center justify-center space-x-1 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Autenticación oficial y segura</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center pb-2 text-[11px] text-slate-500 font-medium">
        Distribuidora Aneth &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
