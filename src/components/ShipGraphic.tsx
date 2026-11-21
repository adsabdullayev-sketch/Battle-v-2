import React from 'react';
import { ShipTypeId } from '../types/game';

interface ShipGraphicProps {
  type: ShipTypeId;
  size: number;
  orientation: 'horizontal' | 'vertical';
  sunk?: boolean;
}

export const ShipGraphic: React.FC<ShipGraphicProps> = ({
  type,
  size,
  orientation,
  sunk = false,
}) => {
  // Draw natively in horizontal orientation (width = size * 100, height = 100),
  // then rotate cleanly if vertical so all ship details stay proportional.
  const viewWidth = size * 100;
  const viewHeight = 100;

  const hullFill = sunk ? '#475569' : '#94A3B8';
  const hullDark = sunk ? '#334155' : '#64748B';
  const deckFill = sunk ? '#1E293B' : '#CBD5E1';
  const strokeColor = sunk ? '#F97316' : '#1E293B';

  const renderShipBody = () => {
    switch (type) {
      case 'carrier':
        return (
          <g>
            {/* Main angled flight deck */}
            <path
              d="M 16 20 L 465 14 L 486 30 L 486 70 L 465 86 L 16 80 L 10 66 L 10 34 Z"
              fill={hullFill}
              stroke={strokeColor}
              strokeWidth="4"
            />
            <rect x="26" y="26" width="440" height="48" rx="4" fill={hullDark} />
            {/* Runway dashed center line */}
            <line
              x1="40"
              y1="50"
              x2="452"
              y2="50"
              stroke={deckFill}
              strokeWidth="3"
              strokeDasharray="16 12"
            />
            {/* Runway edge markings */}
            <line x1="40" y1="32" x2="440" y2="32" stroke={deckFill} strokeWidth="1.5" opacity="0.7" />
            <line x1="40" y1="68" x2="440" y2="68" stroke={deckFill} strokeWidth="1.5" opacity="0.7" />
            {/* Bridge island */}
            <rect x="285" y="14" width="64" height="20" rx="4" fill={deckFill} stroke={strokeColor} strokeWidth="3" />
            <rect x="305" y="18" width="20" height="10" rx="2" fill={hullDark} />
          </g>
        );
      case 'battleship':
        return (
          <g>
            {/* Pointed warship hull */}
            <path
              d="M 18 50 C 40 20, 90 18, 120 18 L 366 18 L 388 32 L 388 68 L 366 82 L 120 82 C 90 82, 40 80, 18 50 Z"
              fill={hullFill}
              stroke={strokeColor}
              strokeWidth="4"
            />
            <path
              d="M 44 50 C 62 30, 100 28, 122 28 L 356 28 L 370 38 L 370 62 L 356 72 L 122 72 C 100 72, 62 70, 44 50 Z"
              fill={hullDark}
            />
            {/* Front turret */}
            <circle cx="110" cy="50" r="16" fill={deckFill} stroke={strokeColor} strokeWidth="3" />
            <line x1="72" y1="45" x2="104" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
            <line x1="72" y1="55" x2="104" y2="55" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
            {/* Mid superstructure */}
            <rect x="165" y="34" width="90" height="32" rx="6" fill={deckFill} stroke={strokeColor} strokeWidth="3" />
            <rect x="195" y="42" width="28" height="16" rx="3" fill={hullDark} />
            {/* Rear turret */}
            <circle cx="305" cy="50" r="15" fill={deckFill} stroke={strokeColor} strokeWidth="3" />
            <line x1="312" y1="45" x2="344" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
            <line x1="312" y1="55" x2="344" y2="55" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          </g>
        );
      case 'cruiser':
        return (
          <g>
            <path
              d="M 16 50 C 36 22, 80 20, 110 20 L 268 20 L 284 34 L 284 66 L 268 80 L 110 80 C 80 80, 36 78, 16 50 Z"
              fill={hullFill}
              stroke={strokeColor}
              strokeWidth="4"
            />
            <rect x="85" y="32" width="140" height="36" rx="6" fill={hullDark} />
            <circle cx="76" cy="50" r="13" fill={deckFill} stroke={strokeColor} strokeWidth="3" />
            <line x1="46" y1="50" x2="70" y2="50" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
            <rect x="125" y="36" width="64" height="28" rx="5" fill={deckFill} stroke={strokeColor} strokeWidth="3" />
            <circle cx="230" cy="50" r="11" fill={deckFill} stroke={strokeColor} strokeWidth="3" />
            <line x1="236" y1="50" x2="262" y2="50" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          </g>
        );
      case 'submarine':
        return (
          <g>
            {/* Sleek cigar hull */}
            <rect
              x="16"
              y="24"
              width="254"
              height="52"
              rx="26"
              fill={hullFill}
              stroke={strokeColor}
              strokeWidth="4"
            />
            {/* Tail stabilizers */}
            <path d="M 258 34 L 286 22 L 286 78 L 258 66 Z" fill={hullDark} stroke={strokeColor} strokeWidth="3" />
            {/* Deck spine */}
            <rect x="52" y="42" width="180" height="16" rx="8" fill={hullDark} />
            {/* Conning tower */}
            <rect x="115" y="34" width="54" height="32" rx="12" fill={deckFill} stroke={strokeColor} strokeWidth="3" />
            <circle cx="142" cy="50" r="7" fill={hullDark} />
            {/* Bow dive planes */}
            <rect x="58" y="16" width="14" height="68" rx="4" fill={hullDark} stroke={strokeColor} strokeWidth="2.5" />
          </g>
        );
      case 'destroyer':
        return (
          <g>
            <path
              d="M 14 50 C 34 22, 72 22, 95 22 L 174 22 L 186 35 L 186 65 L 174 78 L 95 78 C 72 78, 34 78, 14 50 Z"
              fill={hullFill}
              stroke={strokeColor}
              strokeWidth="4"
            />
            <circle cx="62" cy="50" r="12" fill={deckFill} stroke={strokeColor} strokeWidth="3" />
            <line x1="34" y1="50" x2="56" y2="50" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
            <rect x="94" y="34" width="56" height="32" rx="6" fill={deckFill} stroke={strokeColor} strokeWidth="3" />
            <circle cx="118" cy="50" r="8" fill={hullDark} />
          </g>
        );
    }
  };

  if (orientation === 'horizontal') {
    return (
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className="w-full h-full pointer-events-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
        preserveAspectRatio="none"
      >
        {renderShipBody()}
      </svg>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${viewHeight} ${viewWidth}`}
      className="w-full h-full pointer-events-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
      preserveAspectRatio="none"
    >
      <g transform={`translate(${viewHeight}, 0) rotate(90)`}>
        {renderShipBody()}
      </g>
    </svg>
  );
};

export const ExplosionMarker: React.FC<{ sunk?: boolean }> = ({ sunk = false }) => (
  <svg viewBox="0 0 40 40" className="w-[82%] h-[82%] animate-hit-burst pointer-events-none select-none">
    <path
      d="M20 3 L24 12 L34 7 L29 17 L38 21 L28 24 L33 34 L23 29 L19 38 L16 28 L6 33 L11 23 L2 19 L12 16 L7 6 L17 11 Z"
      fill={sunk ? '#DC2626' : '#EA580C'}
      stroke="#FEF08A"
      strokeWidth="1.5"
    />
    <circle cx="20" cy="20" r="6.5" fill="#FACC15" />
    <circle cx="20" cy="20" r="3" fill="#FFFBEB" />
  </svg>
);

export const WaterSplashMarker: React.FC = () => (
  <svg viewBox="0 0 40 40" className="w-[74%] h-[74%] animate-splash-ring pointer-events-none select-none">
    <circle cx="20" cy="20" r="13" fill="none" stroke="#93C5FD" strokeWidth="2" strokeDasharray="5 3" opacity="0.85" />
    <circle cx="20" cy="20" r="7" fill="none" stroke="#E0F2FE" strokeWidth="2" opacity="0.9" />
    <circle cx="20" cy="20" r="2.6" fill="#FFFFFF" />
  </svg>
);
