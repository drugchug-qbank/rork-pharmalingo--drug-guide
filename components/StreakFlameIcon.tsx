import React from 'react';
import Svg, { Path } from 'react-native-svg';

/**
 * Duolingo-ish flame: bold outline + warm fills.
 * Readable at small sizes (inner layers hide when small).
 */
export default function StreakFlameIcon({ size = 18 }: { size?: number }) {
  const isSmall = size <= 16;
  const strokeWidth = isSmall ? 3 : 4;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Outer flame (orange fill with red outline) */}
      <Path
        d="M32 62C20 62 10 52 10 40C10 31 15 25 20 20C25 15 24 9 22 6C28 8 30 14 32 18C33 10 32 6 28 2C35 4 40 8 42 4C42 10 45 15 50 20C55 25 54 32 54 40C54 52 44 62 32 62Z"
        fill="#F97316"
        stroke="#EF4444"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Middle flame */}
      <Path
        d="M32 56C24 56 18 50 18 41C18 35 22 31 25 26C28 22 29 18 32 14C35 18 36 22 39 26C42 31 46 35 46 41C46 50 40 56 32 56Z"
        fill="#FDBA74"
      />

      {/* Inner flame */}
      {!isSmall && (
        <>
          <Path
            d="M32 49C28 49 24 46 24 41C24 38 26 35 28 32C30 29 31 26 32 22C33 26 34 29 36 32C38 35 40 38 40 41C40 46 36 49 32 49Z"
            fill="#FDE68A"
          />
          <Path
            d="M32 43C30 43 28 41 28 39C28 37 29 36 30 34C31 33 31.5 31 32 29C32.5 31 33 33 34 34C35 36 36 37 36 39C36 41 34 43 32 43Z"
            fill="#FFFBEB"
          />
        </>
      )}
    </Svg>
  );
}
