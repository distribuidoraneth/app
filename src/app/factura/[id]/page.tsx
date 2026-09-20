'use client';

import React, { use, useState, useMemo } from 'react';
import { useDistribution } from '@/context/DistributionContext';
import { formatCurrency, formatUnitPrice, formatDate, generateWhatsAppOrderLink } from '@/lib/utils/formatters';
import { PoplQRCodeSVG } from '@/components/ui/PoplQRCodeSVG';
import Link from 'next/link';
import { AnethFullLogo } from '@/components/ui/AnethLogo';
import { AppleWhatsAppIcon } from '@/components/ui/AppleIcons';
import { generarClaveAcceso } from '@/lib/sri/claveAcceso';
import { buildFacturaXml, DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';
import {
  Printer,
  Download,
  Code,
  ArrowLeft,
  Copy,
  Check,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Store,
  RefreshCw,
  AlertCircle,
  Clock,
  Info,
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

  const [copied, setCopied] = useState<boolean>(false);
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
      const seq = parseInt(invoice.invoiceNumber.replace(/\D/g, '').slice(-9), 10) || 1;
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
          claveAcceso,
        }),
      });
      const data = await res.json();
      if (data && data.sriStatus) {
        setSriStatus(data.sriStatus);
        setSriAuthNum(data.numeroAutorizacion);
        setSriAuthDate(data.fechaAutorizacion);
        setSriErrorMsg(data.error);
        setSriFeedback(
          data.sriStatus === 'AUTORIZADO'
            ? '¡Factura reemitida y AUTORIZADA con éxito en el SRI!'
            : data.sriStatus === 'RECIBIDA'
            ? 'Factura RECIBIDA por el SRI. En cola de autorización.'
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

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
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

  return (
    <div className="min-h-screen bg-[#f8fafc] py-6 sm:py-10 px-4 flex flex-col items-center print:bg-white print:p-0">
      {/* Top action bar (hidden in print) */}
      <div className="print:hidden w-full max-w-3xl bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center space-x-1.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Portal</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors border border-slate-200"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
            <span>{copied ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadXml}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors border border-slate-300 shadow-xs"
          >
            <Code className="w-3.5 h-3.5 text-blue-600" />
            <span>Descargar XML</span>
          </button>

          <button
            type="button"
            onClick={handleConsultarSri}
            disabled={isCheckingSri}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isCheckingSri ? 'animate-spin' : ''}`} />
            <span>{isCheckingSri ? 'Consultando...' : 'Consultar SRI en Vivo'}</span>
          </button>

          {(sriStatus === 'DEVUELTA' || sriStatus === 'NO AUTORIZADO') && (
            <button
              type="button"
              onClick={handleReintentarSri}
              disabled={isRetryingSri}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetryingSri ? 'animate-spin' : ''}`} />
              <span>{isRetryingSri ? 'Reemitiendo...' : 'Reintentar Emisión SRI'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <AppleWhatsAppIcon size={16} alt="WhatsApp" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Descargar PDF / Imprimir</span>
          </button>
        </div>
      </div>

      {/* Alerta de resultado SRI en vivo */}
      {sriFeedback && (
        <div className="print:hidden w-full max-w-3xl mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold">{sriFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setSriFeedback(null)}
            className="text-blue-500 hover:text-blue-700 font-black text-sm ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Official SRI Printable RIDE */}
      <div
        id="invoice-printable-area"
        className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-10 space-y-6 text-slate-800 print:shadow-none print:border-none print:p-4 print:rounded-none"
      >
        {/* Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-200 pb-6">
          {/* Emisor Oficial */}
          <div className="space-y-1.5">
            <AnethFullLogo size="md" showSubtitle={true} subtitleText="DISTRIBUIDORA" />
            <div className="pt-2 text-xs space-y-0.5 text-slate-600">
              <p className="font-extrabold text-slate-900 text-sm">
                {DEFAULT_TAX_PROFILE.razonSocial}
              </p>
              <p><strong className="text-slate-800">RUC:</strong> {DEFAULT_TAX_PROFILE.ruc}</p>
              <p><strong className="text-slate-800">Matriz:</strong> {DEFAULT_TAX_PROFILE.dirMatriz}</p>
              <p><strong className="text-slate-800">Obligado a llevar contabilidad:</strong> {DEFAULT_TAX_PROFILE.obligadoContabilidad}</p>
              <span className="inline-block text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 mt-1">
                RÉGIMEN GENERAL (SRI)
              </span>
            </div>
          </div>

          {/* Cuadro Oficial SRI */}
          <div className="border-2 border-slate-300 rounded-2xl p-4 bg-slate-50/90 space-y-2 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="font-black text-base text-slate-900">FACTURA ELECTRÓNICA</span>
              <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-800">
                No. {invoice.invoiceNumber}
              </span>
            </div>

            {/* Estado SRI Oficial */}
            <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
              <span className="text-[11px] font-extrabold text-slate-600 uppercase">Estado SRI:</span>
              {sriStatus === 'AUTORIZADO' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  AUTORIZADO
                </span>
              ) : sriStatus === 'RECIBIDA' || sriStatus === 'EN PROCESO' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                  <Clock className="w-3.5 h-3.5 mr-1 text-amber-600 animate-spin" />
                  RECIBIDA (EN PROCESO)
                </span>
              ) : sriStatus === 'DEVUELTA' || sriStatus === 'NO AUTORIZADO' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                  DEVUELTA POR SRI
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  PENDIENTE DE RECEPCIÓN
                </span>
              )}
            </div>

            {sriErrorMsg && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-2 text-[11px] text-rose-800">
                <strong className="block font-bold">Motivo SRI:</strong>
                <p className="mt-0.5 leading-snug">{sriErrorMsg}</p>
              </div>
            )}

            <div className="space-y-1 text-slate-600">
              <p><strong className="text-slate-800">Fecha de Emisión:</strong> {formatDate(invoice.issuedAt)}</p>
              <p>
                <strong className="text-slate-800">Ambiente:</strong>{' '}
                <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  PRUEBAS (Celcer)
                </span>
              </p>
              <p><strong className="text-slate-800">Tipo de Emisión:</strong> NORMAL</p>
              {sriAuthNum && sriStatus === 'AUTORIZADO' && (
                <p><strong className="text-slate-800">No. Autorización:</strong> <span className="font-mono">{sriAuthNum}</span></p>
              )}
              {sriAuthDate && (
                <p><strong className="text-slate-800">Fecha Autorización:</strong> {formatDate(sriAuthDate)}</p>
              )}
            </div>

            <div className="pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Clave de Acceso (49 dígitos):
                </span>
                <button
                  type="button"
                  onClick={handleConsultarSri}
                  disabled={isCheckingSri}
                  className="print:hidden text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isCheckingSri ? 'animate-spin' : ''}`} />
                  <span>Verificar con SRI</span>
                </button>
              </div>
              <span className="font-mono text-[10px] text-slate-900 font-bold break-all block bg-white p-1.5 rounded border border-slate-200 mt-0.5 select-all">
                {claveAcceso}
              </span>
            </div>

            {/* Advertencia amigable sobre búsqueda en SRI en Línea */}
            <div className="print:hidden bg-blue-50/70 border border-blue-200 rounded-xl p-2.5 text-[11px] text-blue-900 space-y-1 mt-2">
              <div className="flex items-start space-x-1.5 font-bold">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>¿Cómo buscar esta clave en SRI en Línea?</span>
              </div>
              <p className="text-[10px] text-blue-800 leading-relaxed">
                Al estar en <strong>Ambiente de Pruebas</strong>, en el portal de <em>srienlinea.sri.gob.ec</em> debes seleccionar obligatoriamente <strong>&quot;PRUEBAS&quot;</strong> en el filtro de Ambiente. Si buscas con el filtro por defecto (&quot;PRODUCCIÓN&quot;), el SRI indicará que no existe.
              </p>
            </div>
          </div>
        </div>

        {/* Client info */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
          <h3 className="font-extrabold text-slate-900 mb-2 uppercase tracking-wider text-[11px] flex items-center">
            <Store className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            Información del Comprador / Cliente
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-700">
            <div>
              <span className="text-slate-500 font-medium">Razón Social / Nombre:</span>{' '}
              <span className="font-bold text-slate-900">{invoice.clientName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Establecimiento:</span>{' '}
              <span className="font-bold text-slate-900">{invoice.businessName || 'Local Registrado'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">RUC / Cédula:</span>{' '}
              <span className="font-mono font-bold text-slate-900">{invoice.clientTaxId || '9999999999999 (Consumidor Final)'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">WhatsApp:</span>{' '}
              <span className="font-mono text-slate-900">{invoice.clientWhatsapp}</span>
            </div>
            {invoice.clientEmail && (
              <div className="sm:col-span-2">
                <span className="text-slate-500 font-medium">Email Tributario:</span>{' '}
                <span className="font-medium text-slate-900">{invoice.clientEmail}</span>
              </div>
            )}
            <div className="sm:col-span-2">
              <span className="text-slate-500 font-medium">Dirección de Entrega:</span>{' '}
              <span className="font-medium text-slate-900">{invoice.clientAddress}</span>
            </div>
          </div>
        </div>

        {/* Table of Items */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 pr-2 font-bold">Cant.</th>
                <th className="py-2.5 px-2 font-bold">Descripción del Producto</th>
                <th className="py-2.5 px-2 text-right font-bold">P. Unitario</th>
                <th className="py-2.5 pl-2 text-right font-bold">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {invoice.items.map((item, idx) => {
                const hasJavas = item.quantityJavas > 0;
                const hasUnits = (item.quantityUnits || 0) > 0;
                const effectivePricePerUnit = item.pricePerUnit > 0
                  ? item.pricePerUnit
                  : Number(((item.pricePerJava || 0) / (item.unitsPerJava || 12)).toFixed(4));

                const packSubtotal = Number((item.quantityJavas * item.pricePerJava).toFixed(2));
                const unitSubtotal = hasJavas
                  ? Number((item.subtotal - packSubtotal).toFixed(2))
                  : Number(((item.quantityUnits || 0) * effectivePricePerUnit).toFixed(2));

                const packLabel = item.container === 'Vidrio' ? 'jav' : 'pack';

                return (
                  <React.Fragment key={idx}>
                    {/* Fila Paquete / Java */}
                    {hasJavas && (
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 pr-2 font-bold whitespace-nowrap">
                          {item.quantityJavas} {packLabel}
                        </td>
                        <td className="py-3 px-2">
                          <p className="font-bold text-slate-900">
                            {item.brand || 'Fructi'} {item.size} ({item.container})
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {item.flavorType === 'surtido'
                              ? `Surtido: ${Object.entries(item.surtidoDetails || {}).map(([f, q]) => `${q} ${f}`).join(', ')}`
                              : `Sabor: ${item.selectedFlavor}`}
                            {' • '}{item.quantityJavas * item.unitsPerJava} botellas ({item.unitsPerJava} und/paq)
                          </p>
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-medium">
                          ${item.pricePerJava.toFixed(2)}/{packLabel}
                        </td>
                        <td className="py-3 pl-2 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(packSubtotal)}
                        </td>
                      </tr>
                    )}

                    {/* Fila Unidad Suelta */}
                    {hasUnits && (
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 pr-2 font-bold whitespace-nowrap text-amber-800">
                          {item.quantityUnits} und
                        </td>
                        <td className="py-3 px-2">
                          <p className="font-bold text-slate-900">
                            {item.brand || 'Fructi'} {item.size} ({item.container})
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {item.flavorType === 'single' ? `Sabor: ${item.selectedFlavor}` : 'Surtido'} • Botella individual
                          </p>
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-medium">
                          {formatUnitPrice(effectivePricePerUnit)}/und
                        </td>
                        <td className="py-3 pl-2 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(unitSubtotal)}
                        </td>
                      </tr>
                    )}

                    {/* Fallback */}
                    {!hasJavas && !hasUnits && (
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 pr-2 font-bold whitespace-nowrap">
                          {item.totalBottles || 1} und
                        </td>
                        <td className="py-3 px-2">
                          <p className="font-bold text-slate-900">
                            {item.beverageType} {item.size} ({item.container})
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {item.selectedFlavor || 'Surtido'}
                          </p>
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-medium">
                          ${item.pricePerJava.toFixed(2)}
                        </td>
                        <td className="py-3 pl-2 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals & QR Verification */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 items-start">
          {/* QR Code de Validación SRI */}
          <div className="flex items-center space-x-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="bg-white p-2 rounded-xl border border-slate-200 shrink-0 flex items-center justify-center">
              <PoplQRCodeSVG
                value={`https://sri.gob.ec/comprobantes-electronicos?clave=${claveAcceso}`}
                size={80}
                color="#000000"
                bgColor="#ffffff"
              />
            </div>
            <div className="text-[11px] text-slate-600 space-y-0.5">
              <span className="font-extrabold text-slate-900 flex items-center text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                Validez Tributaria SRI
              </span>
              <p>Escanea este código QR para verificar la autorización legal en el portal del SRI.</p>
            </div>
          </div>

          {/* Liquidación de Totales */}
          <div className="space-y-1.5 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200 font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal 15% IVA:</span>
              <span className="font-bold text-slate-800">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Subtotal 0% IVA:</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>IVA (15%):</span>
              <span className="font-bold text-slate-800">$0.00</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-1.5 font-sans">
              <span>VALOR TOTAL:</span>
              <span className="font-mono text-base text-blue-700">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-slate-100 text-[11px] text-slate-400">
          <p>Documento RIDE generado por la plataforma oficial de <strong>Distribuidora Aneth</strong>.</p>
        </div>
      </div>
    </div>
  );
}
