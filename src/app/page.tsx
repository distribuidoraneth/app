'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnethFullLogo, AnethIsotype } from '@/components/ui/AnethLogo';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  Building2,
  Cpu,
  Store,
  QrCode,
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('admin@distribuidoraneth.com');
  const [password, setPassword] = useState<string>('aneth2026');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if session is already stored
  useEffect(() => {
    const savedAuth = localStorage.getItem('aneth_admin_authenticated');
    if (savedAuth === 'true') {
      router.push('/admin');
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simple validation (can be plugged with supabase.auth.signInWithPassword)
    setTimeout(() => {
      if (email.trim().length > 0 && password.trim().length > 0) {
        if (rememberMe) {
          localStorage.setItem('aneth_admin_authenticated', 'true');
          localStorage.setItem('aneth_admin_user', email);
        } else {
          sessionStorage.setItem('aneth_admin_authenticated', 'true');
        }
        router.push('/admin');
      } else {
        setError('Por favor ingrese un correo y contraseña válidos.');
        setIsLoading(false);
      }
    }, 600);
  };

  const handleDirectAccess = () => {
    localStorage.setItem('aneth_admin_authenticated', 'true');
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-[#081225] text-white flex flex-col justify-between relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/15 blur-[120px] pointer-events-none -z-0" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-indigo-600/10 blur-[100px] pointer-events-none -z-0" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <AnethFullLogo size="md" variant="white" showSubtitle={true} subtitleText="DISTRIBUIDORA" />

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-bold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistema Online</span>
          </div>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-9 shadow-2xl border border-slate-200 text-slate-900 space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#081225] text-white flex items-center justify-center shadow-md">
              <AnethIsotype size="sm" variant="white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 pt-1">
              Terminal Administrativo
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Ingreso exclusivo para desarrolladores, administración y repartidores de Distribuidora Aneth.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@distribuidoraneth.com"
                  className="w-full text-xs pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                Contraseña de Seguridad
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="font-bold">Recordar en este equipo</span>
              </label>
              <span className="text-[11px] font-bold text-blue-600">Acceso Seguro</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-black shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>{isLoading ? 'Iniciando Sesión...' : 'Ingresar al Panel de Control'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Access Helper for Developer / Operator */}
          <div className="pt-3 border-t border-slate-100 flex flex-col items-center space-y-2">
            <button
              type="button"
              onClick={handleDirectAccess}
              className="text-[11px] font-bold text-slate-500 hover:text-blue-600 transition-colors"
            >
              ⚡ Ingreso Rápido con Perfil Administrador
            </button>
          </div>

          {/* Client QR reminder note */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
            <p className="text-[11px] text-slate-600 font-medium">
              ¿Eres un cliente o establecimiento comercial?
            </p>
            <p className="text-[10px] text-slate-400">
              Escanea el código QR de tu local para abrir tu portal personal de pedidos.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-slate-500 space-y-1">
        <p className="font-bold text-slate-400">
          Distribuidora Aneth &copy; {new Date().getFullYear()} • Plataforma Privada de Distribución Mayorista
        </p>
        <p className="text-[11px] text-slate-600">
          Integrado con Supabase PostgreSQL, Facturación Electrónica SRI y EcuadorAPI
        </p>
      </footer>
    </div>
  );
}
