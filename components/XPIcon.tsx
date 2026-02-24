import React from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

/**
 * XP bolt icon (consistent across the app).
 * Inspired by classic gamified "XP lightning" visuals: bold outline + warm yellow fill.
 */
<<<<<<< HEAD

// Render the XP icon ~20% larger than the provided size so it reads better next
// to numbers across the app (more like a reward badge than a thin glyph).
const XP_SCALE = 1.2;

export default function XPIcon({ size = 18 }: { size?: number }) {
  const scaled = size * XP_SCALE;
  const isSmall = scaled <= 16;
  const strokeWidth = isSmall ? 3 : 4;

  return (
    <Svg width={scaled} height={scaled} viewBox="0 0 64 64" fill="none">
=======
export default function XPIcon({ size = 18 }: { size?: number }) {
  const isSmall = size <= 16;
  const strokeWidth = isSmall ? 3 : 4;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
>>>>>>> 886717ede766810c2c94fee0f788e2a965d02e87
      <Defs>
        <LinearGradient id="xpBoltFill" x1="18" y1="4" x2="46" y2="60" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFF7B2" />
          <Stop offset="0.45" stopColor="#FDE047" />
          <Stop offset="1" stopColor="#F59E0B" />
        </LinearGradient>
      </Defs>

      {/* Main bolt */}
      <Path
        d="M46 4L18 32H34L24 60L52 32H36L46 4Z"
        fill="url(#xpBoltFill)"
        stroke="#B45309"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Subtle inner shine (keeps readability at small sizes) */}
      {!isSmall && (
        <Path
          d="M42.5 11L27.5 32H33.5L27.5 51.5L44.5 32H38L42.5 11Z"
          fill="#FFFFFF"
          opacity={0.14}
        />
      )}
    </Svg>
  );
}
