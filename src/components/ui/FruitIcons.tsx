import React from 'react';

interface FruitIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

/**
 * Premium, harmonious vector fruit illustrations inspired by world-class emoji design systems
 * (Apple / Fluent / Noto). Featuring organic curves, multi-stop radial gradients,
 * volumetric lighting, and fine specular reflections.
 */

// 1. PIÑA (Pineapple)
export function PineappleIcon({ className = 'w-7 h-7', size = 32, ...props }: FruitIconProps) {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Crown Foliage Gradients */}
        <linearGradient id={`pa-leaf-top-${id}`} x1="18" y1="1" x2="18" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id={`pa-leaf-l-${id}`} x1="8" y1="4" x2="18" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id={`pa-leaf-r-${id}`} x1="28" y1="4" x2="18" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
        {/* Pineapple Body Volumetric Radial Gradient */}
        <radialGradient id={`pa-body-${id}`} cx="38%" cy="35%" r="62%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="25%" stopColor="#FBBF24" />
          <stop offset="65%" stopColor="#F59E0B" />
          <stop offset="90%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </radialGradient>
      </defs>

      {/* --- CROWN LEAVES (Layered for depth) --- */}
      {/* Back Leaves */}
      <path d="M18 1.5C18 1.5 14 6 12 11C14 10 16.5 9.5 18 9.5C19.5 9.5 22 10 24 11C22 6 18 1.5 18 1.5Z" fill={`url(#pa-leaf-top-${id})`} />
      {/* Side Leaves Left */}
      <path d="M18 5C14 8 8 9 4.5 14C8.5 13 13 12.5 16 13.5C14.5 10 16 7 18 5Z" fill={`url(#pa-leaf-l-${id})`} />
      {/* Side Leaves Right */}
      <path d="M18 5C22 8 28 9 31.5 14C27.5 13 23 12.5 20 13.5C21.5 10 20 7 18 5Z" fill={`url(#pa-leaf-r-${id})`} />
      {/* Center Front Leaf */}
      <path d="M18 4C16.5 7.5 15 11 14 15C16.5 14 19.5 14 22 15C21 11 19.5 7.5 18 4Z" fill="#10B981" />

      {/* --- PINEAPPLE BODY --- */}
      {/* Volumetric Oval Base */}
      <path
        d="M18 11.5C10.5 11.5 8 16 8 23C8 29.5 11.5 34.5 18 34.5C24.5 34.5 28 29.5 28 23C28 16 25.5 11.5 18 11.5Z"
        fill={`url(#pa-body-${id})`}
      />

      {/* Elegant Pineapple Diamond Lattice Pattern */}
      <g stroke="#92400E" strokeWidth="1" strokeLinecap="round" opacity="0.45">
        <path d="M10 19C14 24 22 28 26 31" />
        <path d="M9 24C13 28 19 32 24 33.5" />
        <path d="M13 14C17 19 24 23 27 26" />
        
        <path d="M26 19C22 24 14 28 10 31" />
        <path d="M27 24C23 28 17 32 12 33.5" />
        <path d="M23 14C19 19 12 23 9 26" />
      </g>

      {/* Center Diamond Scale Accents */}
      <g fill="#78350F" opacity="0.5">
        <circle cx="18" cy="17.5" r="0.9" />
        <circle cx="13.5" cy="21" r="0.9" />
        <circle cx="22.5" cy="21" r="0.9" />
        <circle cx="18" cy="24.5" r="0.9" />
        <circle cx="13.5" cy="28" r="0.8" />
        <circle cx="22.5" cy="28" r="0.8" />
        <circle cx="18" cy="31" r="0.8" />
      </g>

      {/* Soft Top-Left Volumetric Highlight */}
      <path
        d="M13 14C10.5 16 9.5 19 9.5 22.5C9.5 20 10.5 17 12.5 15C14.5 13 17 12.5 19 12.5C16.5 12.5 14.5 13 13 14Z"
        fill="#FFFFFF"
        opacity="0.45"
      />
    </svg>
  );
}

