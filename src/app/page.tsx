'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnethFullLogo } from '@/components/ui/AnethLogo';
import { supabase, signInWithGoogle } from '@/lib/supabase/client';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active session check
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Por favor ingresa tu correo y contraseña.');
      setIsLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (signUpErr) {
          setError(signUpErr.message);
          return;
        }

        if (data.session) {
          router.push('/admin');
        } else if (data.user) {
          const { data: signData } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword,
          });
          if (signData?.session) {
            router.push('/admin');
          } else {
            setSuccessMsg('Cuenta creada exitosamente. Ya puedes iniciar sesión.');
            setMode('login');
          }
        }
      } else {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (signInErr) {
          if (signInErr.message === 'Invalid login credentials') {
            setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
          } else {
            setError(signInErr.message);
          }
          return;
        }

        if (data.session) {
          router.push('/admin');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Error de conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'No se pudo conectar con Google.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#081225] text-slate-100 flex flex-col justify-between p-4 sm:p-6 selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <AnethFullLogo size="md" variant="white" showSubtitle={true} subtitleText="DISTRIBUIDORA" />
      </header>

      {/* Main Form Container */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-sm bg-white rounded-3xl p-7 sm:p-8 shadow-2xl text-slate-900 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {mode === 'login'
                ? 'Ingresa a tu cuenta para gestionar pedidos y facturación'
                : 'Registra un nuevo usuario para el sistema'}
            </p>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            disabled={isGoogleLoading || isLoading}
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 active:scale-98 text-slate-800 rounded-2xl text-xs sm:text-sm font-black shadow-xs flex items-center justify-center space-x-2.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            <span>{isGoogleLoading ? 'Conectando...' : 'Continuar con Google'}</span>
          </button>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              o con correo
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login / Sign Up */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-slate-500 font-bold hover:text-blue-600 transition-colors"
            >
              {mode === 'login'
                ? '¿No tienes una cuenta? Regístrate aquí'
                : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto py-3 text-center text-xs text-slate-500 font-semibold">
        Distribuidora Aneth &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
