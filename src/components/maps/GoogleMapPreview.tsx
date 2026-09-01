'use client';

import React from 'react';
import { Navigation, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';

interface GoogleMapPreviewProps {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  isCalibrating?: boolean;
  zoom?: number;
  className?: string;
}

export function GoogleMapPreview({
  latitude,
  longitude,
  accuracy = null,
  isCalibrating = false,
  zoom = 17,
  className = 'h-48 w-full rounded-2xl overflow-hidden',
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
          {/* Live Automatic GPS Precision Badge */}
          {isCalibrating ? (
            <div className="bg-blue-600 text-white px-2.5 py-1 rounded-xl shadow-xs text-[10px] font-black flex items-center space-x-1 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Ajustando GPS...</span>
            </div>
          ) : accuracy !== null ? (
            <div
              className={`px-2.5 py-1 rounded-xl shadow-xs text-[10px] font-black flex items-center space-x-1 ${
                accuracy <= 20
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {accuracy <= 20 ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              <span>GPS ±{Math.round(accuracy)}m</span>
            </div>
          ) : null}

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
      <div className="absolute bottom-1.5 left-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-black px-2 py-0.5 rounded-md pointer-events-none flex items-center space-x-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Ajuste automático en tiempo real • Fijo</span>
      </div>
    </div>
  );
}