// 2. MORA (Blackberry)
export function MoraIcon({ className = 'w-7 h-7', size = 32, ...props }: FruitIconProps) {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Plump Drupelet Multi-stop Radial Gradient */}
        <radialGradient id={`mora-drupe-${id}`} cx="32%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#E9D5FF" />
          <stop offset="25%" stopColor="#C084FC" />
          <stop offset="60%" stopColor="#9333EA" />
          <stop offset="85%" stopColor="#6B21A8" />
          <stop offset="100%" stopColor="#3B0764" />
        </radialGradient>
        {/* Leaf Linear Gradient */}
        <linearGradient id={`mora-leaf-grad-${id}`} x1="12" y1="2" x2="24" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Stem & Calyx Leaves */}
      <path d="M18 2C18 3.5 17.5 5 18 6.5" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M18 6C14.5 4 11 4.5 9 6C11.5 7.5 14.5 7.5 18 6.5C21.5 7.5 24.5 7.5 27 6C25 4.5 21.5 4 18 6Z"
        fill={`url(#mora-leaf-grad-${id})`}
      />

      {/* Drupelets Cluster (Volumetric Juicy Spheres) */}
      {/* Row 1 (Top) */}
      <circle cx="18" cy="9.5" r="3.6" fill={`url(#mora-drupe-${id})`} />
      <circle cx="13" cy="11.5" r="3.5" fill={`url(#mora-drupe-${id})`} />
      <circle cx="23" cy="11.5" r="3.5" fill={`url(#mora-drupe-${id})`} />

      {/* Row 2 (Upper Middle) */}
      <circle cx="18" cy="14.5" r="4.0" fill={`url(#mora-drupe-${id})`} />
      <circle cx="10" cy="16" r="3.6" fill={`url(#mora-drupe-${id})`} />
      <circle cx="26" cy="16" r="3.6" fill={`url(#mora-drupe-${id})`} />

      {/* Row 3 (Center) */}
      <circle cx="14" cy="19.5" r="4.0" fill={`url(#mora-drupe-${id})`} />
      <circle cx="22" cy="19.5" r="4.0" fill={`url(#mora-drupe-${id})`} />
      <circle cx="9" cy="21.5" r="3.4" fill={`url(#mora-drupe-${id})`} />
      <circle cx="27" cy="21.5" r="3.4" fill={`url(#mora-drupe-${id})`} />

      {/* Row 4 (Lower Middle) */}
      <circle cx="18" cy="24" r="4.0" fill={`url(#mora-drupe-${id})`} />
      <circle cx="13" cy="26.5" r="3.6" fill={`url(#mora-drupe-${id})`} />
      <circle cx="23" cy="26.5" r="3.6" fill={`url(#mora-drupe-${id})`} />

      {/* Row 5 (Bottom Apex) */}
      <circle cx="18" cy="30.5" r="3.2" fill={`url(#mora-drupe-${id})`} />

      {/* Specular Micro-Highlights */}
      <circle cx="17.2" cy="8.7" r="0.9" fill="#FFFFFF" opacity="0.8" />
      <circle cx="12.2" cy="10.7" r="0.9" fill="#FFFFFF" opacity="0.8" />
      <circle cx="22.2" cy="10.7" r="0.9" fill="#FFFFFF" opacity="0.8" />
      <circle cx="17" cy="13.5" r="1.1" fill="#FFFFFF" opacity="0.85" />
      <circle cx="13" cy="18.5" r="1.1" fill="#FFFFFF" opacity="0.85" />
      <circle cx="21" cy="18.5" r="1.1" fill="#FFFFFF" opacity="0.85" />
      <circle cx="17" cy="23" r="1.1" fill="#FFFFFF" opacity="0.85" />
      <circle cx="17.2" cy="29.7" r="0.8" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
}

