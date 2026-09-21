'use client';

import React, { useMemo } from 'react';
import { Invoice } from '@/types';
import { formatCurrency, formatUnitPrice, formatDate, generateWhatsAppOrderLink } from '@/lib/utils/formatters';
import { QRCodeSVG } from 'qrcode.react';
import { AnethFullLogo } from '@/components/ui/AnethLogo';
import { AppleWhatsAppIcon } from '@/components/ui/AppleIcons';
import {
  X,
  Printer,
  CheckCircle2,
  FileText,
  Download,
  Code,
  ShieldCheck,
} from 'lucide-react';
import { generarClaveAcceso } from '@/lib/sri/claveAcceso';
import { buildFacturaXml, DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';

interface InvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceModal({ invoice, isOpen, onClose }: InvoiceModalProps) {
  if (!isOpen || !invoice) return null;

  // Clave de acceso de 49 dígitos generada o existente
  const claveAcceso = useMemo(() => {
    if (invoice.claveAcceso) return invoice.claveAcceso;
    const seq = parseInt(invoice.invoiceNumber.replace(/\D/g, '').slice(-9), 10) || 1;
    return generarClaveAcceso({
      fecha: new Date(invoice.issuedAt),
      ruc: DEFAULT_TAX_PROFILE.ruc,
      ambiente: '1',
      establecimiento: '001',
      puntoEmision: '001',
      secuencial: seq,
    });
  }, [invoice]);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
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

  const subtotal15 = invoice.subtotal15 && invoice.subtotal15 < invoice.total
    ? invoice.subtotal15
    : Number((invoice.total / 1.15).toFixed(2));
  const tax15 = invoice.tax && invoice.tax > 0
    ? invoice.tax
    : Number((invoice.total - subtotal15).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8 print:border-none print:shadow-none print:m-0 print:rounded-none">
        {/* Top bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Factura Electrónica #{invoice.invoiceNumber}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Comprobante Oficial SRI Ecuador</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              type="button"
              onClick={handleDownloadXml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:scale-[0.97] text-slate-700 rounded-xl text-xs font-medium border border-slate-200/60 transition-all cursor-pointer"
              title="Descargar XML firmado SRI"
            >
              <Code className="w-3.5 h-3.5 text-slate-500" />
              <span>XML</span>
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 active:scale-[0.97] border border-emerald-500/20 text-emerald-800 rounded-xl text-xs font-medium transition-all cursor-pointer"
              title="Compartir por WhatsApp"
            >
              <AppleWhatsAppIcon size={15} alt="WhatsApp" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.97] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Descargar PDF o Imprimir"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 rounded-xl transition-all ml-1 cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable invoice body (RIDE) */}
        <div id="invoice-printable-area" className="p-6 sm:p-8 space-y-5 text-slate-800 bg-white">
          {/* Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-200 pb-5">
            {/* Emisor Info */}
            <div className="space-y-1">
              <AnethFullLogo size="md" showSubtitle={true} subtitleText="DISTRIBUIDORA" />
              <p className="text-xs text-slate-700 font-bold pt-1">
                {DEFAULT_TAX_PROFILE.razonSocial}
              </p>
              <p className="text-xs text-slate-500">RUC: {DEFAULT_TAX_PROFILE.ruc}</p>
              <p className="text-xs text-slate-500">Matriz: {DEFAULT_TAX_PROFILE.dirMatriz}</p>
              <p className="text-xs text-slate-500">Obligado a llevar contabilidad: {DEFAULT_TAX_PROFILE.obligadoContabilidad}</p>
              <p className="text-[11px] text-blue-700 font-bold">RÉGIMEN GENERAL</p>
            </div>

            {/* Cuadro Oficial SRI */}
            <div className="border border-slate-300 rounded-2xl p-3.5 bg-slate-50/80 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-black text-sm text-slate-900">FACTURA</span>
                <span className="font-mono font-bold text-slate-700">No. {invoice.invoiceNumber}</span>
              </div>
              <p className="text-slate-600">
                <strong className="text-slate-800">Fecha de Emisión:</strong> {formatDate(invoice.issuedAt)}
              </p>
              <p className="text-slate-600">
                <strong className="text-slate-800">Ambiente:</strong> PRUEBAS (Sandbox SRI)
              </p>
              <p className="text-slate-600">
                <strong className="text-slate-800">Emisión:</strong> NORMAL
              </p>
              <div>
                <span className="text-[10px] text-slate-500 font-black block uppercase tracking-wider">
                  Clave de Acceso / Autorización:
                </span>
                <span className="font-mono text-[10px] text-slate-900 font-bold break-all block">
                  {claveAcceso}
                </span>
              </div>
            </div>
          </div>

          {/* Client info */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
            <h3 className="font-black text-slate-900 mb-2 uppercase tracking-wider text-xs">
              Información del Comprador
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-slate-500 font-medium">Razón Social / Nombre:</span>{' '}
                <span className="font-black text-slate-900">{invoice.clientName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Establecimiento:</span>{' '}
                <span className="font-black text-slate-900">{invoice.businessName || 'Local Registrado'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Identificación (RUC/CI):</span>{' '}
                <span className="font-mono font-bold text-slate-900">{invoice.clientTaxId || '9999999999999 (Consumidor Final)'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Teléfono / WhatsApp:</span>{' '}
                <span className="font-mono font-semibold text-slate-900">{invoice.clientWhatsapp}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 font-medium">Dirección de Entrega:</span>{' '}
                <span className="font-medium text-slate-800">{invoice.clientAddress || 'Sector comercial asignado'}</span>
              </div>
            </div>
          </div>

          {/* Items Table with Mixed Sales breakdown */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-black uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">Cant.</th>
                  <th className="py-2.5 px-3">Descripción</th>
                  <th className="py-2.5 px-3">Detalle Sabor</th>
                  <th className="py-2.5 px-3 text-right">P. Unitario</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {invoice.items.map((it, idx) => {
                  const hasJavas = it.quantityJavas > 0;
                  const hasUnits = (it.quantityUnits || 0) > 0;
                  const effectivePricePerUnit = it.pricePerUnit > 0
                    ? it.pricePerUnit
                    : Number(((it.pricePerJava || 0) / (it.unitsPerJava || 12)).toFixed(4));

                  const packSubtotal = Number((it.quantityJavas * it.pricePerJava).toFixed(2));
                  const unitSubtotal = hasJavas
                    ? Number((it.subtotal - packSubtotal).toFixed(2))
                    : Number(((it.quantityUnits || 0) * effectivePricePerUnit).toFixed(2));

                  const packLabel = it.container === 'Vidrio' ? 'jav' : 'pack';

                  return (
                    <React.Fragment key={it.id || idx}>
                      {/* Fila Paquete / Java */}
                      {hasJavas && (
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-mono font-black text-slate-900">
                            {it.quantityJavas} {packLabel}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-black text-slate-900 block">
                              {it.brand || 'Fructi'} • {it.size} {it.container}
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              {it.quantityJavas * it.unitsPerJava} botellas ({it.unitsPerJava} und/paq)
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {it.flavorType === 'single' ? (
                              <span>{it.selectedFlavor}</span>
                            ) : (
                              <span className="text-blue-700 font-semibold">
                                Surtido:{' '}
                                {it.surtidoDetails &&
                                  Object.entries(it.surtidoDetails)
                                    .map(([fl, q]) => `${q} ${fl}`)
                                    .join(', ')}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                            {formatCurrency(it.pricePerJava)} / {packLabel}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                            {formatCurrency(packSubtotal)}
                          </td>
                        </tr>
                      )}

                      {/* Fila Unidad Suelta */}
                      {hasUnits && (
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-mono font-black text-amber-800">
                            {it.quantityUnits} und
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-black text-slate-900 block">
                              {it.brand || 'Fructi'} • {it.size} {it.container}
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              Botella individual
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {it.flavorType === 'single' ? (
                              <span>{it.selectedFlavor}</span>
                            ) : (
                              <span className="text-blue-700 font-semibold">Surtido</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                            {formatUnitPrice(effectivePricePerUnit)} / und
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                            {formatCurrency(unitSubtotal)}
                          </td>
                        </tr>
                      )}

                      {/* Fallback */}
                      {!hasJavas && !hasUnits && (
                        <tr className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-mono font-black text-slate-900">
                            {it.totalBottles || 1} und
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-black text-slate-900 block">
                              {it.beverageType} • {it.size} {it.container}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {it.selectedFlavor || 'Surtido'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                            {formatCurrency(it.pricePerJava)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                            {formatCurrency(it.subtotal)}
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pt-2">
            <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <QRCodeSVG
                value={`https://sri.gob.ec/comprobantes-electronicos?clave=${claveAcceso}`}
                size={70}
                level="M"
              />
              <div className="text-xs text-slate-600">
                <span className="font-black text-slate-900 block flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                  Validador SRI Ecuador
                </span>
                <span className="text-[11px]">Escanea para verificar la autorización oficial en el SRI.</span>
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Base 15%):</span>
                <span className="font-mono font-bold text-slate-800">{formatCurrency(subtotal15)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IVA 15%:</span>
                <span className="font-mono font-bold text-slate-800">{formatCurrency(tax15)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-200 pt-2">
                <span>Total a Pagar:</span>
                <span className="font-mono text-xl text-blue-700">
                  {formatCurrency(invoice.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="border-t border-slate-100 pt-3 text-center text-xs text-slate-500">
            Comprobante emitido de conformidad con la normativa del SRI Ecuador • Distribuidora Aneth
          </div>
        </div>
      </div>
    </div>
  );
}
