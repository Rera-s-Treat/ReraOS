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
  const treatColor = variant === 'light' ? '#A8D5A8' : '#1C4A1C';
  const taglineColor = variant === 'light' ? '#7EC87E' : '#5A8A5A';
  const lineColor = variant === 'light' ? '#3B6D3B' : '#C8D8C8';

  return (
    <svg
      viewBox="0 0 320 118"
      className={className}
      style={style}
      role="img"
      aria-label="Rera's Treat"
    >
      <text
        x="160"
        y="66"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="60"
        fontWeight={600}
        fill="#E8621A"
        letterSpacing="2"
      >
        Rera&apos;s
      </text>
      <path
        d="M168 45 C168 37 176 31 184 37 C192 31 200 37 200 45 C200 53 184 63 184 63 C184 63 168 53 168 45Z"
        fill="#E8621A"
        opacity={0.15}
      />
      <path
        d="M170 45 C170 38.5 177 33 184 38.5 C191 33 198 38.5 198 45 C198 52 184 61 184 61 C184 61 170 52 170 45Z"
        fill="none"
        stroke="#E8621A"
        strokeWidth={1.5}
      />
      <text
        x="160"
        y="96"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="44"
        fontWeight={600}
        fontStyle="italic"
        fill={treatColor}
        letterSpacing="1"
      >
        Treat
      </text>
      {showTagline && (
        <>
          <line
            x1="46"
            y1="106"
            x2="118"
            y2="106"
            stroke={lineColor}
            strokeWidth={0.5}
          />
          <text
            x="160"
            y="114"
            textAnchor="middle"
            fontFamily="'Jost', sans-serif"
            fontSize="9"
            fill={taglineColor}
            letterSpacing="5"
          >
            FINGER FOODS CAFÉ
          </text>
          <line
            x1="202"
            y1="106"
            x2="274"
            y2="106"
            stroke={lineColor}
            strokeWidth={0.5}
          />
        </>
      )}
    </svg>
  );
}
