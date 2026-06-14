'use client';

interface CencosudLogoProps {
  size?: number;
}

export default function CencosudLogo({ size = 32 }: CencosudLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" rx="16" fill="var(--cenc-surface)" />
      <path
        d="M50 15C30.67 15 15 30.67 15 50C15 69.33 30.67 85 50 85C69.33 85 85 69.33 85 50C85 30.67 69.33 15 50 15Z"
        fill="#003087"
      />
      <path
        d="M50 25C36.19 25 25 36.19 25 50C25 63.81 36.19 75 50 75C63.81 75 75 63.81 75 50"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="75" cy="50" r="5" fill="#f5a623" />
      <path
        d="M38 50C38 43.37 43.37 38 50 38"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
