import React from 'react';

interface AppleIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  name:
    | 'dollarsign.gauge.chart.leftthird.topthird.rightthird'
    | 'shippingbox'
    | 'person.2'
    | 'creditcard'
    | 'calendar.badge.clock'
    | 'truck.box'
    | 'receipt'
    | 'qrcode'
    | 'square.stack.3d.up';
  size?: number | string;
  className?: string;
  alt?: string;
}

export const AppleIcon: React.FC<AppleIconProps> = ({
  name,
  size = 20,
  className = '',
  alt = '',
  style,
  ...props
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <img
      src={`/icons/${name}.svg`}
      alt={alt || name}
      className={`inline-block shrink-0 select-none object-contain ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        ...style,
      }}
      loading="eager"
      draggable={false}
      {...props}
    />
  );
};

// Convenience component wrappers that directly render the user's exact SVGs
export const AppleGaugeDollarIcon: React.FC<Omit<AppleIconProps, 'name'>> = (props) => (
  <AppleIcon name="dollarsign.gauge.chart.leftthird.topthird.rightthird" {...props} />
);

export const AppleShippingBoxIcon: React.FC<Omit<AppleIconProps, 'name'>> = (props) => (
  <AppleIcon name="shippingbox" {...props} />
);

export const ApplePersonsIcon: React.FC<Omit<AppleIconProps, 'name'>> = (props) => (
  <AppleIcon name="person.2" {...props} />
);

export const AppleCreditCardIcon: React.FC<Omit<AppleIconProps, 'name'>> = (props) => (
  <AppleIcon name="creditcard" {...props} />
);

export const AppleCalendarClockIcon: React.FC<Omit<AppleIconProps, 'name'>> = (props) => (
  <AppleIcon name="calendar.badge.clock" {...props} />
);

export const AppleTruckBoxIcon: React.FC<Omit<AppleIconProps, 'name'>> = (props) => (
  <AppleIcon name="truck.box" {...props} />
);

export const AppleReceiptIcon: React.FC<Omit<AppleIconProps, 'name'>> = (props) => (
  <AppleIcon name="receipt" {...props} />
);

export const AppleQrCodeIcon: React.FC<Omit<AppleIconProps, 'name'>> = (props) => (
  <AppleIcon name="qrcode" {...props} />
);

export const AppleSquareStackIcon: React.FC<Omit<AppleIconProps, 'name'>> = (props) => (
  <AppleIcon name="square.stack.3d.up" {...props} />
);
