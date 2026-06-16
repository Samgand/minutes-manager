// ---------------------------------------------------------------------------
// Sport position sets, default starting line-ups, and formation coordinates.
// Coordinates are on a 0..100 grid. For each sport, y=0 is the TOP of the
// pitch/court as drawn and y=100 is the BOTTOM (where "our" goal/basket sits),
// so our defenders sit low (high y) and attackers sit high (low y).
// x=0 is left, x=100 is right.
// ---------------------------------------------------------------------------

// ---- BASKETBALL ----
// Loose positions. Default starting 5: 2 guards, 2 forwards, 1 centre.
const BASKETBALL = {
  positions: ["PG", "SG", "SF", "PF", "C", "Guard", "Forward", "Centre"],
  onCourt: 5,
  periods: { count: 4, label: "Quarters", minutes: 10 },
  // starting slots, in order, with court coords
  starters: [
    { pos: "Guard", x: 30, y: 78 },
    { pos: "Guard", x: 70, y: 78 },
    { pos: "Forward", x: 20, y: 40 },
    { pos: "Forward", x: 80, y: 40 },
    { pos: "Centre", x: 50, y: 22 },
  ],
  court: "basketball",
};

// ---- NETBALL ----
// 7 on court, fixed positions. GS/GA attack, WA/C/WD mid, GD/GK defend.
const NETBALL = {
  positions: ["GS", "GA", "WA", "C", "WD", "GD", "GK"],
  onCourt: 7,
  periods: { count: 4, label: "Quarters", minutes: 15 },
  starters: [
    { pos: "GS", x: 50, y: 12 },
    { pos: "GA", x: 32, y: 24 },
    { pos: "WA", x: 60, y: 38 },
    { pos: "C", x: 50, y: 50 },
    { pos: "WD", x: 40, y: 62 },
    { pos: "GD", x: 68, y: 76 },
    { pos: "GK", x: 50, y: 88 },
  ],
  court: "netball",
};

// ---- AFL ----
// 18 on field. Standard line set-up: back line, half-back, centre line,
// half-forward, forward line, plus ruck/rover/rover in the middle.
const AFL = {
  positions: [
    "FB", "BP", "HBF", "Wing", "C", "R", "RR", "Rov", "HFF", "FP", "FF",
    "Full Back", "Back Pocket", "Half Back Flank", "Centre Half Back",
    "Centre Half Forward", "Half Forward Flank", "Forward Pocket", "Full Forward",
    "Ruck", "Ruck Rover", "Rover", "Midfield",
  ],
  onCourt: 18,
  periods: { count: 4, label: "Quarters", minutes: 20 },
  // 18 players: full-back line (3), half-back line (3), centre line (3 + ruck/rovers),
  // half-forward line (3), full-forward line (3). Laid out top=attack, bottom=defence.
  starters: [
    // Full forward line (attack, top)
    { pos: "Forward Pocket", x: 22, y: 8 },
    { pos: "Full Forward", x: 50, y: 6 },
    { pos: "Forward Pocket", x: 78, y: 8 },
    // Half forward line
    { pos: "Half Forward Flank", x: 20, y: 26 },
    { pos: "Centre Half Forward", x: 50, y: 24 },
    { pos: "Half Forward Flank", x: 80, y: 26 },
    // Centre square: wings wide, on-ballers (ruck/rover/ruck-rover) in a row,
    // centre player below them.
    { pos: "Wing", x: 12, y: 46 },
    { pos: "Rover", x: 34, y: 46 },
    { pos: "Ruck", x: 50, y: 44 },
    { pos: "Ruck Rover", x: 66, y: 46 },
    { pos: "Wing", x: 88, y: 46 },
    { pos: "Centre", x: 50, y: 60 },
    // Half back line
    { pos: "Half Back Flank", x: 20, y: 74 },
    { pos: "Centre Half Back", x: 50, y: 76 },
    { pos: "Half Back Flank", x: 80, y: 74 },
    // Full back line (defence, bottom)
    { pos: "Back Pocket", x: 22, y: 92 },
    { pos: "Full Back", x: 50, y: 94 },
    { pos: "Back Pocket", x: 78, y: 92 },
  ],
  court: "afl",
};

// ---- SOCCER ----
// Position vocabulary (FC-style).
const SOCCER_POSITIONS = [
  "GK", "RB", "RWB", "CB", "LB", "LWB",
  "CDM", "CM", "RM", "LM", "CAM",
  "RW", "LW", "CF", "ST",
];

