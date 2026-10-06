import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark';
  showTagline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Logo({
  variant = 'dark',
  showTagline = true,
  className,
  style,
}: LogoProps) {
  const reraColor = variant === 'light' ? '#FFF4E3' : '#3B2118';
  const underlineColor = '#E9A83B';
  const tomato = '#D94A32';

  return (
    <svg
      viewBox="0 0 320 128"
      className={className}
      style={style}
      role="img"
      aria-label="Rera's Treat"
    >
      <path
        d="M180 8 C180 4 184 1.5 188 4.5 C192 1.5 196 4 196 8 C196 12.5 188 18.5 188 18.5 C188 18.5 180 12.5 180 8Z"
        fill={tomato}
      />
      <text
        x="160"
        y="56"
        textAnchor="middle"
        fontFamily="'Fraunces', Georgia, serif"
        fontSize="52"
        fontWeight={600}
        letterSpacing="0.3"
      >
        <tspan fill={reraColor}>Rera&#8217;s </tspan>
        <tspan fill={tomato}>Treat</tspan>
      </text>
      <rect x="72" y="70" width="176" height="4" rx="2" fill={underlineColor} />
      {showTagline && (
        <text
          x="160"
          y="104"
          textAnchor="middle"
          fontFamily="'Fraunces', Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill={underlineColor}
        >
          Love, served generously.
        </text>
      )}
    </svg>
  );
}
