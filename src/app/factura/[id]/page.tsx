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
  generateWhatsAppOrderLink,
} from '@/lib/utils/formatters';
import Link from 'next/link';
import { AnethFullLogo } from '@/components/ui/AnethLogo';
import { AppleWhatsAppIcon } from '@/components/ui/AppleIcons';
import { SriBarcodeSVG } from '@/components/ui/SriBarcodeSVG';
import { generarClaveAcceso } from '@/lib/sri/claveAcceso';
import { buildFacturaXml, DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';
import {
  Printer,
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
  const { invoices } = useDistribution();

  const invoice =
    invoices.find((i) => i.invoiceNumber === resolvedParams.id || i.id === resolvedParams.id) ||
    invoices[0];

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

  const [sriStatus, setSriStatus] = useState<string | null>(invoice?.sriStatus || null);
  const [sriAuthNum, setSriAuthNum] = useState<string | null>(invoice?.sriAuthorizationNumber || null);
  const [sriAuthDate, setSriAuthDate] = useState<string | null>(invoice?.sriAuthorizationDate || null);
  const [sriErrorMsg, setSriErrorMsg] = useState<string | null>(invoice?.sriErrorMessage || null);
  const [isCheckingSri, setIsCheckingSri] = useState<boolean>(false);
  const [isRetryingSri, setIsRetryingSri] = useState<boolean>(false);
  const [sriFeedback, setSriFeedback] = useState<string | null>(null);

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

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!invoice) return;
    const link = generateWhatsAppOrderLink({
      phone: invoice.clientWhatsapp,
      clientName: invoice.clientName,
      orderNumber: invoice.orderId,
      total: invoice.total,
      invoiceNumber: invoice.invoiceNumber,
    });
    window.open(link, '_blank');
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

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-sm">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h2 className="font-extrabold text-slate-900">Factura no disponible</h2>
          <p className="text-xs text-slate-500 mt-1">El comprobante consultado aún no ha sido emitido.</p>
          <Link href="/" className="mt-4 inline-block px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs">
            Volver a la App
          </Link>
        </div>
      </div>
    );
  }

  const subtotal15 =
    invoice.subtotal15 && invoice.subtotal15 < invoice.total
      ? invoice.subtotal15
      : Number((invoice.total / 1.15).toFixed(2));
  const tax15 =
    invoice.tax && invoice.tax > 0
      ? invoice.tax
      : Number((invoice.total - subtotal15).toFixed(2));

  return (
    <div className="min-h-screen bg-[#f8fafc] py-6 sm:py-10 px-4 flex flex-col items-center print:bg-white print:p-0">
      {/* Top action bar (hidden in print) - Apple Design glassmorphic toolbar */}
      <div className="print:hidden w-full max-w-3xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] rounded-2xl p-2 sm:px-3 sm:py-2 mb-5 flex items-center justify-between gap-2 transition-all">
        {/* Volver */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100/80 active:scale-[0.97] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver</span>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Consultar SRI (Compact, subtle) */}
          <button
            type="button"
            onClick={handleConsultarSri}
            disabled={isCheckingSri}
            title="Consultar estado SRI en vivo"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:scale-[0.97] text-slate-600 hover:text-slate-900 rounded-xl text-xs font-medium transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingSri ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">{isCheckingSri ? 'Consultando...' : 'Consultar'}</span>
          </button>

          {/* Reintentar en caso de devolución */}
          {(sriStatus === 'DEVUELTA' || sriStatus === 'NO AUTORIZADO') && (
            <button
              type="button"
              onClick={handleReintentarSri}
              disabled={isRetryingSri}
              title="Reintentar emisión SRI"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.97] text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetryingSri ? 'animate-spin' : ''}`} />
              <span>{isRetryingSri ? 'Reemitiendo...' : 'Reintentar'}</span>
            </button>
          )}

          {/* WhatsApp */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            title="Compartir por WhatsApp"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 active:scale-[0.97] border border-emerald-500/20 text-emerald-800 rounded-xl text-xs font-medium transition-all cursor-pointer"
          >
            <AppleWhatsAppIcon size={15} alt="WhatsApp" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          {/* XML */}
          <button
            type="button"
            onClick={handleDownloadXml}
            title="Descargar archivo XML oficial"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:scale-[0.97] text-slate-700 rounded-xl text-xs font-medium border border-slate-200/60 transition-all cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-slate-500" />
            <span>XML</span>
          </button>

          {/* PDF */}
          <button
            type="button"
            onClick={handlePrint}
            title="Imprimir o guardar como PDF"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.97] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF</span>
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
        className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-4 text-slate-800 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none"
      >
        {/* Top Header Section: Left (Emisor Box) & Right (SRI Factura Box) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
          {/* Columna Izquierda: Logo + Cuadro Emisor */}
          <div className="flex flex-col justify-between space-y-3">
            {/* Logo */}
            <div className="py-1 px-0.5">
              <AnethFullLogo size="md" showSubtitle={true} subtitleText="DISTRIBUIDORA" />
            </div>

            {/* Cuadro Oficial Emisor */}
            <div className="border border-slate-300 rounded-2xl p-4 space-y-2 text-xs text-slate-800 bg-white flex-1 flex flex-col justify-center">
              <div>
                <h2 className="font-extrabold text-slate-900 text-sm tracking-tight uppercase">
                  {DEFAULT_TAX_PROFILE.razonSocial}
                </h2>
                <p className="font-semibold text-slate-900 mt-0.5">
                  <span className="text-slate-600 font-normal">R.U.C.: </span>
                  {DEFAULT_TAX_PROFILE.ruc}
                </p>
                <p className="font-bold text-slate-800 mt-0.5 tracking-tight">
                  {DEFAULT_TAX_PROFILE.nombreComercial || 'DISTRIBUIDORA ANETH'}
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
          <div className="border border-slate-300 rounded-2xl p-4 text-xs text-slate-800 bg-white flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-slate-900">
                <span className="text-slate-600 font-normal">R.U.C.: </span>
                {DEFAULT_TAX_PROFILE.ruc}
              </p>
              <h1 className="text-base font-black text-slate-900 tracking-tight">
                FACTURA
              </h1>
              <p className="font-mono font-bold text-xs text-slate-900 whitespace-nowrap">
                No. {invoice.invoiceNumber}
              </p>

              <div className="pt-1">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                  NÚMERO DE AUTORIZACIÓN
                </span>
                <span className="font-mono text-[11px] text-slate-900 font-bold block break-all leading-tight">
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
              <div className="w-full bg-white py-0.5">
                <SriBarcodeSVG value={claveAcceso} className="w-full h-11" />
              </div>
              <span className="font-mono text-[10px] text-slate-900 font-medium block text-center tracking-tight select-all mt-0.5">
                {claveAcceso}
              </span>
            </div>
          </div>
        </div>

        {/* Cuadro Comprador / Cliente (Oficial SRI) */}
        <div className="border border-slate-300 rounded-2xl p-4 text-xs text-slate-800 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
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
        <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-blue-50/70 border-b border-blue-200/80 text-blue-950 text-[10.5px] font-bold tracking-tight">
                <th className="py-2.5 px-3 border-r border-blue-200/60 w-28">Cod. Principal</th>
                <th className="py-2.5 px-2.5 border-r border-blue-200/60 text-right w-16">Cantidad</th>
                <th className="py-2.5 px-3 border-r border-blue-200/60">Descripción</th>
                <th className="py-2.5 px-2.5 border-r border-blue-200/60 text-right w-24">Precio Unitario</th>
                <th className="py-2.5 px-2 border-r border-blue-200/60 text-right w-16">Descuento</th>
                <th className="py-2.5 px-3 text-right w-24">Precio Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {invoice.items.map((item, idx) => {
                const cantidad = item.totalBottles && item.totalBottles > 0
                  ? item.totalBottles
                  : (item.quantityJavas || 0) * (item.unitsPerJava || 12) + (item.quantityUnits || 0);

                const subtotalItem = Number(item.subtotal.toFixed(2));
                const baseImponibleItem = Number((subtotalItem / 1.15).toFixed(2));
                const precioUnitario = Number((baseImponibleItem / (cantidad || 1)).toFixed(4));
                const codPrincipal = formatProductSku(item.productOptionId);

                const packInfo = item.quantityJavas > 0
                  ? `${item.quantityJavas} ${item.container === 'Vidrio' ? 'javas' : 'packs'}`
                  : '';
                const unitInfo = item.quantityUnits > 0 ? `${item.quantityUnits} unidades` : '';
                const breakdown = [packInfo, unitInfo].filter(Boolean).join(' + ');

                const nombreProducto = `${item.brand || 'Fructi'} ${item.size} ${item.container} - ${
                  item.flavorType === 'surtido' ? 'Surtido' : item.selectedFlavor || 'Original'
                }`;

                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px] font-semibold text-slate-800">
                      {codPrincipal}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-right font-mono text-[11px]">
                      {Number(cantidad).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-900">
                      <span className="font-medium text-slate-900 block">{nombreProducto}</span>
                      {breakdown && (
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-normal">
                          Presentación: {breakdown}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-right font-mono text-[11px]">
                      {precioUnitario.toFixed(4)}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-200 text-right font-mono text-[11px] text-slate-500">
                      0.00
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 text-[11px]">
                      {baseImponibleItem.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Sección Inferior: Información Adicional + Formas de Pago (Izquierda) / Totales SRI (Derecha) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-1">
          {/* Columna Izquierda */}
          <div className="space-y-3">
            {/* Información Adicional */}
            <div className="border border-slate-300 rounded-2xl p-3.5 text-xs space-y-1.5 bg-white">
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
                <p><strong className="text-slate-900">Distribuidor:</strong> Distribuidora Aneth Oficial</p>
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
