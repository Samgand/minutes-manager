import React, { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Trash2, Users, Clock, ChevronDown, ChevronRight, Lock, Unlock, RotateCcw, ChevronLeft } from "lucide-react";

// ---- Sport presets ----
const SPORTS = {
  Basketball: {
    positions: ["Guard", "Forward", "Centre"],
    onCourt: 5,
    periods: { count: 4, label: "Quarters", minutes: 10 },
  },
  Soccer: {
    positions: ["GK", "CB", "RB", "LB", "CM", "CDM", "RM", "LM", "CAM", "CF", "LW", "RW", "ST"],
    onCourt: 11,
    periods: { count: 2, label: "Halves", minutes: 45 },
  },
  AFL: {
    positions: ["Ruck", "Ruck Rover", "Rover", "Midfield", "Wing", "Half Back Flank", "Back Pocket", "Full Back", "Centre Half Back", "Centre Half Forward", "Half Forward Flank", "Forward Pocket", "Full Forward"],
    onCourt: 18,
    periods: { count: 4, label: "Quarters", minutes: 20 },
  },
  Netball: {
    positions: ["GK", "GD", "WD", "C", "WA", "GA", "GS"],
    onCourt: 7,
    periods: { count: 4, label: "Quarters", minutes: 15 },
  },
  Volleyball: {
    positions: ["Setter", "Outside Hitter", "Opposite", "Middle Blocker", "Libero", "Defensive Specialist"],
    onCourt: 6,
    periods: { count: 5, label: "Sets", minutes: 25 },
  },
};

const ACCENT = {
  Basketball: "#E8732C",
  Soccer: "#2E8B57",
  AFL: "#C2384A",
  Netball: "#7A4FC2",
  Volleyball: "#1F86C4",
};

// Period label that adapts to how many periods there are.
// Volleyball always uses "Sets"; everything else maps by count.
const periodLabel = (sport, count) => {
  if (sport === "Volleyball") return count === 1 ? "Set" : "Sets";
  switch (count) {
    case 1: return "Match";
    case 2: return "Halves";
    case 3: return "Thirds";
    case 4: return "Quarters";
    default: return "Periods";
  }
};

const STORAGE_KEY = "minutesManager.teams.v1";

let pid = 0;
const uid = () => `${Date.now()}-${++pid}`;

const newPlayer = (name = "", positions = []) => ({
  id: uid(),
  name,
  height: "",
  positions,
  minutes: 0,
  locked: false,
});

const seedRoster = (sportKey) => {
  const n = SPORTS[sportKey].onCourt;
  return Array.from({ length: n }, (_, i) => newPlayer(`Player ${i + 1}`));
};

const newTeam = (sport = "Basketball", name = "") => {
  const preset = SPORTS[sport];
  return {
    id: uid(),
    name: name || `${sport} team`,
    sport,
    periodCount: preset.periods.count,
    periodLen: preset.periods.minutes,
    onCourt: preset.onCourt,
    players: seedRoster(sport),
  };
};

// ---- Load / save ----
function loadTeams() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.teams) && parsed.teams.length) return parsed;
  } catch (e) {
    console.warn("Could not load saved teams:", e);
  }
  return null;
}

