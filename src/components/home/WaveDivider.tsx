"use client";

export function WaveDivider() {
  return (
    <div aria-hidden className="relative -mt-6">
      <svg
        viewBox="0 0 400 60"
        preserveAspectRatio="none"
        className="h-14 w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--blue-hero-c)" stopOpacity="0.88" />
            <stop offset="100%" stopColor="var(--bg-end)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,15 C80,50 160,-10 240,15 C305,34 350,32 400,5 L400,60 L0,60 Z"
          fill="url(#wave-gradient)"
        />
      </svg>
    </div>
  );
}

export default WaveDivider;
