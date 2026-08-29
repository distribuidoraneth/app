'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, X, Copy, Check, Wifi } from 'lucide-react';

export function MobileTestQRModal({
  isOpen,
  onClose,
  targetUrl = 'http://192.168.100.32:3000/p/aneth-carlos-mendoza-01',
}: {
  isOpen: boolean;
  onClose: () => void;
  targetUrl?: string;
}) {
  const [copied, setCopied] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-center animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Subtitle */}
        <div className="space-y-1.5 pt-1">
          <div className="inline-flex items-center space-x-1.5 text-blue-700 bg-blue-50 px-3 py-1 rounded-full text-xs font-black">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>Probar en tu Celular</span>
          </div>
          <h3 className="text-base font-black text-slate-900 leading-tight">
            Escanea con la cámara de tu móvil
          </h3>
        </div>

        {/* Full Visible QR Code Container */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-blue-200 inline-flex items-center justify-center shadow-inner">
          <QRCodeSVG
            value={targetUrl}
            size={160}
            level="M"
            includeMargin={true}
          />
        </div>

        {/* Instructions & Link */}
        <div className="space-y-2.5 text-xs">
          <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100 text-slate-700 flex items-start space-x-2 text-left text-xs">
            <Wifi className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>
              Conecta tu celular al <strong>mismo Wi-Fi</strong> que tu computadora para abrir el portal local.
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex-1 font-mono text-xs text-slate-700 bg-slate-100 p-2.5 rounded-xl border border-slate-200 truncate text-left font-medium">
              {targetUrl}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black flex items-center space-x-1 transition-all flex-shrink-0 shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export function MobileTestButton() {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all active:scale-95 shadow-2xs"
        title="Abrir en celular mediante código QR"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Abrir en Celular</span>
      </button>

      <MobileTestQRModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
