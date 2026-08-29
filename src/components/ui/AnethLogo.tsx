import React from 'react';

interface AnethLogoProps {
  className?: string;
  variant?: 'light' | 'dark'; // 'light' for light backgrounds (navy text), 'dark' for dark backgrounds (white text)
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  subtitleText?: string;
}

/**
 * Official Isotipo "A" of Distribuidora Aneth
 */
export function AnethIsotype({
  className = '',
  variant = 'light',
  size = 'md',
}: {
  className?: string;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const mainColor = variant === 'light' ? '#0B132B' : '#FFFFFF';
  const blueAccent = '#1A62EA';

  const sizeMap = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-11 w-auto',
    xl: 'h-14 w-auto',
  };

  return (
    <svg
      viewBox="0 0 100 90"
      className={`${sizeMap[size]} ${className}`}
      style={{ maxHeight: size === 'sm' ? '24px' : size === 'md' ? '32px' : size === 'lg' ? '44px' : '56px' }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Right Leg & Apex */}
      <path
        d="M48 6L54 6C58 6 61 8 63 11L92 84H72L53 35L42 16L48 6Z"
        fill={mainColor}
      />
      {/* Left Leg & Crossbar Ribbon */}
      <path
        d="M44 14L28 42L8 84H28L36 67H64L60 56H31L44 14Z"
        fill={blueAccent}
      />
    </svg>
  );
}

/**
 * Complete Official Logotype of Distribuidora Aneth
 * Features the signature "ANETH" wordmark with the delivery truck transition.
 */
export function AnethFullLogo({
  className = '',
  variant = 'light',
  size = 'md',
  showSubtitle = true,
  subtitleText = 'DISTRIBUIDORA',
}: AnethLogoProps) {
  const textColor = variant === 'light' ? '#0B132B' : '#FFFFFF';
  const blueAccent = '#1A62EA';
  const subtitleColor = variant === 'light' ? '#64748B' : '#94A3B8';

  const heightStyles = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-12',
    xl: 'h-16',
  };

  const maxHeights = {
    sm: '28px',
    md: '36px',
    lg: '48px',
    xl: '64px',
  };

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <svg
        viewBox="0 0 420 90"
        className={`${heightStyles[size]} w-auto`}
        style={{ maxHeight: maxHeights[size] }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* --- LETTER A --- */}
        <g id="letter-A">
          <path
            d="M44 8L50 8C54 8 57 10 59 13L84 80H66L49 35L39 17L44 8Z"
            fill={textColor}
          />
          <path
            d="M40 15L26 42L8 80H26L33 64H59L55 54H28L40 15Z"
            fill={blueAccent}
          />
        </g>

        {/* --- LETTER N --- */}
        <g id="letter-N">
          <path
            d="M98 14H114L140 62V14H156V80H140L114 32V80H98V14Z"
            fill={textColor}
          />
        </g>

        {/* --- LETTER E --- */}
        <g id="letter-E">
          <path
            d="M172 14H222V28H188V40H218V54H188V66H224V80H172V14Z"
            fill={textColor}
          />
        </g>

        {/* --- LETTER T --- */}
        <g id="letter-T">
          <path
            d="M234 14H286V28H268V80H252V28H234V14Z"
            fill={textColor}
          />
        </g>

        {/* --- LETTER H --- */}
        <g id="letter-H">
          <path d="M298 14H314V80H298V14Z" fill={textColor} />
          <path d="M314 40H336V54H314V40Z" fill={textColor} />
          <path d="M336 14H352V80H336V14Z" fill={textColor} />
        </g>

        {/* --- TRUCK SILHOUETTE & SPEEDLINES --- */}
        <g id="delivery-truck">
          {/* Top speedline connecting H top to cab roof */}
          <path
            d="M336 17H382C386 17 390 19 392 23L404 42C406 45 407 48 407 52V67C407 70 405 72 402 72H398"
            stroke={blueAccent}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Middle speedline */}
          <path
            d="M352 47H384"
            stroke={blueAccent}
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Bottom chassis line from H bottom */}
          <path
            d="M336 77H374"
            stroke={blueAccent}
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Front Bumper */}
          <path
            d="M392 72H406"
            stroke={blueAccent}
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Truck Window */}
          <path
            d="M388 27H394C396 27 397 28 398 30L402 41H388V27Z"
            fill={blueAccent}
            opacity="0.85"
          />

          {/* Front Wheel */}
          <circle
            cx="384"
            cy="72"
            r="8.5"
            stroke={blueAccent}
            strokeWidth="3.5"
            fill={variant === 'light' ? '#FFFFFF' : '#0B132B'}
          />
          <circle cx="384" cy="72" r="3" fill={blueAccent} />
        </g>
      </svg>

      {/* Subtitle */}
      {showSubtitle && (
        <span
          className="text-[10px] sm:text-[11px] font-black tracking-[0.26em] uppercase -mt-0.5 pl-1 font-sans"
          style={{ color: subtitleColor }}
        >
          {subtitleText}
        </span>
      )}
    </div>
  );
}