// FC26 formations (from fifplay.com/fc-26/formations). Each lists 11 slots with
// coords. Defence at bottom (high y), attack at top (low y). Variants that only
// change player instructions but share an on-pitch shape are folded together;
// genuinely different shapes (narrow/wide/flat) are kept separate.
// Defence rows: D5 = back five, D3 = back three, D4 = back four.
const GK = { pos: "GK", x: 50, y: 99 };
const D4 = [
  { pos: "LB", x: 16, y: 76 }, { pos: "CB", x: 38, y: 80 }, { pos: "CB", x: 62, y: 80 }, { pos: "RB", x: 84, y: 76 },
];
const D3 = [
  { pos: "CB", x: 30, y: 80 }, { pos: "CB", x: 50, y: 80 }, { pos: "CB", x: 70, y: 80 },
];
const D5 = [
  { pos: "LWB", x: 12, y: 62 }, { pos: "CB", x: 30, y: 80 }, { pos: "CB", x: 50, y: 80 }, { pos: "CB", x: 70, y: 80 }, { pos: "RWB", x: 88, y: 62 },
];

const SOCCER_FORMATIONS = {
  // ---- 4 at the back ----
  "4-4-2": [GK, ...D4,
    { pos: "LM", x: 16, y: 48 }, { pos: "CM", x: 38, y: 52 }, { pos: "CM", x: 62, y: 52 }, { pos: "RM", x: 84, y: 48 },
    { pos: "ST", x: 38, y: 18 }, { pos: "ST", x: 62, y: 18 }],
  "4-4-2 (2)": [GK, ...D4,
    { pos: "LM", x: 16, y: 50 }, { pos: "CM", x: 38, y: 56 }, { pos: "CM", x: 62, y: 56 }, { pos: "RM", x: 84, y: 50 },
    { pos: "ST", x: 38, y: 20 }, { pos: "ST", x: 62, y: 20 }],
  "4-3-3": [GK, ...D4,
    { pos: "CM", x: 30, y: 52 }, { pos: "CM", x: 50, y: 56 }, { pos: "CM", x: 70, y: 52 },
    { pos: "LW", x: 18, y: 22 }, { pos: "ST", x: 50, y: 16 }, { pos: "RW", x: 82, y: 22 }],
  "4-3-3 (Holding)": [GK, ...D4,
    { pos: "CDM", x: 50, y: 58 }, { pos: "CM", x: 30, y: 48 }, { pos: "CM", x: 70, y: 48 },
    { pos: "LW", x: 18, y: 22 }, { pos: "ST", x: 50, y: 16 }, { pos: "RW", x: 82, y: 22 }],
  "4-3-3 (Defend)": [GK, ...D4,
    { pos: "CDM", x: 34, y: 58 }, { pos: "CDM", x: 66, y: 58 }, { pos: "CM", x: 50, y: 48 },
    { pos: "LW", x: 18, y: 24 }, { pos: "ST", x: 50, y: 16 }, { pos: "RW", x: 82, y: 24 }],
  "4-2-3-1": [GK, ...D4,
    { pos: "CDM", x: 38, y: 58 }, { pos: "CDM", x: 62, y: 58 },
    { pos: "LM", x: 20, y: 34 }, { pos: "CAM", x: 50, y: 32 }, { pos: "RM", x: 80, y: 34 },
    { pos: "ST", x: 50, y: 12 }],
  "4-2-3-1 (Wide)": [GK, ...D4,
    { pos: "CDM", x: 38, y: 60 }, { pos: "CDM", x: 62, y: 60 },
    { pos: "LW", x: 16, y: 34 }, { pos: "CAM", x: 50, y: 32 }, { pos: "RW", x: 84, y: 34 },
    { pos: "ST", x: 50, y: 12 }],
  "4-2-1-3": [GK, ...D4,
    { pos: "CDM", x: 38, y: 58 }, { pos: "CDM", x: 62, y: 58 },
    { pos: "CAM", x: 50, y: 38 },
    { pos: "LW", x: 18, y: 18 }, { pos: "ST", x: 50, y: 14 }, { pos: "RW", x: 82, y: 18 }],
  "4-2-2-2": [GK, ...D4,
    { pos: "CDM", x: 38, y: 58 }, { pos: "CDM", x: 62, y: 58 },
    { pos: "CAM", x: 30, y: 34 }, { pos: "CAM", x: 70, y: 34 },
    { pos: "ST", x: 38, y: 14 }, { pos: "ST", x: 62, y: 14 }],
  "4-2-4": [GK, ...D4,
    { pos: "CM", x: 36, y: 52 }, { pos: "CM", x: 64, y: 52 },
    { pos: "LW", x: 16, y: 20 }, { pos: "ST", x: 40, y: 16 }, { pos: "ST", x: 60, y: 16 }, { pos: "RW", x: 84, y: 20 }],
  "4-1-2-1-2": [GK, ...D4,
    { pos: "CDM", x: 50, y: 62 },
    { pos: "CM", x: 28, y: 46 }, { pos: "CM", x: 72, y: 46 },
    { pos: "CAM", x: 50, y: 32 },
    { pos: "ST", x: 38, y: 14 }, { pos: "ST", x: 62, y: 14 }],
  "4-1-2-1-2 (Wide)": [GK, ...D4,
    { pos: "CDM", x: 50, y: 62 },
    { pos: "LM", x: 16, y: 44 }, { pos: "RM", x: 84, y: 44 },
    { pos: "CAM", x: 50, y: 32 },
    { pos: "ST", x: 38, y: 14 }, { pos: "ST", x: 62, y: 14 }],
  "4-1-3-2": [GK, ...D4,
    { pos: "CDM", x: 50, y: 62 },
    { pos: "LM", x: 18, y: 46 }, { pos: "CM", x: 50, y: 48 }, { pos: "RM", x: 82, y: 46 },
    { pos: "ST", x: 38, y: 16 }, { pos: "ST", x: 62, y: 16 }],
  "4-1-4-1": [GK, ...D4,
    { pos: "CDM", x: 50, y: 62 },
    { pos: "LM", x: 14, y: 44 }, { pos: "CM", x: 38, y: 46 }, { pos: "CM", x: 62, y: 46 }, { pos: "RM", x: 86, y: 44 },
    { pos: "ST", x: 50, y: 16 }],
  "4-3-1-2": [GK, ...D4,
    { pos: "CM", x: 28, y: 56 }, { pos: "CM", x: 50, y: 58 }, { pos: "CM", x: 72, y: 56 },
    { pos: "CAM", x: 50, y: 34 },
    { pos: "ST", x: 38, y: 14 }, { pos: "ST", x: 62, y: 14 }],
  "4-3-2-1": [GK, ...D4,
    { pos: "CM", x: 28, y: 54 }, { pos: "CM", x: 50, y: 58 }, { pos: "CM", x: 72, y: 54 },
    { pos: "CF", x: 34, y: 30 }, { pos: "CF", x: 66, y: 30 },
    { pos: "ST", x: 50, y: 12 }],
  "4-4-1-1": [GK, ...D4,
    { pos: "LM", x: 16, y: 50 }, { pos: "CM", x: 38, y: 54 }, { pos: "CM", x: 62, y: 54 }, { pos: "RM", x: 84, y: 50 },
    { pos: "CF", x: 50, y: 30 }, { pos: "ST", x: 50, y: 12 }],
  "4-5-1": [GK, ...D4,
    { pos: "LM", x: 12, y: 48 }, { pos: "CM", x: 32, y: 52 }, { pos: "CM", x: 50, y: 54 }, { pos: "CM", x: 68, y: 52 }, { pos: "RM", x: 88, y: 48 },
    { pos: "ST", x: 50, y: 16 }],
  "4-5-1 (Attack)": [GK, ...D4,
    { pos: "LM", x: 12, y: 44 }, { pos: "CM", x: 34, y: 50 }, { pos: "CAM", x: 50, y: 40 }, { pos: "CM", x: 66, y: 50 }, { pos: "RM", x: 88, y: 44 },
    { pos: "ST", x: 50, y: 14 }],
  // ---- 3 at the back ----
  "3-4-3": [GK, ...D3,
    { pos: "LM", x: 14, y: 50 }, { pos: "CM", x: 38, y: 54 }, { pos: "CM", x: 62, y: 54 }, { pos: "RM", x: 86, y: 50 },
    { pos: "LW", x: 22, y: 20 }, { pos: "ST", x: 50, y: 16 }, { pos: "RW", x: 78, y: 20 }],
  "3-4-2-1": [GK, ...D3,
    { pos: "LM", x: 14, y: 52 }, { pos: "CM", x: 38, y: 56 }, { pos: "CM", x: 62, y: 56 }, { pos: "RM", x: 86, y: 52 },
    { pos: "CF", x: 34, y: 28 }, { pos: "CF", x: 66, y: 28 }, { pos: "ST", x: 50, y: 14 }],
  "3-4-1-2": [GK, ...D3,
    { pos: "LM", x: 14, y: 52 }, { pos: "CM", x: 38, y: 56 }, { pos: "CM", x: 62, y: 56 }, { pos: "RM", x: 86, y: 52 },
    { pos: "CAM", x: 50, y: 34 },
    { pos: "ST", x: 38, y: 14 }, { pos: "ST", x: 62, y: 14 }],
  "3-1-4-2": [GK, ...D3,
    { pos: "CDM", x: 50, y: 64 },
    { pos: "LM", x: 14, y: 46 }, { pos: "CM", x: 38, y: 48 }, { pos: "CM", x: 62, y: 48 }, { pos: "RM", x: 86, y: 46 },
    { pos: "ST", x: 38, y: 16 }, { pos: "ST", x: 62, y: 16 }],
  "3-5-2": [GK, ...D3,
    { pos: "LWB", x: 10, y: 54 }, { pos: "CM", x: 34, y: 56 }, { pos: "CM", x: 50, y: 58 }, { pos: "CM", x: 66, y: 56 }, { pos: "RWB", x: 90, y: 54 },
    { pos: "ST", x: 38, y: 18 }, { pos: "ST", x: 62, y: 18 }],
  // ---- 5 at the back ----
  "5-3-2": [GK, ...D5,
    { pos: "CM", x: 30, y: 52 }, { pos: "CM", x: 50, y: 56 }, { pos: "CM", x: 70, y: 52 },
    { pos: "ST", x: 38, y: 18 }, { pos: "ST", x: 62, y: 18 }],
  "5-2-1-2": [GK, ...D5,
    { pos: "CM", x: 36, y: 54 }, { pos: "CM", x: 64, y: 54 },
    { pos: "CAM", x: 50, y: 34 },
    { pos: "ST", x: 38, y: 16 }, { pos: "ST", x: 62, y: 16 }],
  "5-2-3": [GK, ...D5,
    { pos: "CM", x: 36, y: 54 }, { pos: "CM", x: 64, y: 54 },
    { pos: "LW", x: 20, y: 20 }, { pos: "ST", x: 50, y: 16 }, { pos: "RW", x: 80, y: 20 }],
  "5-4-1": [GK, ...D5,
    { pos: "LM", x: 16, y: 48 }, { pos: "CM", x: 38, y: 52 }, { pos: "CM", x: 62, y: 52 }, { pos: "RM", x: 84, y: 48 },
    { pos: "ST", x: 50, y: 18 }],
};

