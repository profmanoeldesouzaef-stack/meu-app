import React from "react";

interface VyraLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const VyraLogo: React.FC<VyraLogoProps> = ({
  className = "w-10 h-10",
  size,
  showText = false,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={style}>
      <svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_4px_16px_rgba(255,106,42,0.35)]"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="vyraFire" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF8B3D" />
            <stop offset="35%" stopColor="#FF6A2A" />
            <stop offset="70%" stopColor="#E65100" />
            <stop offset="100%" stopColor="#C43B00" />
          </linearGradient>

          <linearGradient id="vyraGoldRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E68A36" />
            <stop offset="50%" stopColor="#B3591B" />
            <stop offset="100%" stopColor="#7A360E" />
          </linearGradient>

          <linearGradient id="vyraSilverText" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#E6E6EB" />
            <stop offset="60%" stopColor="#B5B5BE" />
            <stop offset="100%" stopColor="#757580" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Dial / Compass Ring */}
        <circle
          cx="200"
          cy="200"
          r="185"
          stroke="url(#vyraGoldRing)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="18 4 6 4"
        />
        <circle
          cx="200"
          cy="200"
          r="174"
          stroke="url(#vyraGoldRing)"
          strokeWidth="2.5"
          opacity="0.85"
        />

        {/* Compass Cardinal Arrow Points */}
        {/* Top */}
        <polygon points="200,4 207,24 193,24" fill="url(#vyraFire)" />
        {/* Bottom */}
        <polygon points="200,396 207,376 193,376" fill="url(#vyraFire)" />
        {/* Left */}
        <polygon points="4,200 24,193 24,207" fill="url(#vyraFire)" />
        {/* Right */}
        <polygon points="396,200 376,193 376,207" fill="url(#vyraFire)" />

        {/* Phoenix Wings - Left Side */}
        <path
          d="M200 135 C175 110, 110 50, 8 36 C45 80, 75 110, 105 150 C60 115, 30 110, 24 112 C45 140, 90 180, 140 195 C95 185, 45 185, 35 190 C60 215, 120 235, 180 220 Z"
          fill="url(#vyraFire)"
        />
        {/* Left Feather Details */}
        <path
          d="M160 160 C120 130, 60 90, 25 70 C55 95, 95 130, 140 168 Z"
          fill="#FF9A62"
          opacity="0.9"
        />

        {/* Phoenix Wings - Right Side */}
        <path
          d="M200 135 C225 110, 290 50, 392 36 C355 80, 325 110, 295 150 C340 115, 370 110, 376 112 C355 140, 310 180, 260 195 C305 185, 355 185, 365 190 C340 215, 280 235, 220 220 Z"
          fill="url(#vyraFire)"
        />
        {/* Right Feather Details */}
        <path
          d="M240 160 C280 130, 340 90, 375 70 C345 95, 305 130, 260 168 Z"
          fill="#FF9A62"
          opacity="0.9"
        />

        {/* Phoenix Head & Crown */}
        <path
          d="M200 80 C215 90, 225 105, 220 125 C215 135, 205 145, 200 150 C195 145, 185 135, 180 125 C175 105, 185 90, 200 80 Z"
          fill="url(#vyraFire)"
        />
        {/* Beak & Crest Spire */}
        <polygon points="200,68 206,95 194,95" fill="#FFB74D" />
        <polygon points="186,110 168,114 184,120" fill="#FFE0B2" />
        <circle cx="188" cy="112" r="2.5" fill="#0A0A0A" />

        {/* Phoenix Tail Feathers (Downward Spike Trident at 6 o'clock) */}
        <polygon points="200,220 212,340 200,380 188,340" fill="url(#vyraFire)" />
        <polygon points="180,240 170,320 185,290" fill="#E65100" />
        <polygon points="220,240 230,320 215,290" fill="#E65100" />

        {/* Athlete Silhouettes in White inside Wings */}
        {/* 1. Left Upper: Rower / Rope Pull Athlete */}
        <g transform="translate(36, 68) scale(0.65)" fill="#FFFFFF">
          <circle cx="12" cy="6" r="4.5" />
          <path d="M6 14 L18 10 L28 22 L22 26 L14 18 L10 28 L4 26 Z" />
          <path d="M0 24 L14 15" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* 2. Left Lower: Sprinting Runner */}
        <g transform="translate(42, 118) scale(0.65)" fill="#FFFFFF">
          <circle cx="18" cy="6" r="4.5" />
          <path d="M12 12 L22 10 L28 16 L20 22 L26 30 L20 32 L14 24 L8 28 L4 24 L12 18 Z" />
        </g>

        {/* 3. Center Left: Olympic Weightlifter / Snatch with Barbell */}
        <g transform="translate(104, 126) scale(0.65)" fill="#FFFFFF">
          <line x1="2" y1="6" x2="38" y2="6" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          <rect x="0" y="2" width="4" height="8" rx="1" />
          <rect x="36" y="2" width="4" height="8" rx="1" />
          <circle cx="20" cy="13" r="4" />
          <path d="M14 20 L26 20 L28 28 L34 36 L28 36 L24 28 L16 28 L12 36 L6 36 L12 28 Z" />
          <path d="M8 6 L16 18 M32 6 L24 18" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* 4. Center Right: Calisthenics / Ring Gymnast */}
        <g transform="translate(254, 126) scale(0.65)" fill="#FFFFFF">
          <circle cx="20" cy="8" r="4.5" />
          <path d="M14 16 L26 16 L28 24 L34 32 L28 34 L22 26 L18 26 L12 34 L6 32 L12 24 Z" />
          <line x1="4" y1="4" x2="14" y2="16" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <line x1="36" y1="4" x2="26" y2="16" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* 5. Right Upper: Cyclist */}
        <g transform="translate(315, 102) scale(0.65)" fill="#FFFFFF">
          <circle cx="8" cy="24" r="7" stroke="#FFFFFF" strokeWidth="2" fill="none" />
          <circle cx="32" cy="24" r="7" stroke="#FFFFFF" strokeWidth="2" fill="none" />
          <circle cx="20" cy="8" r="4" />
          <path d="M10 24 L18 16 L26 24 L16 24 M18 16 L22 10 L28 10" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>

      </svg>
    </div>
  );
};
