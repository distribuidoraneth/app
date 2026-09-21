'use client';

import React, { use, useState, useMemo } from 'react';
import { useDistribution } from '@/context/DistributionContext';
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
import { generarClaveAcceso } from '@/lib/sri/claveAcceso';
import { buildFacturaXml, DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';
import { getInvoiceByIdOrNumberFromDb, saveInvoiceToDb } from '@/lib/supabase/syncService';
import { downloadInvoicePdf } from '@/lib/utils/pdfGenerator';
import { Invoice } from '@/types';
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
  const { invoices, orders } = useDistribution();

  const invoiceFromContext = invoices.find(
    (i) =>
      i.invoiceNumber === resolvedParams.id ||
      i.id === resolvedParams.id ||
      i.orderId === resolvedParams.id
  );

  const [dbInvoice, setDbInvoice] = useState<Invoice | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(!invoiceFromContext);

  React.useEffect(() => {
    if (invoiceFromContext) {
      setIsLoadingDb(false);
      return;
    }

    let isMounted = true;
    setIsLoadingDb(true);

    getInvoiceByIdOrNumberFromDb(resolvedParams.id)
      .then((inv) => {
        if (isMounted) {
          setDbInvoice(inv);
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
  }, [invoiceFromContext, resolvedParams.id]);

  const invoice = invoiceFromContext || dbInvoice;

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
    }
  }, [invoice]);

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
          ambiente: invoice?.ambiente || '1',
        }),
      });
      const data = await res.json();
      if (data.estado) {
        setSriStatus(data.estado);
        if (data.numeroAutorizacion) setSriAuthNum(data.numeroAutorizacion);
        if (data.fechaAutorizacion) setSriAuthDate(data.fechaAutorizacion);
        if (data.error) setSriErrorMsg(data.error);

        if (data.estado === 'AUTORIZADO') {
          setSriFeedback('¡Comprobante AUTORIZADO oficialmente por el SRI!');
        } else if (data.estado === 'RECIBIDA' || data.estado === 'EN PROCESO') {
          setSriFeedback('Comprobante recibido por el SRI (en cola de autorización).');
        } else {
          setSriFeedback(data.error || 'Respuesta obtenida del SRI');
        }

        if (invoice) {
          saveInvoiceToDb({
            ...invoice,
            sriStatus: data.estado as any,
            sriAuthorizationNumber: data.numeroAutorizacion || invoice.sriAuthorizationNumber,
            sriAuthorizationDate: data.fechaAutorizacion || invoice.sriAuthorizationDate,
            sriErrorMessage: data.error || invoice.sriErrorMessage,
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

  const handleReintentarSri = async () => {
    if (!invoice) return;
    setIsRetryingSri(true);
    setSriFeedback(null);
    try {
      const isSequenceDuplicate =
        sriErrorMsg?.includes('SECUENCIAL') ||
        sriErrorMsg?.includes('45') ||
        sriErrorMsg?.includes('REGISTRADO') ||
        sriStatus === 'DEVUELTA';

      let seq = parseInt(invoice.invoiceNumber.replace(/\D/g, '').slice(-9), 10) || 1;
      let clave: string | undefined = claveAcceso;

      if (isSequenceDuplicate) {
        const maxSeq = invoices.reduce((max, inv) => {
          const num = parseInt(inv.invoiceNumber?.replace(/\D/g, '')?.slice(-9) || '0', 10);
          return num > max ? num : max;
        }, 113);
        seq = maxSeq + 1;
        clave = undefined; // Forzar generación de nueva clave limpia para el nuevo secuencial
      }

      const res = await fetch('/api/sri/facturar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            id: invoice.orderId,
            items: invoice.items,
            paymentMethod: 'cash',
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
      const data = await res.json();
      if (data && data.sriStatus) {
        setSriStatus(data.sriStatus);
        setSriAuthNum(data.numeroAutorizacion);
        setSriAuthDate(data.fechaAutorizacion);
        setSriErrorMsg(data.error);

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

    const link = generateWhatsAppOrderLink({
      phone: invoice.clientWhatsapp,
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

    try {
      const res = await fetch('/api/sri/facturar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            id: invoice.orderId,
            items: invoice.items,
            paymentMethod: 'cash',
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
        paymentMethod: 'cash',
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

      {/* Official SRI Printable RIDE */}
      <div
        id="invoice-printable-area"
        data-prevent-detector="true"
        className="w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 p-3.5 sm:p-8 space-y-3.5 sm:space-y-4 text-slate-800 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none"
      >
        {/* Top Header Section: Left (Emisor Box) & Right (SRI Factura Box) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-stretch">
          {/* Columna Izquierda: Logo + Cuadro Emisor */}
          <div className="flex flex-col justify-between space-y-2.5 sm:space-y-3">
            {/* Logo */}
            <div className="py-1 px-0.5">
              <AnethFullLogo size="md" showSubtitle={true} subtitleText="DISTRIBUCIONES" />
            </div>

            {/* Cuadro Oficial Emisor */}
            <div className="border border-slate-300 rounded-2xl p-3.5 sm:p-4 space-y-1.5 sm:space-y-2 text-xs text-slate-800 bg-white flex-1 flex flex-col justify-center">
              <div>
                <h2 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight uppercase">
                  {DEFAULT_TAX_PROFILE.razonSocial}
                </h2>
                <p className="font-semibold text-slate-900 mt-0.5">
                  <span className="text-slate-600 font-normal">R.U.C.: </span>
                  {DEFAULT_TAX_PROFILE.ruc}
                </p>
                <p className="font-bold text-slate-800 mt-0.5 tracking-tight">
                  {DEFAULT_TAX_PROFILE.nombreComercial || 'ANETH DISTRIBUCIONES'}
                </p>
              </div>

              <div className="space-y-1 text-[11px] text-slate-700 pt-1 border-t border-slate-100">
                <p>
                  <strong className="text-slate-900">Dirección Matriz:</strong>{' '}
                  {DEFAULT_TAX_PROFILE.dirMatriz}
                </p>
                {DEFAULT_TAX_PROFILE.dirEstablecimiento && (
                  <p>
                    <strong className="text-slate-900">Dirección Sucursal:</strong>{' '}
                    {DEFAULT_TAX_PROFILE.dirEstablecimiento}
                  </p>
                )}
                <p>
                  <strong className="text-slate-900">OBLIGADO A LLEVAR CONTABILIDAD:</strong>{' '}
                  {DEFAULT_TAX_PROFILE.obligadoContabilidad}
                </p>
                <p className="font-bold text-slate-900 pt-0.5 tracking-wide">
                  RÉGIMEN GENERAL
                </p>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Cuadro Oficial SRI */}
          <div className="border border-slate-300 rounded-2xl p-3.5 sm:p-4 text-xs text-slate-800 bg-white flex flex-col justify-between space-y-2.5 sm:space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                <span className="text-slate-600 font-normal">R.U.C.: </span>
                {DEFAULT_TAX_PROFILE.ruc}
              </p>
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                FACTURA
              </h1>
              <p className="font-mono font-bold text-xs text-slate-900 whitespace-nowrap">
                No. {invoice.invoiceNumber}
              </p>

              <div className="pt-1">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                  NÚMERO DE AUTORIZACIÓN
                </span>
                <span className="font-mono text-[10.5px] sm:text-[11px] text-slate-900 font-bold block break-all leading-tight">
                  {sriAuthNum || claveAcceso}
                </span>
              </div>

              <div className="space-y-1 text-[11px] pt-1">
                <p>
                  <strong className="text-slate-900">FECHA Y HORA DE AUTORIZACIÓN:</strong>{' '}
                  <span className="font-mono">
                    {sriAuthDate ? formatSriDateTime(sriAuthDate) : formatSriDateTime(invoice.issuedAt)}
                  </span>
                </p>
                <p>
                  <strong className="text-slate-900">AMBIENTE:</strong>{' '}
                  <span>{invoice.ambiente === '2' ? 'PRODUCCIÓN' : 'PRUEBAS'}</span>
                </p>
                <p>
                  <strong className="text-slate-900">EMISIÓN:</strong>{' '}
                  <span>NORMAL</span>
                </p>
              </div>
            </div>

            {/* Código de barras y Clave de Acceso */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1">
                CLAVE DE ACCESO
              </span>
              <div className="w-full bg-white py-0.5 overflow-hidden">
                <SriBarcodeSVG value={claveAcceso} className="w-full h-10 sm:h-11" />
              </div>
              <span className="font-mono text-[9.5px] sm:text-[10px] text-slate-900 font-medium block text-center tracking-tight select-all mt-0.5 break-all">
                {claveAcceso}
              </span>
            </div>
          </div>
        </div>

        {/* Cuadro Comprador / Cliente (Oficial SRI) */}
        <div className="border border-slate-300 rounded-2xl p-3.5 sm:p-4 text-xs text-slate-800 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 sm:gap-y-2">
            <div className="sm:col-span-2">
              <span className="font-bold text-slate-900">Razón Social / Nombres y Apellidos:</span>{' '}
              <span className="font-medium text-slate-900">{invoice.clientName}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900">Identificación:</span>{' '}
              <span className="font-mono font-medium text-slate-900">{invoice.clientTaxId || '9999999999999'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900">Fecha:</span>{' '}
              <span className="font-mono font-medium text-slate-900">{formatSriDate(invoice.issuedAt)}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="font-bold text-slate-900">Dirección:</span>{' '}
              <span className="font-medium text-slate-800">{invoice.clientAddress || 'Ambato, Ecuador'}</span>
            </div>
          </div>
        </div>

        {/* Tabla de Productos / Ítems (Oficial SRI con acento azul de marca) */}
        <div className="border border-slate-300 rounded-2xl overflow-x-auto bg-white print:overflow-visible scrollbar-thin">
          <table className="w-full min-w-[500px] sm:min-w-0 text-xs text-left border-collapse">
            <thead>
              <tr className="bg-blue-50/70 border-b border-blue-200/80 text-blue-950 text-[10px] sm:text-[10.5px] font-bold tracking-tight">
                <th className="py-2 sm:py-2.5 px-2.5 sm:px-3 border-r border-blue-200/60 w-24 sm:w-28">Cod. Principal</th>
                <th className="py-2 sm:py-2.5 px-2 border-r border-blue-200/60 text-right w-14 sm:w-16">Cantidad</th>
                <th className="py-2 sm:py-2.5 px-2.5 sm:px-3 border-r border-blue-200/60">Descripción</th>
                <th className="py-2 sm:py-2.5 px-2 border-r border-blue-200/60 text-right w-20 sm:w-24">Precio Unitario</th>
                <th className="py-2 sm:py-2.5 px-2 border-r border-blue-200/60 text-right w-14 sm:w-16">Descuento</th>
                <th className="py-2 sm:py-2.5 px-2.5 sm:px-3 text-right w-20 sm:w-24">Precio Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {facturaLines.map((line, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-1.5 sm:py-2 px-2.5 sm:px-3 border-r border-slate-200 font-mono text-[10.5px] sm:text-[11px] font-semibold text-slate-800">
                    {line.codigoPrincipal}
                  </td>
                  <td className="py-1.5 sm:py-2 px-2 border-r border-slate-200 text-right font-mono text-[10.5px] sm:text-[11px]">
                    {line.cantidad.toFixed(2)}
                  </td>
                  <td className="py-1.5 sm:py-2 px-2.5 sm:px-3 border-r border-slate-200 text-slate-900">
                    <span className="font-medium text-slate-900 block">{line.descripcion}</span>
                  </td>
                  <td className="py-1.5 sm:py-2 px-2 border-r border-slate-200 text-right font-mono text-[10.5px] sm:text-[11px]">
                    {line.precioUnitarioSinIva.toFixed(4)}
                  </td>
                  <td className="py-1.5 sm:py-2 px-2 border-r border-slate-200 text-right font-mono text-[10.5px] sm:text-[11px] text-slate-500">
                    0.00
                  </td>
                  <td className="py-1.5 sm:py-2 px-2.5 sm:px-3 text-right font-mono font-semibold text-slate-900 text-[10.5px] sm:text-[11px]">
                    {line.precioTotalSinImpuesto.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sección Inferior: Información Adicional + Formas de Pago (Izquierda) / Totales SRI (Derecha) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-start pt-1">
          {/* Columna Izquierda */}
          <div className="space-y-2.5 sm:space-y-3">
            {/* Información Adicional */}
            <div className="border border-slate-300 rounded-2xl p-3 sm:p-3.5 text-xs space-y-1 sm:space-y-1.5 bg-white">
              <h4 className="font-bold text-blue-950 text-[11px] uppercase tracking-wide border-b border-blue-100 pb-1">
                Información Adicional
              </h4>
              <div className="space-y-1 text-[11px] text-slate-700 pt-0.5">
                {invoice.clientEmail && (
                  <p><strong className="text-slate-900">Email:</strong> {invoice.clientEmail}</p>
                )}
                {invoice.clientWhatsapp && (
                  <p><strong className="text-slate-900">Teléfono:</strong> {invoice.clientWhatsapp}</p>
                )}
                {invoice.clientAddress && (
                  <p><strong className="text-slate-900">Dirección:</strong> {invoice.clientAddress}</p>
                )}
                <p><strong className="text-slate-900">Distribuidor:</strong> ANETH Distribuciones</p>
              </div>
            </div>

            {/* Tabla Forma de Pago (con acento azul de marca) */}
            <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-blue-50/70 border-b border-blue-200/80 text-blue-950 text-[10.5px] font-bold tracking-tight">
                    <th className="py-2 px-3 border-r border-blue-200/60">Forma de pago</th>
                    <th className="py-2 px-3 text-right w-24">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-200 text-[11px] text-slate-800">
                      20 - OTROS CON UTILIZACION DEL SISTEMA FINANCIERO
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(invoice.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Columna Derecha: Totales SRI Oficiales */}
          <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white">
            <table className="w-full text-xs border-collapse">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-200 text-[11px]">
                    SUBTOTAL 15%
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-medium text-slate-900 w-28">
                    {subtotal15.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-200 text-[11px]">
                    SUBTOTAL 0%
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 w-28">
                    0.00
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-200 text-[11px]">
                    SUBTOTAL NO OBJETO DE IVA
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 w-28">
                    0.00
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-200 text-[11px]">
                    SUBTOTAL EXENTO DE IVA
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 w-28">
                    0.00
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-200 text-[11px]">
                    SUBTOTAL SIN IMPUESTOS
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-medium text-slate-900 w-28">
                    {subtotal15.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-200 text-[11px]">
                    TOTAL DESCUENTO
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 w-28">
                    0.00
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-200 text-[11px]">
                    ICE
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 w-28">
                    0.00
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-200 text-[11px]">
                    IVA 15%
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-medium text-slate-900 w-28">
                    {tax15.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-200 text-[11px]">
                    IRBPNR
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 w-28">
                    0.00
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-200 text-[11px]">
                    PROPINA
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-500 w-28">
                    0.00
                  </td>
                </tr>
                <tr className="bg-blue-50/90 font-bold border-t-2 border-blue-200">
                  <td className="py-2.5 px-3 text-blue-950 border-r border-blue-200 text-xs font-black">
                    VALOR TOTAL
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm font-black text-blue-700 w-28">
                    {formatCurrency(invoice.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