// 3. TAMARINDO (Tamarind Pod)
export function TamarindoIcon({ className = 'w-7 h-7', size = 32, ...props }: FruitIconProps) {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id={`tam-pod-${id}`} x1="6" y1="8" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="30%" stopColor="#D97706" />
          <stop offset="65%" stopColor="#B45309" />
          <stop offset="90%" stopColor="#92400E" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <radialGradient id={`tam-node-1-${id}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </radialGradient>
        <radialGradient id={`tam-node-2-${id}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </radialGradient>
      </defs>

      {/* Woody Stem */}
      <path d="M4 6C7 8 10 9.5 13 11" stroke="#582900" strokeWidth="2.4" strokeLinecap="round" />

      {/* Main Curved Pod Silhouette */}
      <path
        d="M10 10.5C13.5 11 18 13 22 16.5C26.5 20.5 29.5 25.5 28 29.5C26 33 21 32 17.5 29C13.5 25.5 10.5 20.5 9 16C7.5 12.5 8 10.5 10 10.5Z"
        fill={`url(#tam-pod-${id})`}
      />

      {/* Segment Nodes */}
      <ellipse cx="11.5" cy="13" rx="3.6" ry="4" fill={`url(#tam-node-1-${id})`} opacity="0.9" />
      <ellipse cx="16.5" cy="18" rx="4.4" ry="4.8" fill={`url(#tam-node-2-${id})`} opacity="0.9" />
      <ellipse cx="22.5" cy="23.5" rx="5" ry="5.2" fill={`url(#tam-node-2-${id})`} opacity="0.9" />
      <circle cx="26" cy="29" r="3.6" fill="#78350F" />

      {/* Glossy Curved Rim Highlight */}
      <path
        d="M11 11.5C14.5 12.5 18.5 15 22 18.5C25.5 22 27.5 26 27 28.5"
        stroke="#FEF3C7"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
}

// 4. MANDARINA (Tangerine / Orange)
export function MandarinaIcon({ className = 'w-7 h-7', size = 32, ...props }: FruitIconProps) {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Volumetric Citrus Radial Gradient */}
        <radialGradient id={`mand-body-${id}`} cx="35%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="30%" stopColor="#FB923C" />
          <stop offset="70%" stopColor="#F97316" />
          <stop offset="90%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#C2410C" />
        </radialGradient>
        {/* Fresh Leaf Gradient */}
        <linearGradient id={`mand-leaf-${id}`} x1="16" y1="2" x2="28" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="50%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
      </defs>

      {/* Stem */}
      <path d="M18 3.5V8" stroke="#78350F" strokeWidth="2.2" strokeLinecap="round" />

      {/* Botanical Leaf */}
      <path
        d="M18 6.5C18 6.5 24 5 28 8.5C28 12.5 23 14 18 10V6.5Z"
        fill={`url(#mand-leaf-${id})`}
      />
      <path d="M19 8C22 8.5 25 10 26.5 11" stroke="#BBF7D0" strokeWidth="0.9" strokeLinecap="round" />

      {/* Main Mandarin Spherical Body (Slightly squashed citrus) */}
      <ellipse cx="18" cy="21" rx="14.5" ry="13.2" fill={`url(#mand-body-${id})`} />

      {/* Subtle Top Dimple Accent */}
      <ellipse cx="18" cy="9.5" rx="2.5" ry="1.2" fill="#C2410C" opacity="0.4" />

      {/* Soft Specular Volumetric Glow */}
      <ellipse cx="13.5" cy="16" rx="4.5" ry="3" fill="#FFFFFF" opacity="0.45" transform="rotate(-15 13.5 16)" />
    </svg>
  );
}