const SOCCER = {
  positions: SOCCER_POSITIONS,
  onCourt: 11,
  periods: { count: 2, label: "Halves", minutes: 45 },
  defaultFormation: "4-4-2",
  formations: SOCCER_FORMATIONS,
  starters: SOCCER_FORMATIONS["4-4-2"],
  court: "soccer",
};

export const SPORTS = {
  Basketball: BASKETBALL,
  Soccer: SOCCER,
  AFL: AFL,
  Netball: NETBALL,
};

export const ACCENT = {
  Basketball: "#E8732C",
  Soccer: "#2E8B57",
  AFL: "#C2384A",
  Netball: "#7A4FC2",
};

export function startersFor(sport, formation) {
  const s = SPORTS[sport];
  if (sport === "Soccer" && formation && s.formations[formation]) {
    return s.formations[formation];
  }
  return s.starters;
}

export const periodLabel = (sport, count) => {
  switch (count) {
    case 1: return "Match";
    case 2: return "Halves";
    case 3: return "Thirds";
    case 4: return "Quarters";
    default: return "Periods";
  }
};

// Short codes for crowded pitch tokens (AFL full names are too long to fit).
export const shortPos = (pos) => {
  const map = {
    "Forward Pocket": "FP", "Full Forward": "FF", "Half Forward Flank": "HFF",
    "Centre Half Forward": "CHF", "Centre Half Back": "CHB", "Half Back Flank": "HBF",
    "Back Pocket": "BP", "Full Back": "FB", "Ruck Rover": "RR", "Rover": "Rov",
    "Ruck": "Ruck", "Wing": "Wing", "Centre": "C", "Midfield": "Mid",
  };
  return map[pos] || pos;
};

export const startCallLabel = (sport) => {
  switch (sport) {
    case "Basketball": return "Tip off";
    case "Soccer": return "Kick off";
    case "AFL": return "First bounce";
    case "Netball": return "Centre pass";
    default: return "Start";
  }
};

// What the playing surface is called per sport ("on pitch", "on oval", etc.)
export const onSurfaceLabel = (sport) => {
  switch (sport) {
    case "Soccer": return "On pitch";
    case "AFL": return "On oval";
    case "Netball": return "On court";
    case "Basketball": return "On court";
    default: return "On court";
  }
};

// Only soccer and AFL get the formation/field view; basketball and netball are
// list-only.
export const hasFormationView = (sport) => sport === "Soccer" || sport === "AFL";
