'use client';

import React, { use, useState, useEffect, useMemo } from 'react';
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

  const cleanId = useMemo(
    () => decodeURIComponent(resolvedParams.id || '').trim(),
    [resolvedParams.id]
  );

  // 1. Buscar en contexto
  const orderFromContext = useMemo(() => {
    return (
      orders.find(
        (o) =>
          o.orderNumber === cleanId ||
          o.id === cleanId ||
          o.invoiceNumber === cleanId ||
          o.invoiceId === cleanId
      ) || null
    );
  }, [orders, cleanId]);

  // 2. Caché local síncrona en useState (0ms latencia)
  const [localData] = useState<{
    order: Order | null;
    invoice: Invoice | null;
    client: Client | null;
  }>(() => {
    if (typeof window === 'undefined') return { order: null, invoice: null, client: null };
    try {
      const saved = localStorage.getItem('distribuidora_aneth_oficial_v12');
      if (saved) {
        const parsed = JSON.parse(saved);
        let ord: Order | null = null;
        let inv: Invoice | null = null;
        let cli: Client | null = null;

        if (Array.isArray(parsed.orders)) {
          ord =
            parsed.orders.find(
              (o: Order) =>
                o.orderNumber === cleanId ||
                o.id === cleanId ||
                o.invoiceNumber === cleanId ||
                o.invoiceId === cleanId
            ) || null;
        }

        if (Array.isArray(parsed.invoices)) {
          inv =
            parsed.invoices.find(
              (i: Invoice) =>
                i.invoiceNumber === cleanId ||
                i.id === cleanId ||
                (ord && (i.orderId === ord.id || i.orderNumber === ord.orderNumber))
            ) || null;

          if (!ord && inv?.orderId && Array.isArray(parsed.orders)) {
            ord = parsed.orders.find((o: Order) => o.id === inv?.orderId) || null;
          }
        }

        if (ord && Array.isArray(parsed.clients)) {
          cli = parsed.clients.find((c: Client) => c.id === ord?.clientId) || null;
        }

        return { order: ord, invoice: inv, client: cli };
      }
    } catch {}
    return { order: null, invoice: null, client: null };
  });

  const initialOrder = orderFromContext || localData.order;
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [invoice, setInvoice] = useState<Invoice | null>(() => {
    if (initialOrder) {
      const inv = invoices.find(
        (i) =>
          i.orderId === initialOrder.id ||
          i.id === initialOrder.invoiceId ||
          i.invoiceNumber === initialOrder.invoiceNumber
      );
      if (inv) return inv;
    }
    return localData.invoice;
  });
  const [client, setClient] = useState<Client | null>(() => {
    if (initialOrder) {
      const cli = clients.find((c) => c.id === initialOrder.clientId);
      if (cli) return cli;
    }
    return localData.client;
  });
  const [loading, setLoading] = useState<boolean>(!initialOrder);

  useEffect(() => {
    if (orderFromContext) {
      setOrder(orderFromContext);
      const inv = invoices.find(
        (i) =>
          i.orderId === orderFromContext.id ||
          i.id === orderFromContext.invoiceId ||
          i.invoiceNumber === orderFromContext.invoiceNumber
      );
      if (inv) setInvoice(inv);
      const cli = clients.find((c) => c.id === orderFromContext.clientId);
      if (cli) setClient(cli);
      setLoading(false);
      return;
    }

    if (localData.order) {
      setOrder(localData.order);
      if (localData.invoice) setInvoice(localData.invoice);
      if (localData.client) setClient(localData.client);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    getOrderByIdFromDb(cleanId)
      .then(async (fetchedOrder) => {
        if (!isMounted) return;
        if (fetchedOrder) {
          setOrder(fetchedOrder);
          const cli = clients.find((c) => c.id === fetchedOrder.clientId);
          if (cli) setClient(cli);

          const invId =
            fetchedOrder.invoiceId ||
            fetchedOrder.invoiceNumber ||
            fetchedOrder.orderNumber ||
            fetchedOrder.id;
          try {
            const fetchedInv = await getInvoiceByIdOrNumberFromDb(invId);
            if (isMounted && fetchedInv) setInvoice(fetchedInv);
          } catch (_) {}
          setLoading(false);
        } else {
          // Si cleanId era un número de factura, buscar primero la factura y luego su orden
          try {
            const fetchedInv = await getInvoiceByIdOrNumberFromDb(cleanId);
            if (isMounted && fetchedInv) {
              setInvoice(fetchedInv);
              const ord = await getOrderByIdFromDb(fetchedInv.orderId || fetchedInv.orderNumber || '');
              if (isMounted && ord) {
                setOrder(ord);
                const cli = clients.find((c) => c.id === ord.clientId);
                if (cli) setClient(cli);
              }
            }
          } catch (_) {}
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cleanId, orderFromContext, localData, invoices, clients]);

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
