'use client';

import React from 'react';
import { MapPin, Navigation, RefreshCw, ExternalLink } from 'lucide-react';

interface GoogleMapPreviewProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  className?: string;
  onRefreshGps?: () => void;
  isRefreshingGps?: boolean;
}

export function GoogleMapPreview({
  latitude,
  longitude,
  zoom = 17,
  className = 'h-48 w-full rounded-2xl overflow-hidden',
  onRefreshGps,
  isRefreshingGps = false,
}: GoogleMapPreviewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBxdOiBsT-hmDUzpwhLg8BSmjvgCof0uI0';

  // Crisp Retina Static Google Map with Red Location Pin
  const googleMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=600x320&scale=2&maptype=roadmap&markers=color:red%7C${latitude},${longitude}&key=${apiKey}&language=es`;

  const googleMapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <div className={`relative bg-slate-100 border border-slate-300 select-none ${className}`}>
      {/* Google Maps Render - Locked & Non-draggable */}
      <img
        src={googleMapUrl}
        alt={`Mapa Google en ${latitude}, ${longitude}`}
        className="w-full h-full object-cover pointer-events-none"
        loading="eager"
      />

      {/* Top Floating Badge with GPS Status */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-xl shadow-xs border border-slate-200/90 flex items-center space-x-1.5 text-[11px] font-bold text-slate-800">
          <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-mono text-[10px]">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          {onRefreshGps && (
            <button
              type="button"
              onClick={onRefreshGps}
              disabled={isRefreshingGps}
              className="bg-white hover:bg-slate-50 text-slate-800 px-2.5 py-1 rounded-xl shadow-xs border border-slate-200 text-[11px] font-bold flex items-center space-x-1 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
              title="Recalcular ubicación GPS precisa"
            >
              <RefreshCw className={`w-3 h-3 text-blue-600 ${isRefreshingGps ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">GPS Preciso</span>
            </button>
          )}

          <a
            href={googleMapsExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white hover:bg-slate-50 text-slate-700 p-1.5 rounded-xl shadow-xs border border-slate-200 transition-colors"
            title="Abrir en Google Maps oficial"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
          </a>
        </div>
      </div>

      {/* Bottom Subtle Tag */}
      <div className="absolute bottom-1.5 left-2.5 bg-slate-900/75 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md pointer-events-none">
        Ubicación fijada automáticamente por GPS
      </div>
    </div>
  );
}
