import React from 'react';

interface LogoProps {
  iconOnly?: boolean;
  className?: string;
}

export default function Logo({ iconOnly = false, className = "w-full" }: LogoProps) {
  // SVG viewBox configurations
  // Full Logo: includes the icon illustration, "BloodConnect TN" text, heartbeat divider, and tagline
  // Icon Only: crops to show only the continuous visual flow of Blood Bag -> ECG Line -> Heart Handshake
  const viewBox = iconOnly ? "130 80 520 270" : "0 0 800 500";

  return (
    <svg
      viewBox={viewBox}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. Definitions & ClipPaths */}
      <defs>
        <clipPath id="blood-bag-clip">
          <rect x="158" y="113" width="84" height="124" rx="12" />
        </clipPath>
      </defs>

      {/* 2. Graphical Icon Group (Blood Bag -> ECG Line -> Heart Handshake) */}
      <g id="logo-graphic-flow">
        {/* A. Left Side: Blood Bag Fill (Bright Red #D32F2F) with fluid wave effect */}
        <path
          d="M 150 175 Q 175 165 200 175 T 250 175 L 250 245 L 150 245 Z"
          fill="#D32F2F"
          clipPath="url(#blood-bag-clip)"
        />

        {/* B. White Medical Cross inside Blood Bag */}
        <rect x="190" y="201" width="20" height="8" rx="1.5" fill="#FFFFFF" />
        <rect x="196" y="195" width="8" height="20" rx="1.5" fill="#FFFFFF" />

        {/* C. Blood Bag Outer Charcoal Outline (#212121) and Top Hanger */}
        {/* Main bag body outline */}
        <rect
          x="155" y="110" width="90" height="130" rx="15"
          stroke="#212121"
          strokeWidth="6"
          fill="none"
        />
        {/* Top hanger handle */}
        <path
          d="M 185 110 L 185 100 A 15 15 0 0 1 215 100 L 215 110"
          stroke="#212121"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Hanger hole */}
        <circle cx="200" cy="100" r="5" fill="#212121" />

        {/* D. Tube Connector at Bottom */}
        <rect x="192" y="235" width="16" height="8" rx="2" fill="#212121" />

        {/* E. SINGLE CONTINUOUS LINE: representing the life-saving journey from donation to recipient */}
        {/* Red path of: Tube Outlet -> Baseline -> ECG heartbeats -> Heart Outline */}
        <path
          d="M 200 240 L 200 275 L 270 275 L 280 290 L 290 260 L 305 150 L 320 340 L 330 255 L 340 275 L 460 275 L 540 275 C 460 210, 460 140, 540 140 C 620 140, 620 210, 540 275"
          stroke="#D32F2F"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* F. Symmetrical Abstract Handshake inside Heart Outline (#212121) */}
        <g id="heart-handshake" opacity="0.95">
          {/* Left sleeve/wrist arm */}
          <path
            d="M 475 220 L 510 185 C 515 180, 525 180, 530 185 L 555 210"
            stroke="#212121"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Right sleeve/wrist arm */}
          <path
            d="M 605 220 L 570 185 C 565 180, 555 180, 550 185 L 525 210"
            stroke="#212121"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Interlocking thumb clasps */}
          <path
            d="M 515 190 C 520 185, 525 185, 530 190"
            stroke="#212121"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 565 190 C 560 185, 555 185, 550 190"
            stroke="#212121"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Accent cuff line highlights */}
          <line x1="485" y1="210" x2="495" y2="220" stroke="#212121" strokeWidth="4" strokeLinecap="round" />
          <line x1="595" y1="210" x2="585" y2="220" stroke="#212121" strokeWidth="4" strokeLinecap="round" />
        </g>
      </g>

      {/* 3. Text Components (rendered only in full logo layout) */}
      {!iconOnly && (
        <g id="logo-text-branding">
          {/* A. Bold modern sans-serif Name: "BloodConnect" */}
          {/* "Blood" in #D32F2F */}
          <text
            x="375"
            y="385"
            fontFamily="'Inter', system-ui, -apple-system, sans-serif"
            fontSize="44"
            fontWeight="900"
            textAnchor="end"
            letterSpacing="-1.5"
          >
            <tspan fill="#D32F2F">Blood</tspan>
          </text>
          {/* "Connect" in #212121 */}
          <text
            x="375"
            y="385"
            fontFamily="'Inter', system-ui, -apple-system, sans-serif"
            fontSize="44"
            fontWeight="900"
            textAnchor="start"
            fill="#212121"
            letterSpacing="-1.5"
          >
            Connect
          </text>

          {/* B. "TN" inside a rounded red rectangle with white text */}
          <rect x="552" y="348" width="60" height="42" rx="10" fill="#D32F2F" />
          <text
            x="582"
            y="378"
            fontFamily="'Inter', system-ui, -apple-system, sans-serif"
            fontSize="24"
            fontWeight="900"
            fill="#FFFFFF"
            textAnchor="middle"
          >
            TN
          </text>

          {/* C. Thin red heartbeat line as a divider above the tagline */}
          <path
            d="M 250 415 L 375 415 L 382 422 L 390 400 L 400 435 L 410 410 L 418 415 L 550 415"
            stroke="#D32F2F"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* D. Tagline: "Connecting Donors. Saving Lives." */}
          <text
            x="400"
            y="455"
            fontFamily="'Inter', system-ui, -apple-system, sans-serif"
            fontSize="18"
            fontWeight="600"
            fill="#64748B"
            textAnchor="middle"
            letterSpacing="1.5"
          >
            CONNECTING DONORS. SAVING LIVES.
          </text>
        </g>
      )}
    </svg>
  );
}
