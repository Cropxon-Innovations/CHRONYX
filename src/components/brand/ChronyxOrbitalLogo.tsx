import { motion, useReducedMotion } from "framer-motion";

/**
 * CHRONYX — Orbital Nucleus mark
 * A solid nucleus surrounded by three tilted elliptical orbits with electrons.
 * Single source of truth for the brand symbol. Uses `currentColor` so it
 * adapts to text color; the accent electron uses --primary.
 */

interface OrbitalProps {
  className?: string;
  /** Animate orbits + electrons */
  animated?: boolean;
  /** Show the soft outer glow halo */
  glow?: boolean;
  /** Title for a11y */
  title?: string;
}

export const ChronyxOrbitalLogo = ({
  className = "w-8 h-8",
  animated = false,
  glow = false,
  title = "CHRONYX",
}: OrbitalProps) => {
  const reduce = useReducedMotion();
  const live = animated && !reduce;

  return (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <radialGradient id="cx-nucleus" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="55%" stopColor="currentColor" stopOpacity="0.92" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.78" />
        </radialGradient>
        <radialGradient id="cx-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="70%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      {glow && <circle cx="256" cy="256" r="252" fill="url(#cx-halo)" />}

      {/* Three tilted orbits */}
      {[0, 60, -60].map((rot, i) => (
        <motion.g
          key={rot}
          style={{ transformOrigin: "256px 256px", transformBox: "fill-box" as any }}
          animate={live ? { rotate: i % 2 === 0 ? 360 : -360 } : {}}
          transition={live ? { duration: 18 + i * 4, repeat: Infinity, ease: "linear" } : undefined}
        >
          <g transform={`rotate(${rot} 256 256)`}>
            <ellipse
              cx="256"
              cy="256"
              rx="220"
              ry="74"
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.55}
              strokeWidth={i === 0 ? 10 : 8}
            />
            {/* Electron on the orbit */}
            <circle
              cx="476"
              cy="256"
              r={i === 0 ? 18 : 14}
              fill={i === 0 ? "hsl(var(--primary))" : "currentColor"}
            />
          </g>
        </motion.g>
      ))}

      {/* Nucleus core */}
      <circle cx="256" cy="256" r="78" fill="url(#cx-nucleus)" />
      <circle cx="232" cy="232" r="22" fill="hsl(var(--background))" fillOpacity="0.18" />
    </svg>
  );
};

export default ChronyxOrbitalLogo;
