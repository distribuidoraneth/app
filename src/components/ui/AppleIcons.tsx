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
    | 'square.stack.3d.up'
    | 'mappin.and.ellipse'
    | 'whatsapp'
    | 'checkmark.seal';
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

export const AppleMapPinIcon: React.FC<Omit<AppleIconProps, 'name'>> = (props) => (
  <AppleIcon name="mappin.and.ellipse" {...props} />
);

export const AppleWhatsAppIcon: React.FC<Omit<AppleIconProps, 'name'>> = (props) => (
  <AppleIcon name="whatsapp" {...props} />
);

export const AppleCheckmarkSealIcon: React.FC<{
  size?: number | string;
  className?: string;
  color?: string;
  alt?: string;
}> = ({ size = 14, className = '', color = 'currentColor', alt = 'Entregado' }) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  return (
    <svg
      viewBox="0 0 22.1712 22.2697"
      fill={color}
      className={`inline-block shrink-0 select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      aria-label={alt}
      role="img"
    >
      <path d="M5.17209 19.5586L7.29185 19.5586C7.48932 19.5586 7.63272 19.6106 7.77823 19.7561L9.28701 21.2524C10.5194 22.4931 11.6518 22.4827 12.8842 21.2524L14.393 19.7561C14.5385 19.6106 14.6819 19.5586 14.8897 19.5586L16.9991 19.5586C18.7378 19.5586 19.5508 18.7539 19.5508 17.007L19.5508 14.8872C19.5508 14.6897 19.6152 14.5463 19.7586 14.3987L21.2446 12.892C22.4853 11.6596 22.4749 10.5273 21.2446 9.28238L19.7586 7.78607C19.6152 7.64056 19.5508 7.4868 19.5508 7.28723L19.5508 5.17993C19.5508 3.44122 18.7482 2.61578 16.9991 2.61578L14.8897 2.61578C14.6819 2.61578 14.5385 2.56382 14.393 2.41831L12.8842 0.93446C11.6497-0.310431 10.5194-0.312542 9.2849 0.93446L7.77823 2.41831C7.63483 2.56171 7.48932 2.61578 7.29185 2.61578L5.17209 2.61578C3.42303 2.61578 2.62041 3.42052 2.62041 5.17993L2.62041 7.28723C2.62041 7.4868 2.56634 7.64056 2.42294 7.78607L0.926626 9.28238C-0.314045 10.5273-0.303695 11.6596 0.926626 12.892L2.42294 14.3987C2.56634 14.5463 2.62041 14.6897 2.62041 14.8872L2.62041 17.007C2.62041 18.7457 3.42303 19.5586 5.17209 19.5586ZM5.17209 18.0087C4.30787 18.0087 4.1704 17.8712 4.1704 17.007L4.1704 14.3752C4.1704 14.0742 4.07493 13.848 3.86942 13.6425L2.01867 11.8C1.40578 11.1789 1.40578 11.0059 2.01867 10.3744L3.86942 8.54438C4.07493 8.32852 4.1704 8.10021 4.1704 7.80959L4.1704 5.17993C4.1704 4.29078 4.29541 4.17612 5.17209 4.17612L7.80175 4.17612C8.10272 4.17612 8.33104 4.091 8.53655 3.8648L10.3769 2.0244C10.9981 1.40326 11.1731 1.40326 11.7943 2.0244L13.6347 3.8648C13.8505 4.091 14.0788 4.17612 14.3695 4.17612L16.9991 4.17612C17.8634 4.17612 18.0029 4.30324 18.0029 5.17993L18.0029 7.80959C18.0029 8.10021 18.0984 8.32852 18.3121 8.54438L20.1547 10.3744C20.7758 11.0059 20.7758 11.1789 20.1547 11.8L18.3121 13.6425C18.0984 13.848 18.0029 14.0742 18.0029 14.3752L18.0029 17.007C18.0029 17.8712 17.8634 18.0087 16.9991 18.0087L14.3695 18.0087C14.0788 18.0087 13.8505 18.0938 13.6347 18.3096L11.7943 20.1604C11.1731 20.7712 10.9981 20.7712 10.3769 20.1604L8.53655 18.3096C8.33104 18.0938 8.10272 18.0087 7.80175 18.0087Z" />
      <path d="M10.0265 15.7206C10.3518 15.7206 10.6233 15.5672 10.8119 15.2668L15.2818 8.24543C15.3874 8.05278 15.5159 7.83311 15.5159 7.61765C15.5159 7.18463 15.1243 6.90476 14.7202 6.90476C14.4694 6.90476 14.2166 7.04987 14.0404 7.342L9.98302 13.843L8.06083 11.3501C7.83291 11.0373 7.61535 10.9585 7.35005 10.9585C6.91703 10.9585 6.59575 11.2962 6.59575 11.7335C6.59575 11.9428 6.67454 12.1521 6.81754 12.3407L9.18943 15.2668C9.44016 15.59 9.69702 15.7206 10.0265 15.7206Z" />
    </svg>
  );
};

export const ApplePencilIcon: React.FC<{
  size?: number | string;
  className?: string;
  color?: string;
  alt?: string;
}> = ({ size = 16, className = '', color = 'currentColor', alt = 'Editar' }) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  return (
    <svg
      viewBox="0 0 15.565 15.5151"
      fill={color}
      className={`inline-block shrink-0 select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      aria-label={alt}
      role="img"
    >
      <path d="M2.66635 14.6291L13.3202 3.98772L11.6073 2.27473L0.955475 12.9119L0.0289453 15.0851C-0.0665218 15.3132 0.174056 15.5827 0.420764 15.4997ZM14.1792 3.15152L15.1627 2.18057C15.6689 1.67641 15.7 1.1433 15.2414 0.695104L14.9163 0.370011C14.4724-0.0843128 13.9372-0.0365793 13.4351 0.455127L12.4456 1.42397Z" />
    </svg>
  );
};

