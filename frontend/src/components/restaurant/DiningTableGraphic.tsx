import React from 'react';
import { cn } from '@/lib/utils';

export interface DiningTableGraphicProps {
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BILLED' | 'CLEANING' | 'OUT_OF_SERVICE' | string;
  cleaningStatus?: 'CLEAN' | 'DIRTY' | 'CLEANING' | string;
  hasAlert?: boolean;
  alertSeverity?: 'INFO' | 'WARNING' | 'DANGER' | string;
  isRound?: boolean;
  className?: string;
}

export function DiningTableGraphic({
  tableNumber,
  capacity,
  status,
  cleaningStatus,
  hasAlert = false,
  alertSeverity,
  isRound,
  className,
}: DiningTableGraphicProps) {
  // Determine shape: rectangular for 6+ seats, round for odd/small or explicit, square for 4-seats
  const isRectangular = capacity >= 6;
  const computedIsRound =
    isRound !== undefined
      ? isRound
      : isRectangular
      ? false
      : capacity <= 3 ||
        tableNumber.endsWith('1') ||
        tableNumber.endsWith('3') ||
        tableNumber.endsWith('5') ||
        tableNumber.endsWith('7') ||
        tableNumber.endsWith('9') ||
        tableNumber.toLowerCase().includes('round');

  // Format table label (e.g. "T-03" -> "T - 03")
  const formattedTableNumber = React.useMemo(() => {
    if (!tableNumber) return '';
    const match = tableNumber.match(/^([A-Za-z]+)[-_ ]?([0-9]+.*)$/);
    if (match) {
      return `${match[1].toUpperCase()} - ${match[2]}`;
    }
    return tableNumber.toUpperCase();
  }, [tableNumber]);

  // Status colors adhering strictly to our brand color pattern:
  // - OCCUPIED: #0B3D32 (Signature Dark Pine Emerald Brand Color)
  // - AVAILABLE: #10B981 (Success Emerald Green)
  // - BILLED: #F59E0B (Warning Amber)
  // - RESERVED: #1A73E8 (Info Blue)
  // - CLEANING / DIRTY: #EAB308 (Warning Yellow)
  // - OUT_OF_SERVICE: #94A3B8 (Muted Slate)
  // - ALERT: #DC2626 (Signal Red)
  let statusColor = '#10B981'; // Default Available: Emerald Green
  let statusGlow = 'rgba(16, 185, 129, 0.4)';

  if (hasAlert) {
    statusColor = alertSeverity === 'DANGER' ? '#DC2626' : '#F59E0B';
    statusGlow = alertSeverity === 'DANGER' ? 'rgba(220, 38, 38, 0.6)' : 'rgba(245, 158, 11, 0.6)';
  } else if (status === 'OCCUPIED') {
    statusColor = '#0B3D32'; // Our Core Brand Pine Green (#0B3D32)
    statusGlow = 'rgba(11, 61, 50, 0.55)';
  } else if (status === 'BILLED') {
    statusColor = '#F59E0B'; // Warning Amber
    statusGlow = 'rgba(245, 158, 11, 0.5)';
  } else if (status === 'RESERVED') {
    statusColor = '#1A73E8'; // Info Blue
    statusGlow = 'rgba(26, 115, 232, 0.45)';
  } else if (status === 'CLEANING' || cleaningStatus === 'DIRTY') {
    statusColor = '#EAB308'; // Warning Yellow
    statusGlow = 'rgba(234, 179, 8, 0.45)';
  } else if (status === 'OUT_OF_SERVICE') {
    statusColor = '#94A3B8'; // Muted Slate
    statusGlow = 'rgba(148, 163, 184, 0.2)';
  }

  // Unique pattern ID
  const patternId = React.useId().replace(/:/g, '');

  if (isRectangular) {
    // 6-8 Capacity Rectangular Dining Table
    return (
      <div className={cn('relative flex items-center justify-center select-none', className)}>
        <svg
          viewBox="0 0 210 180"
          className="w-full h-auto drop-shadow-sm transition-transform duration-200 group-hover:scale-[1.03]"
        >
          <defs>
            {/* Tablecloth Pattern in our brand deep pine green (#0B3D32) pattern */}
            <pattern id={`gingham-${patternId}`} width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="#F4F8F6" />
              <rect width="3" height="3" fill="#0B3D32" opacity="0.65" />
              <rect x="3" y="3" width="3" height="3" fill="#0B3D32" opacity="0.65" />
              <rect x="0" y="3" width="3" height="3" fill="#07241E" opacity="0.4" />
              <rect x="3" y="0" width="3" height="3" fill="#07241E" opacity="0.4" />
            </pattern>
            <linearGradient id={`rect-table-grad-${patternId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F5ECE1" />
            </linearGradient>
            <linearGradient id={`cushion-grad-${patternId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EBF2EE" />
              <stop offset="100%" stopColor="#D5DFD9" />
            </linearGradient>
          </defs>

          {/* CHAIRS (6 chairs: 2 top, 2 bottom, 1 left, 1 right) */}
          {/* Top Chairs */}
          <g>
            <rect x="62" y="16" width="30" height="7" rx="3.5" fill="#8C6239" stroke="#634120" strokeWidth="0.8" />
            <line x1="67" y1="23" x2="67" y2="28" stroke="#634120" strokeWidth="1.5" />
            <line x1="87" y1="23" x2="87" y2="28" stroke="#634120" strokeWidth="1.5" />
            <rect x="65" y="24" width="24" height="10" rx="2.5" fill={`url(#cushion-grad-${patternId})`} stroke="#A4B8AE" strokeWidth="0.8" />
          </g>
          <g>
            <rect x="118" y="16" width="30" height="7" rx="3.5" fill="#8C6239" stroke="#634120" strokeWidth="0.8" />
            <line x1="123" y1="23" x2="123" y2="28" stroke="#634120" strokeWidth="1.5" />
            <line x1="143" y1="23" x2="143" y2="28" stroke="#634120" strokeWidth="1.5" />
            <rect x="121" y="24" width="24" height="10" rx="2.5" fill={`url(#cushion-grad-${patternId})`} stroke="#A4B8AE" strokeWidth="0.8" />
          </g>

          {/* Bottom Chairs */}
          <g>
            <rect x="62" y="157" width="30" height="7" rx="3.5" fill="#8C6239" stroke="#634120" strokeWidth="0.8" />
            <line x1="67" y1="157" x2="67" y2="152" stroke="#634120" strokeWidth="1.5" />
            <line x1="87" y1="157" x2="87" y2="152" stroke="#634120" strokeWidth="1.5" />
            <rect x="65" y="146" width="24" height="10" rx="2.5" fill={`url(#cushion-grad-${patternId})`} stroke="#A4B8AE" strokeWidth="0.8" />
          </g>
          <g>
            <rect x="118" y="157" width="30" height="7" rx="3.5" fill="#8C6239" stroke="#634120" strokeWidth="0.8" />
            <line x1="123" y1="157" x2="123" y2="152" stroke="#634120" strokeWidth="1.5" />
            <line x1="143" y1="157" x2="143" y2="152" stroke="#634120" strokeWidth="1.5" />
            <rect x="121" y="146" width="24" height="10" rx="2.5" fill={`url(#cushion-grad-${patternId})`} stroke="#A4B8AE" strokeWidth="0.8" />
          </g>

          {/* Left Chair */}
          <g>
            <rect x="16" y="75" width="7" height="30" rx="3.5" fill="#8C6239" stroke="#634120" strokeWidth="0.8" />
            <line x1="23" y1="80" x2="28" y2="80" stroke="#634120" strokeWidth="1.5" />
            <line x1="23" y1="100" x2="28" y2="100" stroke="#634120" strokeWidth="1.5" />
            <rect x="24" y="78" width="10" height="24" rx="2.5" fill={`url(#cushion-grad-${patternId})`} stroke="#A4B8AE" strokeWidth="0.8" />
          </g>

          {/* Right Chair */}
          <g>
            <rect x="187" y="75" width="7" height="30" rx="3.5" fill="#8C6239" stroke="#634120" strokeWidth="0.8" />
            <line x1="187" y1="80" x2="182" y2="80" stroke="#634120" strokeWidth="1.5" />
            <line x1="187" y1="100" x2="182" y2="100" stroke="#634120" strokeWidth="1.5" />
            <rect x="176" y="78" width="10" height="24" rx="2.5" fill={`url(#cushion-grad-${patternId})`} stroke="#A4B8AE" strokeWidth="0.8" />
          </g>

          {/* TABLE TOP */}
          <rect
            x="34"
            y="34"
            width="142"
            height="112"
            rx="18"
            fill={`url(#rect-table-grad-${patternId})`}
            stroke="#CBD5E1"
            strokeWidth="1.4"
          />

          {/* Table Number */}
          <text
            x="105"
            y="64"
            textAnchor="middle"
            fill="#0B3D32"
            fontSize="14"
            fontWeight="800"
            letterSpacing="0.8"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {formattedTableNumber}
          </text>

          {/* Center Checkered Napkin in brand color pattern */}
          <rect
            x="86"
            y="73"
            width="38"
            height="36"
            rx="3"
            fill={`url(#gingham-${patternId})`}
            stroke="#0B3D32"
            strokeWidth="0.8"
          />

          {/* Bottom Colored Status Strip */}
          <path
            d="M 34 128 L 34 128 A 18 18 0 0 0 52 146 L 158 146 A 18 18 0 0 0 176 128 L 176 128 Z"
            fill={statusColor}
          />
        </svg>
      </div>
    );
  }

  if (computedIsRound) {
    // Round Dining Table (Matching T-03 layout with our brand color pattern)
    return (
      <div className={cn('relative flex items-center justify-center select-none', className)}>
        <svg
          viewBox="0 0 180 180"
          className="w-full h-auto drop-shadow-sm transition-transform duration-200 group-hover:scale-[1.03]"
        >
          <defs>
            {/* Tablecloth Pattern in our brand deep pine green (#0B3D32) pattern */}
            <pattern id={`gingham-${patternId}`} width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="#F4F8F6" />
              <rect width="3" height="3" fill="#0B3D32" opacity="0.65" />
              <rect x="3" y="3" width="3" height="3" fill="#0B3D32" opacity="0.65" />
              <rect x="0" y="3" width="3" height="3" fill="#07241E" opacity="0.4" />
              <rect x="3" y="0" width="3" height="3" fill="#07241E" opacity="0.4" />
            </pattern>
            <radialGradient id={`round-table-grad-${patternId}`} cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="85%" stopColor="#F7ECE0" />
              <stop offset="100%" stopColor="#EDE1D4" />
            </radialGradient>
            <linearGradient id={`cushion-grad-${patternId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EBF2EE" />
              <stop offset="100%" stopColor="#D5DFD9" />
            </linearGradient>
          </defs>

          {/* 4 CHAIRS SURROUNDING CIRCLE */}
          {/* Top Chair */}
          <g>
            <path d="M 72 23 Q 90 16 108 23" fill="none" stroke="#8C6239" strokeWidth="6" strokeLinecap="round" />
            <line x1="76" y1="24" x2="81" y2="31" stroke="#634120" strokeWidth="1.8" />
            <line x1="104" y1="24" x2="99" y2="31" stroke="#634120" strokeWidth="1.8" />
            <ellipse cx="90" cy="31" rx="16" ry="8" fill={`url(#cushion-grad-${patternId})`} stroke="#A4B8AE" strokeWidth="0.8" />
          </g>

          {/* Bottom Chair */}
          <g>
            <path d="M 72 157 Q 90 164 108 157" fill="none" stroke="#8C6239" strokeWidth="6" strokeLinecap="round" />
            <line x1="76" y1="156" x2="81" y2="149" stroke="#634120" strokeWidth="1.8" />
            <line x1="104" y1="156" x2="99" y2="149" stroke="#634120" strokeWidth="1.8" />
            <ellipse cx="90" cy="149" rx="16" ry="8" fill={`url(#cushion-grad-${patternId})`} stroke="#A4B8AE" strokeWidth="0.8" />
          </g>

          {/* Left Chair */}
          <g>
            <path d="M 23 72 Q 16 90 23 108" fill="none" stroke="#8C6239" strokeWidth="6" strokeLinecap="round" />
            <line x1="24" y1="76" x2="31" y2="81" stroke="#634120" strokeWidth="1.8" />
            <line x1="24" y1="104" x2="31" y2="99" stroke="#634120" strokeWidth="1.8" />
            <ellipse cx="31" cy="90" rx="8" ry="16" fill={`url(#cushion-grad-${patternId})`} stroke="#A4B8AE" strokeWidth="0.8" />
          </g>

          {/* Right Chair */}
          <g>
            <path d="M 157 72 Q 164 90 157 108" fill="none" stroke="#8C6239" strokeWidth="6" strokeLinecap="round" />
            <line x1="156" y1="76" x2="149" y2="81" stroke="#634120" strokeWidth="1.8" />
            <line x1="156" y1="104" x2="149" y2="99" stroke="#634120" strokeWidth="1.8" />
            <ellipse cx="149" cy="90" rx="8" ry="16" fill={`url(#cushion-grad-${patternId})`} stroke="#A4B8AE" strokeWidth="0.8" />
          </g>

          {/* TABLE TOP CIRCLE */}
          <circle
            cx="90"
            cy="90"
            r="53"
            fill={`url(#round-table-grad-${patternId})`}
            stroke="#CBD5E1"
            strokeWidth="1.4"
          />

          {/* Table Number (Dark pine brand text) */}
          <text
            x="90"
            y="66"
            textAnchor="middle"
            fill="#0B3D32"
            fontSize="14"
            fontWeight="800"
            letterSpacing="0.8"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {formattedTableNumber}
          </text>

          {/* Center Checkered Napkin in brand color pattern */}
          <rect
            x="71"
            y="74"
            width="38"
            height="36"
            rx="3"
            fill={`url(#gingham-${patternId})`}
            stroke="#0B3D32"
            strokeWidth="0.8"
          />

          {/* Curved Status Color Arc along bottom curve */}
          <path
            d="M 47 96 A 48 48 0 0 0 133 96"
            fill="none"
            stroke={statusColor}
            strokeWidth="9"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // Square Dining Table (Matching T-07 layout with our brand color pattern)
  return (
    <div className={cn('relative flex items-center justify-center select-none', className)}>
      <svg
        viewBox="0 0 180 180"
        className="w-full h-auto drop-shadow-sm transition-transform duration-200 group-hover:scale-[1.03]"
      >
        <defs>
          {/* Tablecloth Pattern in our brand deep pine green (#0B3D32) pattern */}
          <pattern id={`gingham-${patternId}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#F4F8F6" />
            <rect width="3" height="3" fill="#0B3D32" opacity="0.65" />
            <rect x="3" y="3" width="3" height="3" fill="#0B3D32" opacity="0.65" />
            <rect x="0" y="3" width="3" height="3" fill="#07241E" opacity="0.4" />
            <rect x="3" y="0" width="3" height="3" fill="#07241E" opacity="0.4" />
          </pattern>
          <linearGradient id={`sq-table-grad-${patternId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F5ECE1" />
          </linearGradient>
          <linearGradient id={`cushion-grad-${patternId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EBF2EE" />
            <stop offset="100%" stopColor="#D5DFD9" />
          </linearGradient>
        </defs>

        {/* 4 CHAIRS */}
        {/* Top Chair */}
        <g>
          <rect x="74" y="16" width="32" height="7" rx="3.5" fill="#8C6239" stroke="#634120" strokeWidth="0.8" />
          <line x1="79" y1="23" x2="79" y2="28" stroke="#634120" strokeWidth="1.5" />
          <line x1="101" y1="23" x2="101" y2="28" stroke="#634120" strokeWidth="1.5" />
          <rect x="77" y="24" width="26" height="10" rx="2.5" fill={`url(#cushion-grad-${patternId})`} stroke="#A4B8AE" strokeWidth="0.8" />
        </g>

        {/* Bottom Chair */}
        <g>
          <rect x="74" y="157" width="32" height="7" rx="3.5" fill="#8C6239" stroke="#634120" strokeWidth="0.8" />
          <line x1="79" y1="157" x2="79" y2="152" stroke="#634120" strokeWidth="1.5" />
          <line x1="101" y1="157" x2="101" y2="152" stroke="#634120" strokeWidth="1.5" />
          <rect x="77" y="146" width="26" height="10" rx="2.5" fill={`url(#cushion-grad-${patternId})`} stroke="#A4B8AE" strokeWidth="0.8" />
        </g>

        {/* Left Chair */}
        <g>
          <rect x="16" y="74" width="7" height="32" rx="3.5" fill="#8C6239" stroke="#634120" strokeWidth="0.8" />
          <line x1="23" y1="79" x2="28" y2="79" stroke="#634120" strokeWidth="1.5" />
          <line x1="23" y1="101" x2="28" y2="101" stroke="#634120" strokeWidth="1.5" />
          <rect x="24" y="77" width="10" height="26" rx="2.5" fill={`url(#cushion-grad-${patternId})`} stroke="#A4B8AE" strokeWidth="0.8" />
        </g>

        {/* Right Chair */}
        <g>
          <rect x="157" y="74" width="7" height="32" rx="3.5" fill="#8C6239" stroke="#634120" strokeWidth="0.8" />
          <line x1="157" y1="79" x2="152" y2="79" stroke="#634120" strokeWidth="1.5" />
          <line x1="157" y1="101" x2="152" y2="101" stroke="#634120" strokeWidth="1.5" />
          <rect x="146" y="77" width="10" height="26" rx="2.5" fill={`url(#cushion-grad-${patternId})`} stroke="#A4B8AE" strokeWidth="0.8" />
        </g>

        {/* TABLE TOP SQUARE WITH ROUNDED CORNERS */}
        <rect
          x="35"
          y="35"
          width="110"
          height="110"
          rx="22"
          fill={`url(#sq-table-grad-${patternId})`}
          stroke="#CBD5E1"
          strokeWidth="1.4"
        />

        {/* Table Number */}
        <text
          x="90"
          y="66"
          textAnchor="middle"
          fill="#0B3D32"
          fontSize="14"
          fontWeight="800"
          letterSpacing="0.8"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {formattedTableNumber}
        </text>

        {/* Center Checkered Napkin in brand color pattern */}
        <rect
          x="71"
          y="74"
          width="38"
          height="36"
          rx="3"
          fill={`url(#gingham-${patternId})`}
          stroke="#0B3D32"
          strokeWidth="0.8"
        />

        {/* Bottom Colored Status Strip */}
        <path
          d="M 35 124 L 35 125 A 22 22 0 0 0 57 145 L 123 145 A 22 22 0 0 0 145 125 L 145 124 Z"
          fill={statusColor}
        />
      </svg>
    </div>
  );
}
