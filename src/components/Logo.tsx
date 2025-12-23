import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 48, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Persephone Logo"
    >
      {/* Outer circle - represents the platform/infrastructure */}
      <circle
        cx="32"
        cy="32"
        r="30"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* Inner geometric pattern - represents Persephone's crown */}
      <path
        d="M32 8L38 20H26L32 8Z"
        fill="currentColor"
      />

      {/* Elegant P letterform - stylized */}
      <path
        d="M24 24V52H28V42H36C42.627 42 48 36.627 48 30C48 23.373 42.627 18 36 18H28C25.791 18 24 19.791 24 22V24Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="36"
        cy="30"
        r="6"
        fill="currentColor"
      />

      {/* Pomegranate seeds - three dots representing Persephone's myth */}
      <circle cx="20" cy="48" r="2" fill="currentColor" />
      <circle cx="32" cy="52" r="2" fill="currentColor" />
      <circle cx="44" cy="48" r="2" fill="currentColor" />
    </svg>
  );
};

export default Logo;
