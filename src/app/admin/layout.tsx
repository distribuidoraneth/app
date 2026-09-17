'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { LiquidMobileTabPill, TabItem } from '@/components/ui/LiquidMobileTabPill';
import { MobileFloatingDock, DockNavItem } from '@/components/ui/MobileFloatingDock';
import {
  AppleTruckBoxIcon,
  ApplePersonsIcon,
  AppleCreditCardIcon,
  AppleReceiptIcon,
  AppleSquareStackIcon,
} from '@/components/ui/AppleIcons';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Determinar pestaña activa según la URL actual
  const getActiveTab = (): string => {
    if (pathname.includes('/admin/clientes')) return 'clientes';
    if (pathname.includes('/admin/deudas')) return 'deudas';
    if (pathname.includes('/admin/facturas')) return 'facturas';
    if (pathname.includes('/admin/inventario')) return 'inventario';
    return 'pedidos';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tabId: string) => {
    router.push(`/admin/${tabId}`);
  };

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        // 1. Verificar sesión activa de Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // 2. Token de hash OAuth pendiente de parsear
        const hasHashToken = typeof window !== 'undefined' && (
          window.location.hash.includes('access_token') ||
          window.location.hash.includes('refresh_token') ||
          window.location.search.includes('code=')
        );

        if (hasHashToken) {
          return;
        }

        // 3. Fallback: bandera local de autenticación
        const localAuth = localStorage.getItem('aneth_admin_authenticated');
        if (localAuth === 'true' && isMounted) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // No autenticado
        if (isMounted) {
          setIsLoading(false);
          router.push('/');
        }
      } catch (e) {
        console.error('Error de autenticación en layout admin:', e);
        if (isMounted) {
          setIsLoading(false);
          router.push('/');
        }
      }
    }

    checkAuth();

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

  const tabsList: TabItem[] = [
    {
      id: 'pedidos',
      label: 'Despachos',
      icon: <AppleTruckBoxIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />,
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <ApplePersonsIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />,
    },
    {
      id: 'deudas',
      label: 'Deudas',
      icon: <AppleCreditCardIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />,
    },
    {
      id: 'facturas',
      label: 'Facturación',
      icon: <AppleReceiptIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />,
    },
    {
      id: 'inventario',
      label: 'Inventario',
      icon: <AppleSquareStackIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />,
    },
  ];

  const dockNavItems: DockNavItem[] = [
    {
      id: 'pedidos',
      label: 'Pedidos',
      icon: <AppleTruckBoxIcon className="w-5 h-5" />,
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <ApplePersonsIcon className="w-5 h-5" />,
    },
    {
      id: 'deudas',
      label: 'Deudas',
      icon: <AppleCreditCardIcon className="w-5 h-5" />,
    },
    {
      id: 'facturas',
      label: 'Facturas',
      icon: <AppleReceiptIcon className="w-5 h-5" />,
    },
    {
      id: 'inventario',
      label: 'Stock',
      icon: <AppleSquareStackIcon className="w-5 h-5" />,
    },
  ];

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

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-28 text-slate-900">
      {/* Top Header persistente con logo, accesos y perfil */}
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3.5 sm:py-5 space-y-4 sm:space-y-5">
        {/* Píldora de Navegación de Escritorio (Sincronizada con URLs) */}
        <div className="hidden md:flex justify-center w-full">
          <LiquidMobileTabPill
            tabs={tabsList}
            activeTab={activeTab}
            onChange={handleTabChange}
            layoutId="admin-desktop-tabs"
          />
        </div>

        {/* Contenido Dinámico de la Ruta Específica */}
        <main>{children}</main>
      </div>

      {/* Dock Flotante Móvil (Sincronizado con URLs) */}
      <div className="md:hidden">
        <MobileFloatingDock
          items={dockNavItems}
          activeId={activeTab}
          onChange={handleTabChange}
          layoutId="mobile-admin-dock"
        />
      </div>
    </div>
  );
}