// 5. UVA (Grape Cluster)
export function UvaIcon({ className = 'w-7 h-7', size = 32, ...props }: FruitIconProps) {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Translucent Grape Radial Gradient */}
        <radialGradient id={`grape-sphere-${id}`} cx="33%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#E0E7FF" />
          <stop offset="30%" stopColor="#818CF8" />
          <stop offset="65%" stopColor="#6366F1" />
          <stop offset="90%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#312E81" />
        </radialGradient>
        <linearGradient id={`grape-leaf-${id}`} x1="8" y1="2" x2="24" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
      </defs>

      {/* Vine Curl & Stem */}
      <path d="M18 2V7" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 4C21 2.5 24 3 25 5C26 7 24 8.5 21 8" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Grape Leaf */}
      <path d="M18 5.5C14 3.5 9 5 8 7.5C10 9 14 9 18 7V5.5Z" fill={`url(#grape-leaf-${id})`} />

      {/* Layered Grape Spheres */}
      {/* Top Row */}
      <circle cx="13" cy="11.5" r="4.2" fill={`url(#grape-sphere-${id})`} />
      <circle cx="23" cy="11.5" r="4.2" fill={`url(#grape-sphere-${id})`} />
      <circle cx="18" cy="13.5" r="4.5" fill={`url(#grape-sphere-${id})`} />

      {/* Middle Row */}
      <circle cx="10" cy="18" r="4.0" fill={`url(#grape-sphere-${id})`} />
      <circle cx="26" cy="18" r="4.0" fill={`url(#grape-sphere-${id})`} />
      <circle cx="14.5" cy="20.5" r="4.4" fill={`url(#grape-sphere-${id})`} />
      <circle cx="21.5" cy="20.5" r="4.4" fill={`url(#grape-sphere-${id})`} />

      {/* Lower Row */}
      <circle cx="18" cy="26" r="4.2" fill={`url(#grape-sphere-${id})`} />
      <circle cx="18" cy="31" r="3.2" fill={`url(#grape-sphere-${id})`} />

      {/* Specular Highlights */}
      <circle cx="11.8" cy="10.2" r="1.1" fill="#FFFFFF" opacity="0.8" />
      <circle cx="21.8" cy="10.2" r="1.1" fill="#FFFFFF" opacity="0.8" />
      <circle cx="16.5" cy="12.2" r="1.2" fill="#FFFFFF" opacity="0.85" />
      <circle cx="13" cy="19.2" r="1.2" fill="#FFFFFF" opacity="0.85" />
      <circle cx="20" cy="19.2" r="1.2" fill="#FFFFFF" opacity="0.85" />
      <circle cx="16.8" cy="24.8" r="1.1" fill="#FFFFFF" opacity="0.8" />
      <circle cx="17" cy="30" r="0.8" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
}

