'use client';

import React, { use, useState, useMemo } from 'react';
import {
  useDistribution,
  getNextInvoiceSequence,
  recordUsedInvoiceSequence,
} from '@/context/DistributionContext';
import {
  formatCurrency,
  formatUnitPrice,
  formatDate,
  formatSriDate,
  formatSriDateTime,
  formatProductSku,
  expandCartItemsToFacturaLines,
  generateWhatsAppOrderLink,
} from '@/lib/utils/formatters';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnethFullLogo } from '@/components/ui/AnethLogo';
import { AppleWhatsAppIcon } from '@/components/ui/AppleIcons';
import { SriBarcodeSVG } from '@/components/ui/SriBarcodeSVG';
import { InvoiceRideDocument } from '@/components/invoice/InvoiceRideDocument';
import { generarClaveAcceso } from '@/lib/sri/claveAcceso';
import { buildFacturaXml, DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';
import {
  getInvoiceByIdOrNumberFromDb,
  saveInvoiceToDb,
  updateCompanySecuencialInDb,
  reconstructInvoiceFromOrder,
} from '@/lib/supabase/syncService';
import { downloadInvoicePdf } from '@/lib/utils/pdfGenerator';
import { Invoice, Order } from '@/types';
import {
  Printer,
  FileDown,
  Loader2,
  Code,
  ArrowLeft,
  CheckCircle2,
  FileText,
  RefreshCw,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';

export default function PublicInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { invoices, orders, currentSecuencial, updateInvoiceSequence } = useDistribution();

  const cleanId = useMemo(
    () => decodeURIComponent(resolvedParams.id || '').trim(),
    [resolvedParams.id]
  );

  // 1. Buscar en facturas cargadas en el contexto
  const invoiceFromContext = useMemo(() => {
    return (
      invoices.find(
        (i) =>
          i.invoiceNumber === cleanId ||
          i.id === cleanId ||
          i.orderId === cleanId ||
          i.orderNumber === cleanId ||
          i.claveAcceso === cleanId
      ) || null
    );
  }, [invoices, cleanId]);

  // 2. Buscar en órdenes cargadas en el contexto
  const orderFromContext = useMemo(() => {
    return (
      orders.find(
        (o) =>
          o.id === cleanId ||
          o.orderNumber === cleanId ||
          o.invoiceId === cleanId ||
          o.invoiceNumber === cleanId
      ) || null
    );
  }, [orders, cleanId]);

  // 3. Caché local síncrona en useState (0 ms de espera, sin trabas ni parpadeos)
  const [localInvoice] = useState<Invoice | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('distribuidora_aneth_oficial_v12');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.invoices)) {
          const found = parsed.invoices.find(
            (i: Invoice) =>
              i.invoiceNumber === cleanId ||
              i.id === cleanId ||
              i.orderId === cleanId ||
              i.orderNumber === cleanId ||
              i.claveAcceso === cleanId
          );
          if (found) return found;
        }
        if (Array.isArray(parsed.orders)) {
          const foundOrder = parsed.orders.find(
            (o: Order) =>
              o.id === cleanId ||
              o.orderNumber === cleanId ||
              o.invoiceId === cleanId ||
              o.invoiceNumber === cleanId
          );
          if (foundOrder) {
            return reconstructInvoiceFromOrder(foundOrder);
          }
        }
      }
    } catch {}
    return null;
  });

  const [dbInvoice, setDbInvoice] = useState<Invoice | null>(null);
  const initialAvailable = Boolean(invoiceFromContext || localInvoice || orderFromContext);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(!initialAvailable);

  React.useEffect(() => {
    let isMounted = true;
    setIsLoadingDb(!invoiceFromContext && !localInvoice && !orderFromContext);

    getInvoiceByIdOrNumberFromDb(cleanId)
      .then((inv) => {
        if (isMounted) {
          if (inv) {
            setDbInvoice(inv);
            // Sincronizar caché local para que futuras visitas tengan el estado oficial
            try {
              const storageKey = 'distribuidora_aneth_oficial_v12';
              const saved = localStorage.getItem(storageKey);
              if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed.invoices)) {
                  parsed.invoices = parsed.invoices.map((existing: any) =>
                    existing.id === inv.id || existing.invoiceNumber === inv.invoiceNumber
                      ? { ...existing, ...inv }
                      : existing
                  );
                  localStorage.setItem(storageKey, JSON.stringify(parsed));
                }
              }
            } catch (_) {}
          }
          setIsLoadingDb(false);
        }
      })
      .catch((err) => {
        console.warn('Error al cargar factura desde Supabase:', err);
        if (isMounted) setIsLoadingDb(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cleanId, invoiceFromContext, localInvoice, orderFromContext]);

  const invoice = useMemo(() => {
    const base =
      invoiceFromContext ||
      localInvoice ||
      (orderFromContext ? reconstructInvoiceFromOrder(orderFromContext) : null);

    if (!dbInvoice) return base;
    if (!base) return dbInvoice;

    // Priorizar datos oficiales actualizados de la base de datos (como AUTORIZADO)
    return {
      ...base,
      ...dbInvoice,
      sriStatus: dbInvoice.sriStatus || base.sriStatus,
      sriAuthorizationNumber: dbInvoice.sriAuthorizationNumber || base.sriAuthorizationNumber,
      sriAuthorizationDate: dbInvoice.sriAuthorizationDate || base.sriAuthorizationDate,
      sriErrorMessage: dbInvoice.sriStatus === 'AUTORIZADO' ? undefined : (dbInvoice.sriErrorMessage ?? base.sriErrorMessage),
      items: dbInvoice.items && dbInvoice.items.length > 0 ? dbInvoice.items : base.items,
    };
  }, [invoiceFromContext, localInvoice, orderFromContext, dbInvoice]);

  const claveAcceso = useMemo(() => {
    if (invoice?.claveAcceso) return invoice.claveAcceso;
    const seq = parseInt(invoice?.invoiceNumber?.replace(/\D/g, '')?.slice(-9) || '1', 10) || 1;
    return generarClaveAcceso({
      fecha: invoice ? new Date(invoice.issuedAt) : new Date(),
      ruc: DEFAULT_TAX_PROFILE.ruc,
      ambiente: '1',
      establecimiento: '001',
      puntoEmision: '001',
      secuencial: seq,
    });
  }, [invoice]);

  const facturaLines = useMemo(() => {
    if (!invoice?.items) return [];
    return expandCartItemsToFacturaLines(invoice.items, 15);
  }, [invoice?.items]);

  const subtotal15 = useMemo(() => {
    if (facturaLines.length > 0) {
      return Number(facturaLines.reduce((s, l) => s + l.precioTotalSinImpuesto, 0).toFixed(2));
    }
    return invoice?.subtotal15 && invoice.subtotal15 < invoice.total
      ? invoice.subtotal15
      : Number(((invoice?.total || 0) / 1.15).toFixed(2));
  }, [facturaLines, invoice]);

  const tax15 = useMemo(() => {
    if (facturaLines.length > 0) {
      return Number(facturaLines.reduce((s, l) => s + l.iva, 0).toFixed(2));
    }
    return invoice?.tax && invoice.tax > 0
      ? invoice.tax
      : Number(((invoice?.total || 0) - subtotal15).toFixed(2));
  }, [facturaLines, invoice, subtotal15]);

  const [sriStatus, setSriStatus] = useState<string | null>(invoice?.sriStatus || null);
  const [sriAuthNum, setSriAuthNum] = useState<string | null>(invoice?.sriAuthorizationNumber || null);
  const [sriAuthDate, setSriAuthDate] = useState<string | null>(invoice?.sriAuthorizationDate || null);
  const [sriErrorMsg, setSriErrorMsg] = useState<string | null>(invoice?.sriErrorMessage || null);
  const [isCheckingSri, setIsCheckingSri] = useState<boolean>(false);
  const [isRetryingSri, setIsRetryingSri] = useState<boolean>(false);
  const [sriFeedback, setSriFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    if (invoice) {
      setSriStatus(invoice.sriStatus || null);
      setSriAuthNum(invoice.sriAuthorizationNumber || null);
      setSriAuthDate(invoice.sriAuthorizationDate || null);
      setSriErrorMsg(invoice.sriErrorMessage || null);

      // Si el comprobante no está AUTORIZADO aún, consultar automáticamente para resolverlo
      if (
        invoice.claveAcceso &&
        invoice.sriStatus !== 'AUTORIZADO' &&
        invoice.status !== 'anulada'
      ) {
        handleConsultarSri();
      }
    }
  }, [invoice?.id, invoice?.sriStatus]);

  const handleConsultarSri = async () => {
    if (!claveAcceso) return;
    setIsCheckingSri(true);
    setSriFeedback(null);
    try {
      const res = await fetch('/api/sri/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claveAcceso,
          ambiente: invoice?.ambiente || (process.env.NEXT_PUBLIC_SRI_ENVIRONMENT === '1' ? '1' : '2'),
        }),
      });
      const data = await res.json();
      if (data.estado) {
        setSriStatus(data.estado);
        if (data.numeroAutorizacion) setSriAuthNum(data.numeroAutorizacion);
        if (data.fechaAutorizacion) setSriAuthDate(data.fechaAutorizacion);

        if (data.estado === 'AUTORIZADO') {
          setSriErrorMsg(null);
          setSriFeedback('¡Comprobante AUTORIZADO oficialmente por el SRI!');
        } else if (data.estado === 'RECIBIDA' || data.estado === 'EN PROCESO') {
          setSriFeedback('Comprobante recibido por el SRI (en cola de autorización).');
        } else {
          setSriErrorMsg(data.error || 'No autorizado');
          setSriFeedback(data.error || 'Respuesta obtenida del SRI');
        }

        // Sincronizar en localStorage
        try {
          const storageKey = 'distribuidora_aneth_oficial_v12';
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed.invoices)) {
              parsed.invoices = parsed.invoices.map((inv: any) =>
                inv.id === invoice?.id || inv.invoiceNumber === invoice?.invoiceNumber
                  ? {
                      ...inv,
                      sriStatus: data.estado,
                      sriAuthorizationNumber: data.numeroAutorizacion || inv.sriAuthorizationNumber,
                      sriAuthorizationDate: data.fechaAutorizacion || inv.sriAuthorizationDate,
                      sriErrorMessage: data.estado === 'AUTORIZADO' ? undefined : (data.error || inv.sriErrorMessage),
                    }
                  : inv
              );
              localStorage.setItem(storageKey, JSON.stringify(parsed));
            }
          }
        } catch (_) {}

        if (invoice) {
          saveInvoiceToDb({
            ...invoice,
            sriStatus: data.estado as any,
            sriAuthorizationNumber: data.numeroAutorizacion || invoice.sriAuthorizationNumber,
            sriAuthorizationDate: data.fechaAutorizacion || invoice.sriAuthorizationDate,
            sriErrorMessage: data.estado === 'AUTORIZADO' ? null : (data.error || invoice.sriErrorMessage || null),
          }).catch((e) => console.warn('Error al actualizar SRI en Supabase:', e));
        }
      } else {
        setSriFeedback(data.error || 'No se pudo verificar ante el SRI');
      }
    } catch (err: any) {
      setSriFeedback(err?.message || 'Error de red al consultar el SRI');
    } finally {
      setIsCheckingSri(false);
    }
  };

  const handleCambiarSecuencial = async () => {
    if (!invoice) return;
    const currentNum = parseInt(invoice.invoiceNumber.replace(/\D/g, '').slice(-9), 10) || 1;
    const promptVal = window.prompt(
      `Ingrese el número de secuencial para esta factura:\n(Por ejemplo: si en la base de datos definió 326, aquí debe ir 327):`,
      String(currentNum)
    );
    if (!promptVal) return;
    const newSeq = parseInt(promptVal.trim(), 10);
    if (isNaN(newSeq) || newSeq < 119) {
      alert('El secuencial debe ser un número entero válido >= 119.');
      return;
    }

    try {
      setIsRetryingSri(true);
      setSriFeedback(null);
      const updated = await updateInvoiceSequence(invoice.id, newSeq);
      if (updated) {
        setDbInvoice(updated);
        setSriStatus('PENDING');
        setSriErrorMsg(null);
        setSriFeedback(`Secuencial actualizado a #${newSeq}. Ahora puede pulsar "Reintentar" para emitir al SRI con este número.`);
      }
    } catch (err: any) {
      alert('Error al actualizar secuencial: ' + err?.message);
    } finally {
      setIsRetryingSri(false);
    }
  };

  const handleReintentarSri = async () => {
    if (!invoice) return;
    setIsRetryingSri(true);
    setSriFeedback(null);
    try {
      // Solo considerar duplicado si el SRI explícitamente reporta error 45 (SECUENCIAL REGISTRADO)
      const isSequenceDuplicate =
        sriErrorMsg?.includes('45') ||
        (sriErrorMsg?.toLowerCase().includes('secuencial') && sriErrorMsg?.toLowerCase().includes('registrado'));

      let seq = parseInt(invoice.invoiceNumber.replace(/\D/g, '').slice(-9), 10) || 1;
      let clave: string | undefined = claveAcceso;

      if (isSequenceDuplicate) {
        const nextValid = getNextInvoiceSequence(invoices, currentSecuencial);
        seq = nextValid;
        clave = undefined; // Forzar generación de nueva clave limpia para el nuevo secuencial
        recordUsedInvoiceSequence(seq);
        updateCompanySecuencialInDb(seq).catch(console.warn);
      }

      const effectivePaymentMethod = invoice.paymentMethod || orderFromContext?.paymentMethod || 'cash';

      const res = await fetch('/api/sri/facturar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            id: invoice.orderId,
            items: invoice.items,
            paymentMethod: effectivePaymentMethod,
          },
          client: {
            fullName: invoice.clientName,
            businessName: invoice.businessName,
            taxId: invoice.clientTaxId,
            taxIdType: invoice.clientTaxIdType,
            whatsappNumber: invoice.clientWhatsapp,
            email: invoice.clientEmail,
            addressReference: invoice.clientAddress,
          },
          secuencial: seq,
          claveAcceso: clave,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSriStatus('DEVUELTA');
        setSriErrorMsg(data?.error || `Error del servidor (${res.status})`);
        setSriFeedback(data?.error || `Error ${res.status}: No se pudo procesar la factura con el SRI.`);
        return;
      }

      if (data && data.sriStatus) {
        setSriStatus(data.sriStatus);
        setSriAuthNum(data.numeroAutorizacion);
        setSriAuthDate(data.fechaAutorizacion);
        setSriErrorMsg(data.error);

        recordUsedInvoiceSequence(seq);
        updateCompanySecuencialInDb(seq).catch(console.warn);

        // Actualizar invoice en localStorage para que refleje el nuevo número y estado
        try {
          const storageKey = 'distribuidora_aneth_oficial_v12';
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed.invoices)) {
              parsed.invoices = parsed.invoices.map((inv: any) =>
                inv.id === invoice.id || inv.invoiceNumber === invoice.invoiceNumber
                  ? {
                      ...inv,
                      invoiceNumber: data.secuencialCompleto || inv.invoiceNumber,
                      claveAcceso: data.claveAcceso || inv.claveAcceso,
                      sriStatus: data.sriStatus,
                      sriAuthorizationNumber: data.numeroAutorizacion,
                      sriAuthorizationDate: data.fechaAutorizacion,
                      sriErrorMessage: data.error,
                      xmlContent: data.xml,
                    }
                  : inv
              );
              localStorage.setItem(storageKey, JSON.stringify(parsed));
            }
          }
        } catch (_) {}

        if (invoice) {
          const updatedInv: Invoice = {
            ...invoice,
            invoiceNumber: data.secuencialCompleto || invoice.invoiceNumber,
            claveAcceso: data.claveAcceso || invoice.claveAcceso,
            sriStatus: data.sriStatus,
            sriAuthorizationNumber: data.numeroAutorizacion,
            sriAuthorizationDate: data.fechaAutorizacion,
            sriErrorMessage: data.error,
            xmlContent: data.xml,
          };
          saveInvoiceToDb(updatedInv).catch((e) =>
            console.warn('Error al persistir reintento SRI en Supabase:', e)
          );
        }

        setSriFeedback(
          data.sriStatus === 'AUTORIZADO'
            ? `¡Factura ${data.secuencialCompleto || ''} AUTORIZADA con éxito en el SRI!`
            : data.sriStatus === 'RECIBIDA'
            ? `Factura ${data.secuencialCompleto || ''} RECIBIDA por el SRI. En cola de autorización.`
            : `El SRI devolvió: ${data.error || 'Error'}`
        );
      } else {
        setSriFeedback(data.error || 'Error al reintentar facturación');
      }
    } catch (err: any) {
      setSriFeedback(err?.message || 'Error al conectar con la API');
    } finally {
      setIsRetryingSri(false);
    }
  };

  const handleVolver = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/admin');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!invoice) return;

    const relatedOrder = orders.find(
      (o) =>
        o.id === invoice.orderId ||
        (invoice.orderNumber && o.orderNumber === invoice.orderNumber) ||
        o.invoiceId === invoice.id ||
        o.invoiceNumber === invoice.invoiceNumber
    );

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let safeOrderNum = invoice.orderNumber || relatedOrder?.orderNumber;
    if (!safeOrderNum) {
      if (!isUuid.test(invoice.orderId)) {
        safeOrderNum = invoice.orderId;
      } else {
        safeOrderNum = `ORD-${invoice.invoiceNumber.replace(/[^0-9]/g, '').slice(-9) || '1'}`;
      }
    }

    let targetPhone = invoice.clientWhatsapp?.trim();
    if (!targetPhone) {
      const input = window.prompt(
        'El cliente no tiene teléfono guardado.\n\n• Ingrese un número para enviárselo directamente, o\n• Presione "Aceptar" para elegir a cualquier contacto en su WhatsApp:',
        ''
      );
      if (input === null) return;
      targetPhone = input.trim();
    }

    const link = generateWhatsAppOrderLink({
      phone: targetPhone,
      clientName: invoice.clientName,
      orderNumber: safeOrderNum,
      total: invoice.total,
      amountPaid: relatedOrder?.amountPaid,
      debtBalance: relatedOrder?.debtBalance,
      promisedCollectionDate: relatedOrder?.promisedCollectionDate,
      promisedCollectionTime: relatedOrder?.promisedCollectionTime,
      invoiceNumber: invoice.invoiceNumber,
    });
    window.open(link, '_blank');
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  const handleDownloadPdf = async () => {
    if (!invoice || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const cleanNum = invoice.invoiceNumber.replace(/[^0-9A-Za-z_-]/g, '_');
      await downloadInvoicePdf('invoice-printable-area', `FACTURA_${cleanNum}_SRI.pdf`);
    } catch (err) {
      console.error('Error al generar PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadXml = async () => {
    if (!invoice) return;
    const seq = parseInt(invoice.invoiceNumber.replace(/\D/g, '').slice(-9), 10) || 1;
    let xmlContent = '';

    const effectivePaymentMethod = invoice.paymentMethod || orderFromContext?.paymentMethod || 'cash';

    try {
      const res = await fetch('/api/sri/facturar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            id: invoice.orderId,
            items: invoice.items,
            paymentMethod: effectivePaymentMethod,
          },
          client: {
            fullName: invoice.clientName,
            businessName: invoice.businessName,
            taxId: invoice.clientTaxId,
            taxIdType: invoice.clientTaxIdType,
            whatsappNumber: invoice.clientWhatsapp,
            email: invoice.clientEmail,
            addressReference: invoice.clientAddress,
          },
          secuencial: seq,
        }),
      });
      const data = await res.json();
      if (data.xml) {
        xmlContent = data.xml;
      }
    } catch {
      // Fallback a XML directo
      xmlContent = buildFacturaXml({
        claveAcceso,
        secuencial: seq,
        fechaEmision: new Date(invoice.issuedAt),
        company: DEFAULT_TAX_PROFILE,
        cliente: {
          razonSocial: invoice.clientName,
          identificacion: invoice.clientTaxId || '9999999999999',
          tipoIdentificacion: invoice.clientTaxIdType || '07',
          direccion: invoice.clientAddress,
          telefono: invoice.clientWhatsapp,
          email: invoice.clientEmail,
        },
        items: invoice.items,
        paymentMethod: effectivePaymentMethod,
        ivaRate: 15,
      });
    }

    const blob = new Blob([xmlContent], { type: 'text/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FACTURA_${invoice.invoiceNumber}_SRI.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoadingDb) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-sm flex flex-col items-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="font-extrabold text-slate-900 text-sm">Cargando Comprobante SRI</h2>
          <p className="text-xs text-slate-500 mt-1">Verificando comprobante en ANETH Distribuciones...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-sm">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h2 className="font-extrabold text-slate-900">Factura no disponible</h2>
          <p className="text-xs text-slate-500 mt-1">El comprobante consultado aún no ha sido emitido o no existe.</p>
          <Link href="/" className="mt-4 inline-block px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs">
            Volver a la App
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-3 sm:py-8 px-2 sm:px-4 flex flex-col items-center print:bg-white print:p-0">
      {/* Top action bar (hidden in print) - Apple Design glassmorphic toolbar */}
      <div className="print:hidden w-full max-w-3xl bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-2xl px-2.5 py-2 sm:px-3 sm:py-2 mb-3 sm:mb-4 flex items-center justify-between gap-1.5 transition-all">
        {/* Volver */}
        <button
          type="button"
          onClick={handleVolver}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100/80 active:scale-[0.97] transition-all cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver</span>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Reintentar en caso de devolución */}
          {(sriStatus === 'DEVUELTA' || sriStatus === 'NO AUTORIZADO') && (
            <button
              type="button"
              onClick={handleReintentarSri}
              disabled={isRetryingSri}
              title="Reintentar emisión SRI"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.97] text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetryingSri ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">{isRetryingSri ? 'Reemitiendo...' : 'Reintentar'}</span>
            </button>
          )}

          {/* Consultar SRI (Compact, subtle) */}
          <button
            type="button"
            onClick={handleConsultarSri}
            disabled={isCheckingSri}
            title="Consultar estado SRI en vivo"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:scale-[0.97] text-slate-700 hover:text-slate-900 rounded-xl text-xs font-medium transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingSri ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">{isCheckingSri ? 'Consultando...' : 'Consultar'}</span>
          </button>

          {/* WhatsApp */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            title="Compartir por WhatsApp"
            className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 active:scale-[0.97] border border-emerald-500/20 text-emerald-800 rounded-xl text-xs font-medium transition-all cursor-pointer"
          >
            <AppleWhatsAppIcon size={15} alt="WhatsApp" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          {/* XML */}
          <button
            type="button"
            onClick={handleDownloadXml}
            title="Descargar archivo XML oficial"
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:scale-[0.97] text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/60 transition-all cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-slate-500" />
            <span>XML</span>
          </button>

          {/* Imprimir */}
          <button
            type="button"
            onClick={handlePrint}
            title="Imprimir directamente"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:scale-[0.97] text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/60 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimir</span>
          </button>

          {/* Descargar PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            title="Descargar factura oficial en PDF"
            className="inline-flex items-center gap-1 px-3 sm:px-3.5 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.97] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-75"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generando...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerta de resultado SRI en vivo */}
      {sriFeedback && (
        <div
          className={`print:hidden w-full max-w-3xl mb-4 p-3 rounded-2xl text-xs flex items-center justify-between shadow-xs transition-all ${
            sriFeedback.includes('AUTORIZAD')
              ? 'bg-emerald-50/90 border border-emerald-200/80 text-emerald-900'
              : sriFeedback.includes('DEVUELTA') || sriFeedback.includes('Error')
              ? 'bg-rose-50/90 border border-rose-200/80 text-rose-900'
              : 'bg-blue-50/90 border border-blue-200/80 text-blue-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {sriFeedback.includes('AUTORIZAD') ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : sriFeedback.includes('DEVUELTA') || sriFeedback.includes('Error') ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span className="font-medium">{sriFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setSriFeedback(null)}
            className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-colors ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Official SRI Printable RIDE (Paginación nativa multipágina sin cortes ni solapamientos) */}
      <InvoiceRideDocument
        invoice={invoice}
        facturaLines={facturaLines}
        sriAuthNum={sriAuthNum}
        sriAuthDate={sriAuthDate}
        claveAcceso={claveAcceso}
        subtotal15={subtotal15}
        totalIva15={tax15}
        paymentMethod={invoice.paymentMethod || orderFromContext?.paymentMethod}
      />
    </div>
  );
}
