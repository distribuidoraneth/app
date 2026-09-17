'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { AnethFullLogo, AnethIsotype } from '@/components/ui/AnethLogo';
import { AppleTruckBoxIcon, AppleCalendarClockIcon } from '@/components/ui/AppleIcons';
import { LogOut } from 'lucide-react';

export function AdminHeader() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<{
    name: string;
    email: string;
    avatarUrl?: string;
  } | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          (user.email ? user.email.split('@')[0] : 'Administrador');
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        setUserProfile({
          name,
          email: user.email || '',
          avatarUrl,
        });
      }
    });
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem('aneth_admin_authenticated');
    localStorage.removeItem('aneth_admin_user');
    sessionStorage.removeItem('aneth_admin_authenticated');
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link href="/admin/pedidos" className="hidden sm:block hover:opacity-90 transition-opacity">
            <AnethFullLogo size="md" showSubtitle={true} subtitleText="DISTRIBUCIONES" />
          </Link>
          <Link href="/admin/pedidos" className="sm:hidden hover:opacity-90 transition-opacity">
            <AnethIsotype size="md" variant="color" />
          </Link>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <Link
            href="/pedido?type=autoventa"
            className="px-3 sm:px-3.5 py-1.5 sm:py-2 min-w-[106px] sm:min-w-[124px] justify-center bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-sm sm:text-base font-black shadow-xs flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer"
          >
            <AppleTruckBoxIcon className="w-5 h-5 shrink-0" />
            <span className="leading-none">Autoventa</span>
          </Link>

          <Link
            href="/pedido?type=preventa"
            className="px-3 sm:px-3.5 py-1.5 sm:py-2 min-w-[106px] sm:min-w-[124px] justify-center bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-sm sm:text-base font-black shadow-xs flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer"
          >
            <AppleCalendarClockIcon className="w-5 h-5 shrink-0" />
            <span className="leading-none">Preventa</span>
          </Link>

          {/* Google User Profile Chip with Dropdown for Logout */}
          <div className="relative pl-1 sm:pl-2 border-l border-slate-200">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center space-x-2 p-1 rounded-full sm:rounded-xl hover:bg-slate-100 transition-colors focus:outline-hidden cursor-pointer"
            >
              {userProfile?.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-9 h-9 rounded-full border border-slate-200 shadow-2xs object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-2xs">
                  {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <span className="text-sm font-black text-slate-900 block leading-tight truncate max-w-[130px]">
                  {userProfile?.name || 'Administrador'}
                </span>
                <span className="text-xs text-emerald-600 font-bold block leading-none">
                  Admin Activo
                </span>
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-sm font-black text-slate-900 truncate">
                      {userProfile?.name || 'Administrador'}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {userProfile?.email || 'admin@aneth.com'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs sm:text-sm font-bold text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