// 6. MANZANA (Apple)
export function AppleIcon({ className = 'w-7 h-7', size = 32, ...props }: FruitIconProps) {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <radialGradient id={`apple-body-${id}`} cx="35%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#FECACA" />
          <stop offset="25%" stopColor="#F87171" />
          <stop offset="65%" stopColor="#EF4444" />
          <stop offset="90%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#991B1B" />
        </radialGradient>
      </defs>

      {/* Stem */}
      <path d="M18 3.5C18 6.5 19.5 9 21 10" stroke="#78350F" strokeWidth="2.2" strokeLinecap="round" />
      {/* Leaf */}
      <path d="M20 6C24 4 27.5 6 27 8.5C24 9 21.5 8 20 6Z" fill="#16A34A" />

      {/* Apple Heart / Dimpled Shape */}
      <path
        d="M18 11.5C15 9.5 10 9.5 6.5 13C2.5 17 3.5 24.5 8 29.5C11.5 33.5 15.5 33 18 31C20.5 33 24.5 33.5 28 29.5C32.5 24.5 33.5 17 29.5 13C26 9.5 21 9.5 18 11.5Z"
        fill={`url(#apple-body-${id})`}
      />

      {/* Glossy Curve */}
      <path
        d="M8.5 15C6.5 18.5 7 23.5 9.5 26.5"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

// 7. LIMÓN (Lemon)
export function LimonIcon({ className = 'w-7 h-7', size = 32, ...props }: FruitIconProps) {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <radialGradient id={`lemon-grad-${id}`} cx="35%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="30%" stopColor="#FDE047" />
          <stop offset="70%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </radialGradient>
      </defs>

      {/* Lemon Silhouette with pointed tip */}
      <path
        d="M30 6C30 6 25.5 5 19 8.5C12.5 12 7 19.5 6 25C5 30.5 9.5 31 13 30C19.5 28 27 22.5 29.5 16C31.5 10.5 30 6 30 6Z"
        fill={`url(#lemon-grad-${id})`}
      />
      {/* Stem Leaf */}
      <path d="M29 6C31 4 33.5 4.5 33.5 4.5" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
      {/* Reflection */}
      <path
        d="M10 22C13 17 19 12 24 10"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

// 8. DURAZNO (Peach)
export function DuraznoIcon({ className = 'w-7 h-7', size = 32, ...props }: FruitIconProps) {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <radialGradient id={`peach-grad-${id}`} cx="35%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#FFE4E6" />
          <stop offset="30%" stopColor="#FDA4AF" />
          <stop offset="65%" stopColor="#FB7185" />
          <stop offset="90%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#BE123C" />
        </radialGradient>
      </defs>

      {/* Stem & Leaf */}
      <path d="M18 4C18 7 20 9 22 9.5" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 7C25.5 5 29 7.5 29 9.5C25.5 10.5 22.5 9.5 21 7Z" fill="#16A34A" />

      {/* Velvet Peach Body */}
      <path
        d="M18 11.5C14.5 8.5 8.5 9.5 6 14.5C3 20.5 6.5 27.5 11 31C15 34 18 31.5 18 31.5C18 31.5 21 34 25 31C29.5 27.5 33 20.5 30 14.5C27.5 9.5 21.5 8.5 18 11.5Z"
        fill={`url(#peach-grad-${id})`}
      />

      {/* Characteristic Peach Cleft */}
      <path d="M18 12C16.5 17 16.5 24 18 29.5" stroke="#9F1239" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

// 9. AGUA SIN GAS (Natural Water Droplet)
export function WaterNaturalIcon({ className = 'w-7 h-7', size = 32, ...props }: FruitIconProps) {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <radialGradient id={`water-nat-${id}`} cx="35%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="25%" stopColor="#7DD3FC" />
          <stop offset="65%" stopColor="#38BDF8" />
          <stop offset="90%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0369A1" />
        </radialGradient>
      </defs>

      <path
        d="M18 3.5C18 3.5 8 15.5 8 22.5C8 28 12.5 32.5 18 32.5C23.5 32.5 28 28 28 22.5C28 15.5 18 3.5 18 3.5Z"
        fill={`url(#water-nat-${id})`}
      />
      {/* Water Refraction Glow */}
      <path
        d="M13 18C12 21 13 25 15.5 27.5"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}

// 10. AGUA CON GAS (Sparkling Water Droplet)
export function WaterSparklingIcon({ className = 'w-7 h-7', size = 32, ...props }: FruitIconProps) {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <radialGradient id={`water-spark-${id}`} cx="35%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#CCFBF1" />
          <stop offset="30%" stopColor="#5EEAD4" />
          <stop offset="70%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0F766E" />
        </radialGradient>
      </defs>

      <path
        d="M18 3.5C18 3.5 8 15.5 8 22.5C8 28 12.5 32.5 18 32.5C23.5 32.5 28 28 28 22.5C28 15.5 18 3.5 18 3.5Z"
        fill={`url(#water-spark-${id})`}
      />
      {/* Sparkling Fizzy Bubbles */}
      <circle cx="15.5" cy="19" r="2.2" fill="#FFFFFF" opacity="0.9" />
      <circle cx="20.5" cy="15.5" r="1.5" fill="#FFFFFF" opacity="0.9" />
      <circle cx="20" cy="25" r="2.6" fill="#FFFFFF" opacity="0.8" />
      <circle cx="13" cy="26" r="1.6" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
}

// 11. TÉ DE LIMÓN (Tea Leaf + Lemon Wedge)
export function TeaLemonIcon({ className = 'w-7 h-7', size = 32, ...props }: FruitIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Botanical Tea Leaf */}
      <path
        d="M11 31C11 31 7.5 21.5 13.5 12.5C19.5 3.5 31 5 31 5C31 5 31 17 24 24C18 30 11 31 11 31Z"
        fill="#15803D"
      />
      <path
        d="M12 29C12 29 9 20.5 14.5 12.8C20 5 29 6.5 29 6.5C29 6.5 29 17 23 23C17.5 28 12 29 12 29Z"
        fill="#22C55E"
      />
      <path d="M13 27C17.5 20.5 22 13.5 27 9" stroke="#86EFAC" strokeWidth="1.4" strokeLinecap="round" />
      {/* Citrus Lemon Wedge */}
      <circle cx="10" cy="24" r="7" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.4" />
      <path d="M10 18.5V29.5M4.5 24H15.5" stroke="#FEF08A" strokeWidth="1" />
    </svg>
  );
}

// 12. FLOR DE JAMAICA (Tea Leaf + Hibiscus Flower)
export function HibiscusTeaIcon({ className = 'w-7 h-7', size = 32, ...props }: FruitIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Botanical Tea Leaf */}
      <path
        d="M11 31C11 31 7.5 21.5 13.5 12.5C19.5 3.5 31 5 31 5C31 5 31 17 24 24C18 30 11 31 11 31Z"
        fill="#15803D"
      />
      <path
        d="M12 29C12 29 9 20.5 14.5 12.8C20 5 29 6.5 29 6.5C29 6.5 29 17 23 23C17.5 28 12 29 12 29Z"
        fill="#22C55E"
      />
      <path d="M13 27C17.5 20.5 22 13.5 27 9" stroke="#86EFAC" strokeWidth="1.4" strokeLinecap="round" />
      {/* Hibiscus Calyx Accent */}
      <circle cx="10" cy="24" r="6.5" fill="#E11D48" stroke="#9F1239" strokeWidth="1.4" />
      <path d="M10 18.5V29.5M4.5 24H15.5" stroke="#FDA4AF" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

// Helper mapper to get corresponding Vector Icon by flavor name
export function getFlavorVectorIcon(flavor: string, className = 'w-7 h-7') {
  const norm = flavor.toLowerCase().trim();

  if (norm.includes('piña') || norm.includes('pina')) {
    return <PineappleIcon className={className} />;
  }
  if (norm.includes('mora')) {
    return <MoraIcon className={className} />;
  }
  if (norm.includes('tamarindo')) {
    return <TamarindoIcon className={className} />;
  }
  if (norm.includes('mandarina') || norm.includes('naranja')) {
    return <MandarinaIcon className={className} />;
  }
  if (norm.includes('uva')) {
    return <UvaIcon className={className} />;
  }
  if (norm.includes('manzana')) {
    return <AppleIcon className={className} />;
  }
  if (norm.includes('limón') || norm.includes('limon')) {
    return <LimonIcon className={className} />;
  }
  if (norm.includes('té limón') || norm.includes('te limon') || norm.includes('lima limón') || norm.includes('lima limon')) {
    return <TeaLemonIcon className={className} />;
  }
  if (norm.includes('jamaica') || norm.includes('flor de jamaica')) {
    return <HibiscusTeaIcon className={className} />;
  }

  // Si no existe el sabor, retornar null (en blanco)
  return null;
}

export function FruitVectorIcon({
  flavor,
  size = 32,
  className = '',
}: {
  flavor: string;
  size?: number;
  className?: string;
}) {
  return getFlavorVectorIcon(flavor, className);
}
