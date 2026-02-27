import React, { useState, useEffect, useRef, useMemo } from 'react';

// European roulette wheel order (clockwise from 0 at top)
const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const SEGMENTS = WHEEL_ORDER.length;
const SEGMENT_ANGLE = 360 / SEGMENTS;
const DIVIDER_DEG = 0.6; // thin white line between segments
const SPIN_DURATION_MS = 5000;
const EXTRA_ROTATIONS = 6;

// Real roulette segment colors: green for 0, red/black for others
const getSegmentColor = (num) => {
  if (num === 0) return '#15803d'; // green
  return RED_NUMBERS.includes(num) ? '#dc2626' : '#0f172a'; // red / black
};

const RouletteWheel = ({ winningNumber, isSpinning, size = 280 }) => {
  const [rotation, setRotation] = useState(0);
  const [displayNumber, setDisplayNumber] = useState(null);
  const prevWinningRef = useRef(null);

  useEffect(() => {
    if (winningNumber == null) return;

    const winningIndex = WHEEL_ORDER.indexOf(Number(winningNumber));
    if (winningIndex === -1) return;

    // Align center of winning segment with pointer at top (0°). Segment i center is at (i * SEGMENT_ANGLE + SEGMENT_ANGLE/2).
    // With rotation R, viewport top shows wheel angle (360 - R) mod 360. So we need R = (360 - segmentCenter) mod 360.
    const segmentCenter = winningIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const targetMod = (360 - (segmentCenter % 360) + 360) % 360;

    const fullTurns = 360 * EXTRA_ROTATIONS;
    if (prevWinningRef.current !== winningNumber) {
      prevWinningRef.current = winningNumber;
      setDisplayNumber(winningNumber);
      setRotation((prev) => {
        const currentMod = ((prev % 360) + 360) % 360;
        let delta = (targetMod - currentMod + 360) % 360;
        if (delta <= 0) delta += 360;
        return prev + fullTurns + delta;
      });
    }
  }, [winningNumber]);

  // Conic gradient: 37 segments with red/black/green and thin white dividers (0° = top, clockwise)
  const segmentGradient = useMemo(() => {
    const parts = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const start = i * SEGMENT_ANGLE;
      const colorEnd = start + SEGMENT_ANGLE - DIVIDER_DEG;
      const end = start + SEGMENT_ANGLE;
      parts.push(`${getSegmentColor(WHEEL_ORDER[i])} ${start}deg ${colorEnd}deg`);
      parts.push(`rgba(255,255,255,0.7) ${colorEnd}deg ${end}deg`);
    }
    return `conic-gradient(${parts.join(', ')})`;
  }, []);

  const pointerSize = 16;
  const innerSize = Math.round(size * 0.92); // segment ring slightly smaller so SVG rim shows

  return (
    <div
      className="relative flex flex-col items-center justify-center mx-auto"
      style={{ width: size + pointerSize * 2, height: size + pointerSize * 2 + 20 }}
    >
      {/* Pointer at top */}
      <div
        className="absolute z-10"
        style={{
          top: 2,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: `${pointerSize}px solid transparent`,
          borderRight: `${pointerSize}px solid transparent`,
          borderTop: `${pointerSize}px solid #eab308`,
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))',
        }}
      />

      {/* Wheel: SVG rim + real roulette ring (red/black/green + numbers) */}
      <div
        className="absolute rounded-full overflow-hidden shadow-2xl"
        style={{
          width: size,
          height: size,
          top: pointerSize,
          left: pointerSize,
          boxShadow: '0 0 0 2px #1f2937, 0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        <div
          className="w-full h-full rounded-full flex items-center justify-center relative"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)`
              : 'none',
            willChange: isSpinning ? 'transform' : 'auto',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Background: your SVG behind the wheel (slightly larger for stronger rim effect) */}
          <img
            src="https://res.cloudinary.com/dnyp5jknp/image/upload/v1772174932/Untitled_design_4_sgypbq.svg"
            alt=""
            role="presentation"
            className="absolute select-none pointer-events-none"
            style={{
              width: size * 1.2,
              height: size * 1.2,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              zIndex: 0,
            }}
            draggable={false}
          />
          {/* Foreground: real roulette ring (segments + numbers) on top of background */}
          <div
            className="absolute rounded-full overflow-visible"
            style={{
              zIndex: 1,
              width: innerSize,
              height: innerSize,
              left: (size - innerSize) / 2,
              top: (size - innerSize) / 2,
              background: segmentGradient,
              boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.15), inset 0 0 12px rgba(0,0,0,0.3)',
            }}
          >
            {WHEEL_ORDER.map((num, i) => {
              const centerDeg = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
              const rad = (centerDeg * Math.PI) / 180;
              const r = 38; // % from center so numbers sit on the segment ring
              const x = 50 + r * Math.sin(rad);
              const y = 50 - r * Math.cos(rad);
              const textColor =
                num === 0 ? '#fef08a' : RED_NUMBERS.includes(num) ? '#fef2f2' : '#e2e8f0';
              return (
                <div
                  key={`n-${num}-${i}`}
                  className="absolute flex items-center justify-center font-bold select-none text-[10px] sm:text-[11px]"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: 20,
                    height: 20,
                    marginLeft: -10,
                    marginTop: -10,
                    color: textColor,
                    textShadow: '0 0 2px #000, 0 1px 2px #000',
                    transform: `rotate(${-centerDeg}deg)`,
                  }}
                >
                  {num}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Center hub - fixed over wheel */}
      <div
        className="absolute rounded-full border-4 border-amber-600/80 bg-[#1F2732] flex items-center justify-center z-[5]"
        style={{
          width: 52,
          height: 52,
          top: pointerSize + size / 2 - 26,
          left: pointerSize + size / 2 - 26,
          boxShadow: 'inset 0 0 12px rgba(0,0,0,0.6), 0 0 0 2px #1f2937',
        }}
      >
        {displayNumber != null && (
          <span
            className="font-bold text-lg"
            style={{
              color:
                displayNumber === 0 ? '#22c55e' : RED_NUMBERS.includes(displayNumber) ? '#f87171' : '#fff',
            }}
          >
            {displayNumber}
          </span>
        )}
      </div>

      {displayNumber != null && !isSpinning && (
        <p className="absolute bottom-0 left-0 right-0 text-center text-gray-400 text-xs">Winning number</p>
      )}
    </div>
  );
};

export default RouletteWheel;
