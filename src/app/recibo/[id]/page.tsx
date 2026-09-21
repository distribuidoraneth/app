'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDistribution } from '@/context/DistributionContext';
import { getOrderByIdFromDb, getInvoiceByIdOrNumberFromDb } from '@/lib/supabase/syncService';
import { Order, Invoice, Client } from '@/types';
import { ThermalReceiptModal } from '@/components/receipt/ThermalReceiptModal';
import { FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PublicReciboPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { orders, invoices, clients } = useDistribution();

  const orderFromContext = orders.find(
    (o) => o.orderNumber === resolvedParams.id || o.id === resolvedParams.id
  );

  const [order, setOrder] = useState<Order | null>(orderFromContext || null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(!orderFromContext);

  useEffect(() => {
    if (orderFromContext) {
      setOrder(orderFromContext);
      const inv = invoices.find(
        (i) => i.orderId === orderFromContext.id || i.id === orderFromContext.invoiceId
      );
      if (inv) setInvoice(inv);
      const cli = clients.find((c) => c.id === orderFromContext.clientId);
      if (cli) setClient(cli);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    getOrderByIdFromDb(resolvedParams.id)
      .then(async (fetchedOrder) => {
        if (!isMounted) return;
        if (fetchedOrder) {
          setOrder(fetchedOrder);
          const cli = clients.find((c) => c.id === fetchedOrder.clientId);
          if (cli) setClient(cli);

          // Buscar factura asociada si existe
          const invId = fetchedOrder.invoiceId || fetchedOrder.id || fetchedOrder.orderNumber;
          try {
            const fetchedInv = await getInvoiceByIdOrNumberFromDb(invId);
            if (isMounted && fetchedInv) setInvoice(fetchedInv);
          } catch (_) {}
        }
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id, orderFromContext, invoices, clients]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-sm flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <h2 className="font-extrabold text-slate-900 text-sm">Cargando Comprobante</h2>
          <p className="text-xs text-slate-500 mt-1">ANETH Distribuciones...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-sm">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h2 className="font-extrabold text-slate-900">Comprobante no disponible</h2>
          <p className="text-xs text-slate-500 mt-1">El comprobante consultado no existe o no ha sido emitido.</p>
          <Link href="/" className="mt-4 inline-block px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs">
            Volver a la App
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ThermalReceiptModal
      isOpen={true}
      onClose={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
          router.back();
        } else {
          router.push(`/pedido/${order.orderNumber}`);
        }
      }}
      order={order}
      client={client}
      invoice={invoice}
    />
  );
}
