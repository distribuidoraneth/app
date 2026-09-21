'use client';

import React, { useState } from 'react';
import { Client } from '@/types';
import { PoplQRCodeSVG } from '@/components/ui/PoplQRCodeSVG';
import { AnethFullLogo } from '@/components/ui/AnethLogo';
import { X, Copy, Check, Download } from 'lucide-react';
import { AppleQrCodeIcon } from '@/components/ui/AppleIcons';

interface QRCodeModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeModal({ client, isOpen, onClose }: QRCodeModalProps) {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !client) return null;

  const clientPortalUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/p/${client.qrToken}`
      : `https://distribuidora-aneth.vercel.app/p/${client.qrToken}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(clientPortalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const safeClientSlug = (client.businessName || client.fullName || 'cliente')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_');

  // Descarga directa en formato vectorial puro SVG
  const handleDownloadSvg = () => {
    const svgEl = document.getElementById('client-popl-qr-svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr_${safeClientSlug}_aneth.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Descarga directa en alta resolución PNG (2048x2048 píxeles)
  const handleDownloadPng = () => {
    const svgEl = document.getElementById('client-popl-qr-svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 2048;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `qr_${safeClientSlug}_aneth.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 animate-in zoom-in-95 duration-150">
        {/* Header bar estilo Apple */}
        <div className="bg-slate-50/90 border-b border-slate-200/80 px-5 py-3.5 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-900 flex items-center">
            <AppleQrCodeIcon size={16} className="mr-1.5 text-blue-600" />
            Código QR de Pedidos
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card Content */}
        <div className="p-6 text-center space-y-4 bg-white">
          {/* Brand header */}
          <div className="flex flex-col items-center space-y-1">
            <AnethFullLogo size="md" className="items-center" showSubtitle={true} subtitleText="DISTRIBUCIONES" />
            <p className="text-xs text-slate-500 font-semibold pt-0.5">Pedidos Directos de Bebidas en Javas</p>
          </div>

          {/* QR Code Container estilo Popl con Isotipo 'A' en silueta pura */}
          <div className="p-2 sm:p-3 bg-slate-50 rounded-2xl border border-slate-200/70 inline-block shadow-xs">
            <PoplQRCodeSVG
              id="client-popl-qr-svg"
              value={clientPortalUrl}
              size={200}
              showIsotypeLogo={true}
              color="#0f172a"
              bgColor="#ffffff"
              className="mx-auto rounded-xl"
            />
          </div>

          {/* Client Details */}
          <div className="space-y-0.5">
            <div className="text-sm font-black text-slate-900 uppercase tracking-tight">
              {client.businessName || 'Local Registrado'}
            </div>
            {client.businessName && client.businessName.trim().toLowerCase() !== client.fullName.trim().toLowerCase() && (
              <div className="text-xs text-slate-600 font-medium">{client.fullName}</div>
            )}
            <div className="text-[11px] font-mono text-slate-400 pt-0.5">Token: {client.qrToken}</div>
          </div>

          <div className="text-xs text-slate-600 bg-blue-50/80 p-3 rounded-2xl border border-blue-100/80 font-medium leading-tight">
            Escanee este código con su celular para hacer sus pedidos de javas y consultar sus facturas en cualquier momento.
          </div>
        </div>

        {/* Botones de acción sencillos: Copiar Enlace, SVG y PNG */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200/80 grid grid-cols-[1fr_auto_auto] gap-2">
          {/* Copiar Enlace */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300/80 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Copiar Enlace</span>
              </>
            )}
          </button>

          {/* Botón SVG */}
          <button
            type="button"
            onClick={handleDownloadSvg}
            title="Descargar código QR en formato vectorial SVG"
            className="py-2.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>SVG</span>
          </button>

          {/* Botón PNG */}
          <button
            type="button"
            onClick={handleDownloadPng}
            title="Descargar código QR en alta resolución PNG (2048x2048)"
            className="py-2.5 px-3.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
