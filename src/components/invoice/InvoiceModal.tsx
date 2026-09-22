'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Invoice } from '@/types';
import { useDistribution } from '@/context/DistributionContext';
import {
  formatCurrency,
  formatDate,
  expandCartItemsToFacturaLines,
  generateWhatsAppOrderLink,
} from '@/lib/utils/formatters';
import { AppleWhatsAppIcon } from '@/components/ui/AppleIcons';
import { InvoiceRideDocument } from '@/components/invoice/InvoiceRideDocument';
import {
  X,
  Printer,
  FileDown,
  Loader2,
  Code,
  ExternalLink,
} from 'lucide-react';
import { generarClaveAcceso } from '@/lib/sri/claveAcceso';
import { buildFacturaXml, DEFAULT_TAX_PROFILE } from '@/lib/sri/xmlBuilder';
import { downloadInvoicePdf } from '@/lib/utils/pdfGenerator';

interface InvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  showWhatsApp?: boolean;
}

export function InvoiceModal({
  invoice,
  isOpen,
  onClose,
  showWhatsApp = true,
}: InvoiceModalProps) {
  const { orders } = useDistribution();
  // Clave de acceso de 49 dígitos generada o existente
  const claveAcceso = useMemo(() => {
    if (!invoice) return '';
    if (invoice.claveAcceso) return invoice.claveAcceso;
    const seq = parseInt(invoice.invoiceNumber?.replace(/\D/g, '')?.slice(-9) || '1', 10) || 1;
    return generarClaveAcceso({
      fecha: new Date(invoice.issuedAt || Date.now()),
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
    if (!invoice) return 0;
    return invoice.subtotal15 && invoice.subtotal15 < invoice.total
      ? invoice.subtotal15
      : Number(((invoice.total || 0) / 1.15).toFixed(2));
  }, [facturaLines, invoice]);

  const tax15 = useMemo(() => {
    if (facturaLines.length > 0) {
      return Number(facturaLines.reduce((s, l) => s + l.iva, 0).toFixed(2));
    }
    if (!invoice) return 0;
    return invoice.tax && invoice.tax > 0
      ? invoice.tax
      : Number(((invoice.total || 0) - subtotal15).toFixed(2));
  }, [facturaLines, invoice, subtotal15]);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState<boolean>(false);

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

  const handleShareWhatsApp = () => {
    if (!invoice) return;

    const relatedOrder = orders?.find(
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-4 sm:my-8 max-h-[94vh] flex flex-col print:border-none print:shadow-none print:m-0 print:rounded-none print:max-h-none">
        {/* Top bar */}
        <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 py-3 flex items-center justify-between print:hidden shrink-0">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-xs sm:text-sm text-slate-900 font-mono">
              Factura #{invoice.invoiceNumber}
            </span>
            <Link
              href={`/factura/${invoice.invoiceNumber}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors"
              title="Abrir en portal web"
            >
              <span>Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              type="button"
              onClick={handleDownloadXml}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:scale-[0.97] text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/60 transition-all cursor-pointer"
              title="Descargar XML firmado SRI"
            >
              <Code className="w-3.5 h-3.5 text-slate-500" />
              <span>XML</span>
            </button>
            {showWhatsApp && (
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 active:scale-[0.97] border border-emerald-500/20 text-emerald-800 rounded-xl text-xs font-medium transition-all cursor-pointer"
                title="Compartir por WhatsApp"
              >
                <AppleWhatsAppIcon size={15} alt="WhatsApp" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:scale-[0.97] text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/60 transition-all cursor-pointer"
              title="Imprimir directamente"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1 px-3 sm:px-3.5 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.97] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-75"
              title="Descargar factura oficial en PDF"
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
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 rounded-xl transition-all ml-1 cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body: Official SRI RIDE (Exact match to /factura/[id]) */}
        <div className="p-3.5 sm:p-6 text-slate-800 bg-slate-100/60 overflow-y-auto print:overflow-visible max-h-[calc(90vh-80px)] flex justify-center">
          <div className="w-full max-w-3xl">
            <InvoiceRideDocument
              invoice={invoice}
              facturaLines={facturaLines}
              sriAuthNum={invoice.sriAuthorizationNumber}
              sriAuthDate={invoice.sriAuthorizationDate}
              claveAcceso={claveAcceso}
              subtotal15={subtotal15}
              totalIva15={tax15}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
