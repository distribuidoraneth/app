'use client';

import React from 'react';
import { Client } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import { AnethFullLogo } from '@/components/ui/AnethLogo';
import { X, Printer, Copy, Check, Store } from 'lucide-react';
import { AppleQrCodeIcon } from '@/components/ui/AppleIcons';

interface QRCodeModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeModal({ client, isOpen, onClose }: QRCodeModalProps) {
  const [copied, setCopied] = React.useState<boolean>(false);

  if (!isOpen || !client) return null;

  const clientPortalUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/p/${client.qrToken}`
      : `https://distribuidora-aneth.ec/p/${client.qrToken}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(clientPortalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        {/* Header bar (Light theme) */}
        <div className="print:hidden bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-900 flex items-center">
            <AppleQrCodeIcon size={16} className="mr-1.5" />
            Código QR de Pedidos
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div id="qr-printable-sticker" className="p-6 text-center space-y-4 bg-white">
          {/* Brand header */}
          <div className="flex flex-col items-center space-y-1">
            <AnethFullLogo size="md" className="items-center" showSubtitle={true} subtitleText="DISTRIBUIDORA" />
            <p className="text-xs text-slate-500 font-semibold pt-1">Pedidos Directos de Bebidas en Javas</p>
          </div>

          {/* QR Code Container */}
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-blue-200 inline-block shadow-2xs">
            <QRCodeSVG
              value={clientPortalUrl}
              size={180}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Client Details */}
          <div className="space-y-1">
            <div className="text-sm font-black text-slate-900 uppercase">
              {client.businessName || 'Local Registrado'}
            </div>
            <div className="text-xs text-slate-700 font-bold">{client.fullName}</div>
            <div className="text-[11px] font-mono text-slate-400">Token: {client.qrToken}</div>
          </div>

          <div className="text-xs text-slate-600 bg-blue-50 p-3 rounded-2xl border border-blue-100 font-medium">
            Escanee este código con su celular para hacer sus pedidos de javas y consultar sus facturas en cualquier momento.
          </div>
        </div>

        {/* Actions (hidden on print) */}
        <div className="print:hidden p-4 bg-slate-50 border-t border-slate-200 flex items-center space-x-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-colors shadow-2xs active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Enlace Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Copiar Enlace</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-colors shadow-xs active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir QR</span>
          </button>
        </div>
      </div>
    </div>
  );
}