export const ApplePhoneIcon: React.FC<{
  size?: number | string;
  className?: string;
  color?: string;
  alt?: string;
}> = ({ size = 16, className = '', color = 'currentColor', alt = 'Llamar' }) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  return (
    <svg
      viewBox="0 0 19.0719 19.0642"
      fill={color}
      className={`inline-block shrink-0 select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      aria-label={alt}
      role="img"
    >
      <path d="M14.1829 19.0618C15.874 19.0618 17.004 18.6113 17.9842 17.4987C18.0587 17.422 18.1333 17.3371 18.21 17.25C18.7956 16.6044 19.0719 15.967 19.0719 15.3566C19.0719 14.6678 18.6613 13.979 17.7942 13.3817L15.3483 11.7102C14.5991 11.1894 13.9575 11.1643 13.0237 11.6146L11.5033 12.3519C11.2205 12.4974 10.9607 12.4974 10.6841 12.3124C10.2541 12.0404 9.16885 11.1712 8.43245 10.4285C7.69183 9.68152 6.96719 8.7968 6.64973 8.23646C6.52703 8.01387 6.53739 7.83098 6.71184 7.56719L7.58641 6.18573C7.97059 5.58761 8.08847 4.75985 7.59063 4.05249L5.65939 1.27581C5.06207 0.40877 4.40224 0.0106213 3.70523 0.000270593C3.09695-0.0100801 2.45742 0.276521 1.81176 0.860075C1.72474 0.9264 1.64806 1.00308 1.56315 1.07975C0.462965 2.06396 8.88178e-16 3.18565 8.88178e-16 4.87049C8.88178e-16 7.66958 1.72634 11.0767 4.86298 14.2092C7.97471 17.3188 11.3838 19.0618 14.1829 19.0618ZM14.1932 17.5843C11.7031 17.6257 8.51184 15.7132 5.97784 13.1896C3.43963 10.6617 1.43613 7.35233 1.48789 4.86014C1.50859 3.7883 1.88242 2.87001 2.64484 2.20074C2.71117 2.14477 2.76714 2.09914 2.82312 2.04317C3.11243 1.79526 3.43279 1.65166 3.71558 1.65166C4.00238 1.65166 4.24758 1.76823 4.44504 2.05714L6.20032 4.69715C6.37076 4.93622 6.36252 5.15881 6.15259 5.49143L5.18466 7.05327C4.75546 7.75199 4.83002 8.27495 5.26746 8.86001C5.82107 9.61531 6.67626 10.6948 7.43145 11.4356C8.17628 12.1847 9.41485 13.2361 10.0812 13.7154C10.6663 14.1384 11.1979 14.2255 12.0996 13.8026L13.7488 13.0112C14.1212 12.8448 14.4082 12.8946 14.7222 13.0902L17.0047 14.6271C17.2936 14.8121 17.4101 15.0594 17.4101 15.3462C17.4101 15.6332 17.2687 15.9494 17.0165 16.2408C16.9606 16.3071 16.917 16.361 16.8714 16.417C16.2 17.1919 15.2693 17.5636 14.1932 17.5843Z" />
    </svg>
  );
};

export const AppleTrashIcon: React.FC<{
  size?: number | string;
  className?: string;
  color?: string;
  alt?: string;
}> = ({ size = 16, className = '', color = 'currentColor', alt = 'Eliminar' }) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  return (
    <svg
      viewBox="0 0 18.8989 23.4772"
      fill={color}
      className={`inline-block shrink-0 select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      aria-label={alt}
      role="img"
    >
      <path d="M6.55727 18.5949C6.93452 18.5949 7.1749 18.3607 7.16455 18.0187L6.86317 7.57707C6.85282 7.22474 6.60611 7.00506 6.2559 7.00506C5.89111 7.00506 5.63827 7.23509 5.64862 7.58129L5.95 18.0208C5.96035 18.3732 6.20284 18.5949 6.55727 18.5949ZM9.45052 18.5949C9.82566 18.5949 10.0785 18.3628 10.0785 18.0187L10.0785 7.58129C10.0785 7.2372 9.82566 7.00506 9.45052 7.00506C9.07749 7.00506 8.82254 7.2372 8.82254 7.58129L8.82254 18.0187C8.82254 18.3628 9.07749 18.5949 9.45052 18.5949ZM12.352 18.5992C12.6982 18.5992 12.951 18.3753 12.9614 18.0229L13.2524 7.5834C13.2628 7.2372 13.0182 7.00717 12.6451 7.00717C12.2928 7.00717 12.0461 7.2372 12.0358 7.57918L11.7447 18.0208C11.7344 18.3628 11.9769 18.5992 12.352 18.5992ZM5.16918 4.46303L6.71917 4.46303L6.71917 2.38015C6.71917 1.81649 7.10797 1.45683 7.69464 1.45683L11.1939 1.45683C11.7724 1.45683 12.1612 1.81649 12.1612 2.38015L12.1612 4.46303L13.7215 4.46303L13.7215 2.27664C13.7215 0.867444 12.8021 0 11.2932 0L7.585 0C6.08858 0 5.16918 0.867444 5.16918 2.27664ZM0.725352 5.23803L18.1757 5.23803C18.5819 5.23803 18.8989 4.90851 18.8989 4.50444C18.8989 4.09614 18.5694 3.77084 18.1757 3.77084L0.725352 3.77084C0.341975 3.77084-6.66134e-16 4.09825-6.66134e-16 4.50444C-6.66134e-16 4.91062 0.341975 5.23803 0.725352 5.23803ZM4.98166 21.7381L13.9297 21.7381C15.3261 21.7381 16.2666 20.8371 16.3371 19.4346L17.0146 5.05956L15.4479 5.05956L14.7932 19.2731C14.7662 19.8591 14.3523 20.2709 13.7724 20.2709L5.11411 20.2709C4.55699 20.2709 4.13272 19.8488 4.10569 19.2731L3.41782 5.06167L1.88642 5.06167L2.5764 19.445C2.64694 20.8475 3.56463 21.7381 4.98166 21.7381Z" />
    </svg>
  );
};
