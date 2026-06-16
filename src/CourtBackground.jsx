import React from "react";

// Simple, clean court/pitch backgrounds drawn on a 0..100 x 0..100 grid
// (rendered into a viewBox of 0 0 100 130 for portrait orientation).
// Lines are subtle; the players sit on top.

export function CourtBackground({ sport, accent }) {
  const line = "rgba(0,0,0,0.16)";
  const fill = `${accent}0d`;
  const common = { fill: "none", stroke: line, strokeWidth: 0.5 };

  if (sport === "Soccer") {
    return (
      <g>
        <rect x="2" y="2" width="96" height="126" rx="2" fill={fill} stroke={line} strokeWidth="0.6" />
        <line x1="2" y1="65" x2="98" y2="65" {...common} />
        <circle cx="50" cy="65" r="11" {...common} />
        <circle cx="50" cy="65" r="0.8" fill={line} />
        {/* our goal box (bottom) */}
        <rect x="28" y="112" width="44" height="16" {...common} />
        <rect x="40" y="122" width="20" height="6" {...common} />
        {/* opp goal box (top) */}
        <rect x="28" y="2" width="44" height="16" {...common} />
        <rect x="40" y="2" width="20" height="6" {...common} />
      </g>
    );
  }

  if (sport === "Basketball") {
    return (
      <g>
        <rect x="2" y="2" width="96" height="126" rx="2" fill={fill} stroke={line} strokeWidth="0.6" />
        <line x1="2" y1="65" x2="98" y2="65" {...common} />
        <circle cx="50" cy="65" r="9" {...common} />
        {/* our hoop end (bottom) */}
        <rect x="34" y="104" width="32" height="24" {...common} />
        <circle cx="50" cy="104" r="9" {...common} />
        <circle cx="50" cy="124" r="2" {...common} />
        {/* opp hoop end (top) */}
        <rect x="34" y="2" width="32" height="24" {...common} />
        <circle cx="50" cy="26" r="9" {...common} />
        <circle cx="50" cy="6" r="2" {...common} />
      </g>
    );
  }

  if (sport === "Netball") {
    return (
      <g>
        <rect x="2" y="2" width="96" height="126" rx="2" fill={fill} stroke={line} strokeWidth="0.6" />
        {/* thirds */}
        <line x1="2" y1="44.7" x2="98" y2="44.7" {...common} />
        <line x1="2" y1="85.3" x2="98" y2="85.3" {...common} />
        <circle cx="50" cy="65" r="6" {...common} />
        {/* goal circles */}
        <path d="M 30 2 A 20 20 0 0 0 70 2" {...common} />
        <path d="M 30 128 A 20 20 0 0 1 70 128" {...common} />
      </g>
    );
  }

  if (sport === "AFL") {
    return (
      <g>
        <ellipse cx="50" cy="65" rx="48" ry="63" fill={fill} stroke={line} strokeWidth="0.6" />
        <ellipse cx="50" cy="65" rx="9" ry="9" {...common} />
        <line x1="50" y1="56" x2="50" y2="74" {...common} />
        {/* goal squares */}
        <rect x="44" y="2" width="12" height="6" {...common} />
        <rect x="44" y="122" width="12" height="6" {...common} />
      </g>
    );
  }

  return <rect x="2" y="2" width="96" height="126" rx="2" fill={fill} stroke={line} strokeWidth="0.6" />;
}