export default function MinutesManager() {
  const initial = useMemo(() => loadTeams(), []);
  const [teams, setTeams] = useState(() => initial?.teams || [newTeam("Basketball")]);
  const [activeId, setActiveId] = useState(() => initial?.activeId || null);
  const [showTeamList, setShowTeamList] = useState(false);

  // ensure activeId is valid
  const active = teams.find((t) => t.id === activeId) || teams[0];
  useEffect(() => {
    if (active && active.id !== activeId) setActiveId(active.id);
  }, [active, activeId]);

  // ---- persist ----
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ teams, activeId: active?.id }));
    } catch (e) {
      console.warn("Could not save:", e);
    }
  }, [teams, active]);

  const preset = SPORTS[active.sport];
  const accent = ACCENT[active.sport];

  const patchTeam = (patch) =>
    setTeams((ts) => ts.map((t) => (t.id === active.id ? { ...t, ...patch } : t)));

  const setPlayers = (updater) =>
    setTeams((ts) =>
      ts.map((t) => (t.id === active.id ? { ...t, players: typeof updater === "function" ? updater(t.players) : updater } : t))
    );

  const players = active.players;
  // While a config box is being cleared it can briefly hold "". Treat that as 1
  // for the math, without overwriting what the user is typing.
  const nPeriods = active.periodCount === "" || !active.periodCount ? 1 : active.periodCount;
  const nLen = active.periodLen === "" || !active.periodLen ? 1 : active.periodLen;
  const nCourt = active.onCourt === "" || !active.onCourt ? 1 : active.onCourt;
  const matchMinutes = nPeriods * nLen;
  const totalAvailable = matchMinutes * nCourt;
  const totalAssigned = players.reduce((s, p) => s + p.minutes, 0);
  const remaining = totalAvailable - totalAssigned;
  const balanced = Math.abs(remaining) < 0.5;

  const [expanded, setExpanded] = useState({});

  // ---- switch sport for the active team ----
  const changeSport = (sport) => {
    const p = SPORTS[sport];
    patchTeam({
      sport,
      periodCount: p.periods.count,
      periodLen: p.periods.minutes,
      onCourt: p.onCourt,
      players: seedRoster(sport),
      name: active.name && !Object.keys(SPORTS).some((s) => active.name === `${s} team`) ? active.name : `${sport} team`,
    });
  };

  // ---- minutes redistribution ----
  const setMinutes = (id, value) => {
    setPlayers((ps) => {
      const target = ps.find((p) => p.id === id);
      if (!target) return ps;

      // Hard ceiling: a player can't hold more than a full match...
      let capped = Math.max(0, Math.min(matchMinutes, value));

      // ...and the whole squad can't be assigned more than exists.
      // Minutes held by everyone except this player:
      const othersTotal = ps.filter((p) => p.id !== id).reduce((s, p) => s + p.minutes, 0);
      // The most this player may hold so the team total stays within budget:
      const roomLeft = Math.max(0, totalAvailable - othersTotal);
      capped = Math.min(capped, roomLeft);

      const delta = capped - target.minutes;
      if (Math.abs(delta) < 0.001) {
        // value unchanged after capping; still write the clamped number
        return ps.map((p) => (p.id === id ? { ...p, minutes: Math.round(capped * 10) / 10 } : p));
      }

      // When lowering a player, the freed minutes just become available again
      // (they don't get force-fed to others). When raising, we pull from the
      // free pool first, then from unlocked others if needed.
      const others = ps.filter((p) => p.id !== id && !p.locked);
      const next = ps.map((p) => (p.id === id ? { ...p, minutes: capped } : p));

      // free pool currently unassigned
      const assignedAfter = next.reduce((s, p) => s + p.minutes, 0);
      let overflow = assignedAfter - totalAvailable; // >0 means we must pull from others

      for (let iter = 0; iter < 50 && overflow > 0.001; iter++) {
        const pool = others.filter((p) => next.find((n) => n.id === p.id).minutes > 0);
        if (pool.length === 0) break;
        const share = overflow / pool.length;
        for (const o of pool) {
          const n = next.find((x) => x.id === o.id);
          const before = n.minutes;
          n.minutes = Math.max(0, before - share);
          overflow -= before - n.minutes;
        }
      }
      return next.map((p) => ({ ...p, minutes: Math.round(p.minutes * 10) / 10 }));
    });
  };

  const distributeEven = () => {
    setPlayers((ps) => {
      const locked = ps.filter((p) => p.locked);
      const lockedTotal = locked.reduce((s, p) => s + p.minutes, 0);
      const unlocked = ps.filter((p) => !p.locked);
      const pool = totalAvailable - lockedTotal;
      const each = unlocked.length ? Math.min(matchMinutes, pool / unlocked.length) : 0;
      return ps.map((p) => (p.locked ? p : { ...p, minutes: Math.round(each * 10) / 10 }));
    });
  };

  const clearAll = () => setPlayers((ps) => ps.map((p) => ({ ...p, minutes: 0, locked: false })));

  const updatePlayer = (id, patch) => setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const togglePosition = (id, pos) =>
    setPlayers((ps) =>
      ps.map((p) =>
        p.id === id
          ? { ...p, positions: p.positions.includes(pos) ? p.positions.filter((x) => x !== pos) : [...p.positions, pos] }
          : p
      )
    );
  const addPlayer = () => setPlayers((ps) => [...ps, newPlayer(`Player ${ps.length + 1}`)]);
  const removePlayer = (id) => setPlayers((ps) => ps.filter((p) => p.id !== id));

  // ---- team management ----
  const addTeam = () => {
    const t = newTeam("Basketball");
    setTeams((ts) => [...ts, t]);
    setActiveId(t.id);
    setShowTeamList(false);
  };
  const deleteTeam = (id) => {
    setTeams((ts) => {
      const remaining = ts.filter((t) => t.id !== id);
      if (remaining.length === 0) {
        const t = newTeam("Basketball");
        setActiveId(t.id);
        return [t];
      }
      if (id === active.id) setActiveId(remaining[0].id);
      return remaining;
    });
  };

  const fmt = (m) => {
    const mm = Math.floor(m);
    const ss = Math.round((m - mm) * 60);
    return ss === 0 ? `${mm}` : `${mm}:${String(ss).padStart(2, "0")}`;
  };

  return (
    <div style={styles.page}>
      <style>{globalCss(accent)}</style>

      {/* ---- Team switcher bar ---- */}
      <div style={styles.teamBar}>
        <button onClick={() => setShowTeamList((v) => !v)} className="teamSwitch" style={styles.teamSwitch}>
          <Users size={15} />
          <span style={styles.teamSwitchName}>{active.name}</span>
          <ChevronDown size={15} style={{ transform: showTeamList ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
        </button>
        <span style={styles.teamCount}>{teams.length} {teams.length === 1 ? "team" : "teams"}</span>
      </div>

      {showTeamList && (
        <div style={styles.teamMenu}>
          {teams.map((t) => (
            <div key={t.id} style={{ ...styles.teamMenuRow, ...(t.id === active.id ? { background: `${ACCENT[t.sport]}12` } : {}) }}>
              <button
                onClick={() => { setActiveId(t.id); setShowTeamList(false); }}
                style={styles.teamMenuPick}
              >
                <span style={{ ...styles.teamDot, background: ACCENT[t.sport] }} />
                <span style={styles.teamMenuLabel}>{t.name}</span>
                <span style={styles.teamMenuSport}>{t.sport}</span>
              </button>
              <button onClick={() => deleteTeam(t.id)} className="iconBtn" style={styles.iconBtn} title="Delete team">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button onClick={addTeam} className="addBtn" style={{ ...styles.addBtn, marginTop: 6 }}>
            <Plus size={15} /> New team
          </button>
        </div>
      )}

      {/* ---- Header ---- */}
      <header style={styles.header}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.kicker}>Team minutes manager</div>
          <input
            value={active.name}
            onChange={(e) => patchTeam({ name: e.target.value })}
            style={styles.title}
            aria-label="Team name"
          />
        </div>
        <div style={styles.sportTabs}>
          {Object.keys(SPORTS).map((s) => (
            <button
              key={s}
              onClick={() => changeSport(s)}
              className="sportTab"
              style={{
                ...styles.sportTab,
                ...(s === active.sport ? { background: ACCENT[s], color: "#fff", borderColor: ACCENT[s] } : {}),
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      {/* ---- Match config ---- */}
      <section style={styles.configBar}>
        <div style={styles.configItem}>
          <label style={styles.cfgLabel}>{periodLabel(active.sport, active.periodCount)}</label>
          <input type="number" inputMode="numeric" min={1} max={12}
            value={active.periodCount === "" ? "" : active.periodCount}
            onChange={(e) => {
              const v = e.target.value;
              patchTeam({ periodCount: v === "" ? "" : Math.min(12, Math.max(0, +v)) });
            }}
            onBlur={(e) => {
              const v = +e.target.value;
              patchTeam({ periodCount: !v || v < 1 ? 1 : Math.min(12, v) });
            }}
            style={styles.numInput} />
        </div>
        <div style={styles.configItem}>
          <label style={styles.cfgLabel}>Mins each</label>
          <input type="number" inputMode="numeric" min={1} max={120}
            value={active.periodLen === "" ? "" : active.periodLen}
            onChange={(e) => {
              const v = e.target.value;
              patchTeam({ periodLen: v === "" ? "" : Math.min(120, Math.max(0, +v)) });
            }}
            onBlur={(e) => {
              const v = +e.target.value;
              patchTeam({ periodLen: !v || v < 1 ? 1 : Math.min(120, v) });
            }}
            style={styles.numInput} />
        </div>
        <div style={styles.configItem}>
          <label style={styles.cfgLabel}>On court</label>
          <input type="number" inputMode="numeric" min={1} max={18}
            value={active.onCourt === "" ? "" : active.onCourt}
            onChange={(e) => {
              const v = e.target.value;
              patchTeam({ onCourt: v === "" ? "" : Math.min(18, Math.max(0, +v)) });
            }}
            onBlur={(e) => {
              const v = +e.target.value;
              patchTeam({ onCourt: !v || v < 1 ? 1 : Math.min(18, v) });
            }}
            style={styles.numInput} />
        </div>
        <div style={styles.configReadout}>
          <div style={styles.bigStat}>{matchMinutes}<span style={styles.statUnit}>min match</span></div>
          <div style={styles.bigStat}>{totalAvailable}<span style={styles.statUnit}>player-mins to fill</span></div>
        </div>
      </section>

      {/* ---- Balance bar ---- */}
      <div style={{ ...styles.balanceBar, background: balanced ? "rgba(46,139,87,.1)" : "rgba(194,56,74,.08)" }}>
        <div style={styles.balanceLeft}>
          <span style={{ ...styles.balanceDot, background: balanced ? "#2E8B57" : accent }} />
          {balanced ? (
            <span style={styles.balanceText}>Minutes balanced. Every court slot is filled.</span>
          ) : remaining > 0 ? (
            <span style={styles.balanceText}><strong>{fmt(remaining)}</strong> player-minutes unassigned. Slide players up to fill the bench gap.</span>
          ) : (
            <span style={styles.balanceText}>Over by <strong>{fmt(-remaining)}</strong> player-minutes. You've assigned more court time than exists.</span>
          )}
        </div>
        <div style={styles.balanceActions}>
          <button onClick={distributeEven} className="ghostBtn" style={styles.ghostBtn}>Even split</button>
          <button onClick={clearAll} className="ghostBtn" style={styles.ghostBtn}><RotateCcw size={13} /> Reset</button>
        </div>
      </div>

      {/* ---- Players ---- */}
      <section style={styles.players}>
        {players.map((p) => {
          const pct = matchMinutes ? (p.minutes / matchMinutes) * 100 : 0;
          const isOpen = expanded[p.id];
          return (
            <div key={p.id} style={{ ...styles.card, ...(p.locked ? { borderColor: accent } : {}) }}>
              <div style={styles.cardTop}>
                <button onClick={() => setExpanded((e) => ({ ...e, [p.id]: !e[p.id] }))} style={styles.chevBtn} aria-label="Toggle details">
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <input value={p.name} onChange={(e) => updatePlayer(p.id, { name: e.target.value })} placeholder="Player name" style={styles.nameInput} />
                <div className="posTags" style={styles.posTags}>
                  {p.positions.length ? (
                    p.positions.map((pos) => (
                      <span key={pos} style={{ ...styles.posTag, background: `${accent}1a`, color: accent }}>{pos}</span>
                    ))
                  ) : (
                    <span style={styles.posTagMuted}>No position set</span>
                  )}
                </div>
                <div style={styles.minutesReadout}>
                  <span style={{ ...styles.minutesBig, color: accent }}>{fmt(p.minutes)}</span>
                  <span style={styles.minutesUnit}>min</span>
                </div>
                <button onClick={() => updatePlayer(p.id, { locked: !p.locked })} className="iconBtn"
                  style={{ ...styles.iconBtn, ...(p.locked ? { color: accent } : {}) }}
                  title={p.locked ? "Unlock minutes" : "Lock minutes"}>
                  {p.locked ? <Lock size={15} /> : <Unlock size={15} />}
                </button>
                <button onClick={() => removePlayer(p.id)} className="iconBtn" style={styles.iconBtn} title="Remove player">
                  <Trash2 size={15} />
                </button>
              </div>

              <div style={styles.sliderRow}>
                <input type="range" min={0} max={matchMinutes} step={0.5} value={p.minutes} disabled={p.locked}
                  onChange={(e) => setMinutes(p.id, +e.target.value)} className="mSlider"
                  style={{ ...styles.slider, background: `linear-gradient(to right, ${accent} ${pct}%, #e6e3dd ${pct}%)`, opacity: p.locked ? 0.5 : 1 }} />
              </div>

              {isOpen && (
                <div style={styles.details}>
                  <div style={styles.detailField}>
                    <label style={styles.detailLabel}>Height</label>
                    <input value={p.height} onChange={(e) => updatePlayer(p.id, { height: e.target.value })}
                      placeholder={'e.g. 188cm or 6\'2"'} style={styles.detailInput} />
                  </div>
                  <div style={styles.detailFieldWide}>
                    <label style={styles.detailLabel}>Preferred positions</label>
                    <div style={styles.posPicker}>
                      {preset.positions.map((pos) => {
                        const on = p.positions.includes(pos);
                        return (
                          <button key={pos} onClick={() => togglePosition(p.id, pos)}
                            style={{ ...styles.posChip, ...(on ? { background: accent, color: "#fff", borderColor: accent } : {}) }}>
                            {pos}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <button onClick={addPlayer} className="addBtn" style={styles.addBtn}>
          <Plus size={16} /> Add player
        </button>
      </section>

      <footer style={styles.footer}>
        <span><Users size={13} style={{ verticalAlign: "-2px" }} /> {players.length} players</span>
        <span><Clock size={13} style={{ verticalAlign: "-2px" }} /> {fmt(totalAssigned)} / {totalAvailable} player-mins assigned</span>
      </footer>
    </div>
  );
}

const globalCss = (accent) => `
  .teamSwitch:hover, .sportTab:hover { border-color: ${accent}; }
  .ghostBtn:hover { background: rgba(0,0,0,.05); }
  .iconBtn:hover { background: rgba(0,0,0,.06); }
  .addBtn:hover { border-color: ${accent}; color: ${accent}; }
  .mSlider { -webkit-appearance: none; appearance: none; height: 8px; border-radius: 99px; outline: none; cursor: pointer; }
  .mSlider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 24px; height: 24px; border-radius: 50%; background: #fff; border: 3px solid ${accent}; cursor: grab; box-shadow: 0 1px 4px rgba(0,0,0,.2); }
  .mSlider::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.1); }
  .mSlider::-moz-range-thumb { width: 24px; height: 24px; border-radius: 50%; background: #fff; border: 3px solid ${accent}; cursor: grab; }
  .mSlider:disabled::-webkit-slider-thumb { cursor: not-allowed; }
  input:focus-visible, button:focus-visible { outline: 2px solid ${accent}; outline-offset: 1px; }
  @media (max-width: 640px) { .posTags { display: none !important; } }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

const styles = {
  page: { fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", maxWidth: 860, margin: "0 auto", padding: "20px 18px calc(60px + env(safe-area-inset-bottom))", color: "#1a1815", background: "#faf8f4", minHeight: "100vh" },
  teamBar: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 },
  teamSwitch: { display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 13px", fontSize: 14, fontWeight: 700, background: "#fff", border: "1.5px solid #e6e3dd", borderRadius: 10, cursor: "pointer", color: "#1a1815", maxWidth: "75%" },
  teamSwitchName: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  teamCount: { fontSize: 12, color: "#9a948a", fontWeight: 600 },
  teamMenu: { background: "#fff", border: "1px solid #ece9e3", borderRadius: 12, padding: 8, marginBottom: 14, boxShadow: "0 6px 24px rgba(0,0,0,.08)" },
  teamMenuRow: { display: "flex", alignItems: "center", borderRadius: 8 },
  teamMenuPick: { flex: 1, display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", background: "none", border: "none", cursor: "pointer", textAlign: "left", color: "#1a1815" },
  teamDot: { width: 9, height: 9, borderRadius: "50%", flexShrink: 0 },
  teamMenuLabel: { fontSize: 14, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  teamMenuSport: { fontSize: 11.5, color: "#9a948a", fontWeight: 600 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 22 },
  kicker: { fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#9a948a", fontWeight: 600 },
  title: { fontSize: 28, fontWeight: 800, margin: "4px 0 0", letterSpacing: -0.5, border: "none", background: "transparent", padding: 0, width: "100%", color: "#1a1815" },
  sportTabs: { display: "flex", gap: 6, flexWrap: "wrap" },
  sportTab: { padding: "7px 13px", fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: "pointer", background: "#fff", border: "1.5px solid #e6e3dd", color: "#5a554d", transition: "all .12s" },
  configBar: { display: "flex", gap: 22, alignItems: "flex-end", flexWrap: "wrap", background: "#fff", border: "1px solid #ece9e3", borderRadius: 14, padding: "16px 20px", marginBottom: 14 },
  configItem: { display: "flex", flexDirection: "column", gap: 5 },
  cfgLabel: { fontSize: 11, fontWeight: 600, color: "#9a948a", textTransform: "uppercase", letterSpacing: 0.5 },
  numInput: { width: 72, padding: "8px 10px", fontSize: 16, fontWeight: 700, border: "1.5px solid #e6e3dd", borderRadius: 8, background: "#faf8f4" },
  configReadout: { display: "flex", gap: 22, marginLeft: "auto" },
  bigStat: { display: "flex", flexDirection: "column", fontSize: 24, fontWeight: 800, lineHeight: 1 },
  statUnit: { fontSize: 11, fontWeight: 600, color: "#9a948a", marginTop: 3 },
  balanceBar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", borderRadius: 12, padding: "11px 16px", marginBottom: 18 },
  balanceLeft: { display: "flex", alignItems: "center", gap: 10 },
  balanceDot: { width: 9, height: 9, borderRadius: "50%", flexShrink: 0 },
  balanceText: { fontSize: 13.5, color: "#3a362f" },
  balanceActions: { display: "flex", gap: 8 },
  ghostBtn: { display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px", fontSize: 12.5, fontWeight: 600, background: "transparent", border: "1.5px solid #ddd9d2", borderRadius: 7, cursor: "pointer", color: "#5a554d" },
  players: { display: "flex", flexDirection: "column", gap: 10 },
  card: { background: "#fff", border: "1.5px solid #ece9e3", borderRadius: 14, padding: "14px 16px", transition: "border-color .12s" },
  cardTop: { display: "flex", alignItems: "center", gap: 10 },
  chevBtn: { background: "none", border: "none", cursor: "pointer", color: "#9a948a", padding: 2, display: "flex" },
  nameInput: { fontSize: 15.5, fontWeight: 700, border: "none", background: "transparent", width: 130, padding: "2px 0", color: "#1a1815" },
  posTags: { display: "flex", gap: 4, flexWrap: "wrap", flex: 1 },
  posTag: { fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 },
  posTagMuted: { fontSize: 11.5, color: "#bbb5ab", fontStyle: "italic" },
  minutesReadout: { display: "flex", alignItems: "baseline", gap: 3, marginLeft: "auto" },
  minutesBig: { fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums" },
  minutesUnit: { fontSize: 11, fontWeight: 600, color: "#9a948a" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", color: "#aaa49a", padding: 6, borderRadius: 6, display: "flex" },
  sliderRow: { marginTop: 12 },
  slider: { width: "100%", height: 8 },
  details: { display: "flex", gap: 18, marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0ede7", flexWrap: "wrap" },
  detailField: { display: "flex", flexDirection: "column", gap: 6 },
  detailFieldWide: { display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 240 },
  detailLabel: { fontSize: 11, fontWeight: 600, color: "#9a948a", textTransform: "uppercase", letterSpacing: 0.5 },
  detailInput: { padding: "8px 10px", fontSize: 14, border: "1.5px solid #e6e3dd", borderRadius: 8, background: "#faf8f4", width: 150 },
  posPicker: { display: "flex", gap: 6, flexWrap: "wrap" },
  posChip: { fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 7, cursor: "pointer", background: "#faf8f4", border: "1.5px solid #e6e3dd", color: "#5a554d", transition: "all .1s" },
  addBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px", fontSize: 14, fontWeight: 600, background: "#fff", border: "1.5px dashed #d8d4cc", borderRadius: 12, cursor: "pointer", color: "#7a756c", transition: "all .12s", marginTop: 2, width: "100%" },
  footer: { display: "flex", gap: 20, marginTop: 22, fontSize: 12.5, color: "#9a948a", fontWeight: 500 },
};
