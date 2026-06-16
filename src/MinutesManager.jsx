import React, { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Users, Clock, ChevronDown, ChevronRight, Lock, Unlock, RotateCcw, List, LayoutGrid, Check, Pencil } from "lucide-react";
import { SPORTS, ACCENT, startersFor, periodLabel, startCallLabel, onSurfaceLabel, hasFormationView, shortPos } from "./formations.js";
import { CourtBackground } from "./CourtBackground.jsx";

const STORAGE_KEY = "minutesManager.teams.v2";

let pid = 0;
const uid = () => `${Date.now()}-${++pid}`;

const newPlayer = (name = "", pos = "", starter = false) => ({
  id: uid(),
  name,
  height: "",
  pos,
  positions: [],
  starter,
  minutes: 0,
  locked: false,
});

const seedRoster = (sport, formation) => {
  const slots = startersFor(sport, formation);
  return slots.map((slot, i) => newPlayer(`Player ${i + 1}`, slot.pos, true));
};

const newTeam = (sport = "Basketball", name = "") => {
  const preset = SPORTS[sport];
  const formation = sport === "Soccer" ? preset.defaultFormation : null;
  return {
    id: uid(),
    name: name || `${sport} team`,
    sport,
    formation,
    periodCount: preset.periods.count,
    periodLen: preset.periods.minutes,
    onCourt: preset.onCourt,
    players: seedRoster(sport, formation),
  };
};

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

// Name field that behaves like tap-to-edit with a tick to confirm. Defined at
// module scope (stable identity) so re-renders never remount it mid-interaction.
function EditableName({ value, onChange, accent, big }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);
  const commit = () => { onChange(draft.trim() || value); setEditing(false); };
  if (editing) {
    return (
      <span style={styles.nameEditWrap}>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          style={big ? styles.nameInputBig : styles.nameInputEdit}
        />
        <button onClick={commit} className="tickBtn" style={{ ...styles.tickBtn, background: accent }} title="Done" aria-label="Done">
          <Check size={14} color="#fff" />
        </button>
      </span>
    );
  }
  return (
    <button onClick={() => setEditing(true)} className="nameDisplay" style={big ? styles.nameDisplayBig : styles.nameDisplay} title="Edit name">
      <span style={styles.nameText}>{value}</span>
      <Pencil size={12} style={{ opacity: 0.4, flexShrink: 0 }} />
    </button>
  );
}

export default function MinutesManager() {
  const initial = useMemo(() => loadTeams(), []);
  const [teams, setTeams] = useState(() => initial?.teams || [newTeam("Basketball")]);
  const [activeId, setActiveId] = useState(() => initial?.activeId || null);
  const [showTeamList, setShowTeamList] = useState(false);
  const [view, setView] = useState("list");

  const active = teams.find((t) => t.id === activeId) || teams[0];
  useEffect(() => {
    if (active && active.id !== activeId) setActiveId(active.id);
  }, [active, activeId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ teams, activeId: active?.id }));
    } catch (e) {
      console.warn("Could not save:", e);
    }
  }, [teams, active]);

  const preset = SPORTS[active.sport];
  const accent = ACCENT[active.sport];
  const canFormation = hasFormationView(active.sport);

  // If the active sport has no formation view, snap back to list.
  useEffect(() => {
    if (!canFormation && view === "formation") setView("list");
  }, [canFormation, view]);

  const patchTeam = (patch) =>
    setTeams((ts) => ts.map((t) => (t.id === active.id ? { ...t, ...patch } : t)));

  const setPlayers = (updater) =>
    setTeams((ts) =>
      ts.map((t) => (t.id === active.id ? { ...t, players: typeof updater === "function" ? updater(t.players) : updater } : t))
    );

  const players = active.players;
  const starters = players.filter((p) => p.starter);
  const bench = players.filter((p) => !p.starter);

  const nPeriods = !active.periodCount ? 1 : active.periodCount;
  const nLen = !active.periodLen ? 1 : active.periodLen;
  const nCourt = !active.onCourt ? 1 : active.onCourt;
  const matchMinutes = nPeriods * nLen;
  const totalAvailable = matchMinutes * nCourt;
  const totalAssigned = players.reduce((s, p) => s + p.minutes, 0);
  const remaining = totalAvailable - totalAssigned;
  const balanced = Math.abs(remaining) < 0.5;

  const [expanded, setExpanded] = useState({});

  const changeSport = (sport) => {
    const p = SPORTS[sport];
    const formation = sport === "Soccer" ? p.defaultFormation : null;
    patchTeam({
      sport,
      formation,
      periodCount: p.periods.count,
      periodLen: p.periods.minutes,
      onCourt: p.onCourt,
      players: seedRoster(sport, formation),
      name: active.name && !Object.keys(SPORTS).some((s) => active.name === `${s} team`) ? active.name : `${sport} team`,
    });
  };

  const changeFormation = (formation) => {
    const slots = startersFor("Soccer", formation);
    setTeams((ts) =>
      ts.map((t) => {
        if (t.id !== active.id) return t;
        const sList = t.players.filter((p) => p.starter);
        const updatedStarters = sList.map((p, i) => ({ ...p, pos: slots[i] ? slots[i].pos : p.pos }));
        let si = 0;
        const merged = t.players.map((p) => (p.starter ? updatedStarters[si++] : p));
        return { ...t, formation, players: merged };
      })
    );
  };

  const setMinutes = (id, value) => {
    setPlayers((ps) => {
      const target = ps.find((p) => p.id === id);
      if (!target) return ps;
      let capped = Math.max(0, Math.min(matchMinutes, value));
      const othersTotal = ps.filter((p) => p.id !== id).reduce((s, p) => s + p.minutes, 0);
      const roomLeft = Math.max(0, totalAvailable - othersTotal);
      capped = Math.min(capped, roomLeft);

      const others = ps.filter((p) => p.id !== id && !p.locked);
      const next = ps.map((p) => (p.id === id ? { ...p, minutes: capped } : p));
      const assignedAfter = next.reduce((s, p) => s + p.minutes, 0);
      let overflow = assignedAfter - totalAvailable;

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
  const addBench = () => setPlayers((ps) => [...ps, newPlayer(`Bench Player ${ps.filter((x) => !x.starter).length + 1}`, "", false)]);
  const removePlayer = (id) => setPlayers((ps) => ps.filter((p) => p.id !== id));

  const addTeam = () => {
    const t = newTeam("Basketball");
    setTeams((ts) => [...ts, t]);
    setActiveId(t.id);
    setShowTeamList(false);
  };
  const deleteTeam = (id) => {
    setTeams((ts) => {
      const rest = ts.filter((t) => t.id !== id);
      if (rest.length === 0) {
        const t = newTeam("Basketball");
        setActiveId(t.id);
        return [t];
      }
      if (id === active.id) setActiveId(rest[0].id);
      return rest;
    });
  };

  const fmt = (m) => {
    const mm = Math.floor(m);
    const ss = Math.round((m - mm) * 60);
    return ss === 0 ? `${mm}` : `${mm}:${String(ss).padStart(2, "0")}`;
  };

  const PosSelect = ({ value, onChange }) => (
    <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="posSelect" style={styles.posSelect}>
      <option value="">—</option>
      {preset.positions.map((pos) => (
        <option key={pos} value={pos}>{pos}</option>
      ))}
    </select>
  );

  const renderPlayerRow = (p) => {
    const pct = matchMinutes ? (p.minutes / matchMinutes) * 100 : 0;
    const isOpen = expanded[p.id];
    return (
      <div key={p.id} style={{ ...styles.card, ...(p.locked ? { borderColor: accent } : {}) }}>
        <div style={styles.cardTop}>
          <button onClick={() => setExpanded((e) => ({ ...e, [p.id]: !e[p.id] }))} style={styles.chevBtn} aria-label="Toggle details">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <EditableName value={p.name} accent={accent} onChange={(v) => updatePlayer(p.id, { name: v })} />
          <PosSelect value={p.pos} onChange={(v) => updatePlayer(p.id, { pos: v })} />
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
                placeholder={'e.g. 188cm'} style={styles.detailInput} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <style>{globalCss(accent)}</style>

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
              <button onClick={() => { setActiveId(t.id); setShowTeamList(false); }} style={styles.teamMenuPick}>
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

      <header style={styles.header}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.kicker}>Team minutes manager</div>
          <input value={active.name} onChange={(e) => patchTeam({ name: e.target.value })} style={styles.title} aria-label="Team name" />
        </div>
        <div style={styles.sportTabs}>
          {Object.keys(SPORTS).map((s) => (
            <button key={s} onClick={() => changeSport(s)} className="sportTab"
              style={{ ...styles.sportTab, ...(s === active.sport ? { background: ACCENT[s], color: "#fff", borderColor: ACCENT[s] } : {}) }}>
              {s}
            </button>
          ))}
        </div>
      </header>

      <section style={styles.configBar}>
        <div style={styles.configItem}>
          <label style={styles.cfgLabel}>{periodLabel(active.sport, active.periodCount)}</label>
          <input type="number" inputMode="numeric" min={1} max={12} value={active.periodCount === "" ? "" : active.periodCount}
            onChange={(e) => { const v = e.target.value; patchTeam({ periodCount: v === "" ? "" : Math.min(12, Math.max(0, +v)) }); }}
            onBlur={(e) => { const v = +e.target.value; patchTeam({ periodCount: !v || v < 1 ? 1 : Math.min(12, v) }); }}
            style={styles.numInput} />
        </div>
        <div style={styles.configItem}>
          <label style={styles.cfgLabel}>Mins each</label>
          <input type="number" inputMode="numeric" min={1} max={120} value={active.periodLen === "" ? "" : active.periodLen}
            onChange={(e) => { const v = e.target.value; patchTeam({ periodLen: v === "" ? "" : Math.min(120, Math.max(0, +v)) }); }}
            onBlur={(e) => { const v = +e.target.value; patchTeam({ periodLen: !v || v < 1 ? 1 : Math.min(120, v) }); }}
            style={styles.numInput} />
        </div>
        <div style={styles.configItem}>
          <label style={styles.cfgLabel}>{onSurfaceLabel(active.sport)}</label>
          <input type="number" inputMode="numeric" min={1} max={18} value={active.onCourt === "" ? "" : active.onCourt}
            onChange={(e) => { const v = e.target.value; patchTeam({ onCourt: v === "" ? "" : Math.min(18, Math.max(0, +v)) }); }}
            onBlur={(e) => { const v = +e.target.value; patchTeam({ onCourt: !v || v < 1 ? 1 : Math.min(18, v) }); }}
            style={styles.numInput} />
        </div>
        {active.sport === "Soccer" && (
          <div style={styles.configItem}>
            <label style={styles.cfgLabel}>Formation</label>
            <select value={active.formation || "4-4-2"} onChange={(e) => changeFormation(e.target.value)} className="posSelect" style={styles.formationSelect}>
              {Object.keys(preset.formations).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        )}
        <div style={styles.configReadout}>
          <div style={styles.bigStat}>{matchMinutes}<span style={styles.statUnit}>min match</span></div>
          <div style={{ ...styles.bigStat, color: balanced ? "#2E8B57" : remaining < 0 ? "#C2384A" : accent }}>
            <span>{fmt(Math.max(0, remaining))}<span style={styles.statTotal}> / {totalAvailable}</span></span>
            <span style={styles.statUnit}>{balanced ? "all filled" : remaining < 0 ? "over budget" : "mins left to fill"}</span>
          </div>
        </div>
      </section>

      <div style={styles.toolbar}>
        {canFormation ? (
          <div style={styles.viewToggle}>
            <button onClick={() => setView("list")} className="viewBtn"
              style={{ ...styles.viewBtn, ...(view === "list" ? { background: accent, color: "#fff" } : {}) }}>
              <List size={14} /> List
            </button>
            <button onClick={() => setView("formation")} className="viewBtn"
              style={{ ...styles.viewBtn, ...(view === "formation" ? { background: accent, color: "#fff" } : {}) }}>
              <LayoutGrid size={14} /> Formation
            </button>
          </div>
        ) : <div />}
        <div style={styles.balanceActions}>
          <button onClick={distributeEven} className="ghostBtn" style={styles.ghostBtn}>Even split</button>
          <button onClick={clearAll} className="ghostBtn" style={styles.ghostBtn}><RotateCcw size={13} /> Reset</button>
        </div>
      </div>

      {view === "list" && (
        <>
          <div style={styles.sectionLabel}>Starting {starters.length}</div>
          <section style={styles.players}>
            {starters.map((p) => renderPlayerRow(p))}
          </section>

          <div style={{ ...styles.sectionLabel, marginTop: 18 }}>Bench</div>
          <section style={styles.players}>
            {bench.map((p) => renderPlayerRow(p))}
            <button onClick={addBench} className="addBtn" style={styles.addBtn}>
              <Plus size={16} /> Add bench player
            </button>
          </section>
        </>
      )}

      {view === "formation" && (
        <FormationView
          sport={active.sport}
          accent={accent}
          formation={active.formation}
          starters={starters}
          bench={bench}
          matchMinutes={matchMinutes}
          fmt={fmt}
          PosSelect={PosSelect}
          EditableName={EditableName}
          updatePlayer={updatePlayer}
          addBench={addBench}
          removePlayer={removePlayer}
        />
      )}

      <footer style={styles.footer}>
        <span><Users size={13} style={{ verticalAlign: "-2px" }} /> {players.length} players ({starters.length} starting, {bench.length} bench)</span>
        <span><Clock size={13} style={{ verticalAlign: "-2px" }} /> {fmt(totalAssigned)} / {totalAvailable} player-mins assigned</span>
      </footer>

      <div style={styles.gameCentre}>
        <div>
          <div style={styles.gcTitle}>{startCallLabel(active.sport)}</div>
          <div style={styles.gcSub}>Push the game live and get sub alerts — coming soon (premium)</div>
        </div>
        <button disabled style={styles.gcBtn}>{startCallLabel(active.sport)}</button>
      </div>
    </div>
  );
}

function FormationView({ sport, accent, formation, starters, bench, matchMinutes, fmt, PosSelect, EditableName, updatePlayer, addBench, removePlayer }) {
  const slots = startersFor(sport, formation);
  return (
    <div>
      <div style={styles.pitchWrap}>
        <svg viewBox="-3 -3 106 137" style={styles.pitchSvg} preserveAspectRatio="xMidYMid meet">
          <CourtBackground sport={sport} accent={accent} />
          {starters.map((p, i) => {
            const slot = slots[i] || { x: 50, y: 50 };
            // Inset both axes toward centre so no token sits on the boundary.
            const x = 50 + (slot.x - 50) * 0.72;
            // Map into the drawn pitch (y≈2..128) with room for name chips below.
            const y = 10 + (slot.y / 100) * 102;
            const pct = matchMinutes ? Math.min(1, p.minutes / matchMinutes) : 0;
            // AFL packs 18 players tightly, so name chips collide. There we show
            // just the position code + a number, and names live in the cards
            // below. Soccer (11 players) has room for a name chip per token.
            const dense = sport === "AFL";
            const short = p.name.length > 9 ? p.name.slice(0, 8) + "…" : p.name;
            const chipW = Math.max(15, short.length * 1.7 + 4);
            const r = dense ? 4.4 : 5;
            return (
              <g key={p.id} transform={`translate(${x}, ${y})`}>
                <circle r={r} fill="#fff" stroke="#e6e3dd" strokeWidth="0.9" />
                <circle r={r} fill="none" stroke={accent} strokeWidth="1.3"
                  strokeDasharray={`${pct * (2 * Math.PI * r)} ${2 * Math.PI * r}`} transform="rotate(-90)" />
                <text x="0" y="1.2" textAnchor="middle" fontSize={dense ? 2.6 : 3} fontWeight="800" fill={accent}>{shortPos(p.pos)}</text>
                {!dense && (
                  <>
                    <rect x={-chipW / 2} y="6.3" width={chipW} height="4.6" rx="2.3" fill="#fff" stroke="#ece9e3" strokeWidth="0.35" />
                    <text x="0" y="9.5" textAnchor="middle" fontSize="2.6" fontWeight="600" fill="#3a362f">{short}</text>
                  </>
                )}
                {dense && (
                  <text x="0" y={r + 3.4} textAnchor="middle" fontSize="2.4" fontWeight="600" fill="#9a948a">{i + 1}</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div style={styles.formationNote}>
        {sport === "Soccer" ? `${formation} formation` : "Starting line-up"} shown above. Edit names and positions below.
      </div>

      <div style={styles.sectionLabel}>Starting {starters.length}</div>
      <section style={styles.formationGrid}>
        {starters.map((p) => (
          <div key={p.id} style={styles.fCard}>
            <EditableName value={p.name} accent={accent} onChange={(v) => updatePlayer(p.id, { name: v })} />
            <PosSelect value={p.pos} onChange={(v) => updatePlayer(p.id, { pos: v })} />
            <span style={{ ...styles.fMins, color: accent }}>{fmt(p.minutes)}m</span>
          </div>
        ))}
      </section>

      <div style={{ ...styles.sectionLabel, marginTop: 16 }}>Bench</div>
      <section style={styles.formationGrid}>
        {bench.map((p) => (
          <div key={p.id} style={styles.fCard}>
            <EditableName value={p.name} accent={accent} onChange={(v) => updatePlayer(p.id, { name: v })} />
            <PosSelect value={p.pos} onChange={(v) => updatePlayer(p.id, { pos: v })} />
            <button onClick={() => removePlayer(p.id)} className="iconBtn" style={styles.iconBtn}><Trash2 size={13} /></button>
          </div>
        ))}
        <button onClick={addBench} className="addBtn" style={styles.addBtn}>
          <Plus size={15} /> Add bench player
        </button>
      </section>
    </div>
  );
}

const globalCss = (accent) => `
  .teamSwitch:hover, .sportTab:hover { border-color: ${accent}; }
  .ghostBtn:hover, .viewBtn:hover { background: rgba(0,0,0,.05); }
  .iconBtn:hover { background: rgba(0,0,0,.06); }
  .addBtn:hover { border-color: ${accent}; color: ${accent}; }
  .nameDisplay:hover { background: rgba(0,0,0,.03); border-radius: 6px; }
  .tickBtn:active { transform: scale(0.94); }
  .posSelect:focus { border-color: ${accent}; }
  .mSlider { -webkit-appearance: none; appearance: none; height: 8px; border-radius: 99px; outline: none; cursor: pointer; }
  .mSlider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 24px; height: 24px; border-radius: 50%; background: #fff; border: 3px solid ${accent}; cursor: grab; box-shadow: 0 1px 4px rgba(0,0,0,.2); }
  .mSlider::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.1); }
  .mSlider::-moz-range-thumb { width: 24px; height: 24px; border-radius: 50%; background: #fff; border: 3px solid ${accent}; cursor: grab; }
  .mSlider:disabled::-webkit-slider-thumb { cursor: not-allowed; }
  input:focus-visible, button:focus-visible, select:focus-visible { outline: 2px solid ${accent}; outline-offset: 1px; }
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
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 18 },
  kicker: { fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#9a948a", fontWeight: 600 },
  title: { fontSize: 28, fontWeight: 800, margin: "4px 0 0", letterSpacing: -0.5, border: "none", background: "transparent", padding: 0, width: "100%", color: "#1a1815" },
  sportTabs: { display: "flex", gap: 6, flexWrap: "wrap" },
  sportTab: { padding: "7px 13px", fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: "pointer", background: "#fff", border: "1.5px solid #e6e3dd", color: "#5a554d", transition: "all .12s" },
  configBar: { display: "flex", gap: 18, alignItems: "flex-end", flexWrap: "wrap", background: "#fff", border: "1px solid #ece9e3", borderRadius: 14, padding: "16px 20px", marginBottom: 14 },
  configItem: { display: "flex", flexDirection: "column", gap: 5 },
  cfgLabel: { fontSize: 11, fontWeight: 600, color: "#9a948a", textTransform: "uppercase", letterSpacing: 0.5 },
  numInput: { width: 72, padding: "8px 10px", fontSize: 16, fontWeight: 700, border: "1.5px solid #e6e3dd", borderRadius: 8, background: "#faf8f4" },
  formationSelect: { padding: "8px 10px", fontSize: 14, fontWeight: 700, border: "1.5px solid #e6e3dd", borderRadius: 8, background: "#faf8f4", cursor: "pointer" },
  configReadout: { display: "flex", gap: 22, marginLeft: "auto" },
  bigStat: { display: "flex", flexDirection: "column", fontSize: 24, fontWeight: 800, lineHeight: 1 },
  statUnit: { fontSize: 11, fontWeight: 600, color: "#9a948a", marginTop: 3 },
  statTotal: { fontWeight: 700, color: "#bbb5ab" },
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 },
  viewToggle: { display: "flex", gap: 4, background: "#f0ede7", padding: 4, borderRadius: 10 },
  viewBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", fontSize: 13, fontWeight: 700, background: "transparent", border: "none", borderRadius: 7, cursor: "pointer", color: "#5a554d", transition: "all .12s" },
  balanceActions: { display: "flex", gap: 8 },
  ghostBtn: { display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px", fontSize: 12.5, fontWeight: 600, background: "transparent", border: "1.5px solid #ddd9d2", borderRadius: 7, cursor: "pointer", color: "#5a554d" },
  sectionLabel: { fontSize: 12, fontWeight: 700, color: "#9a948a", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  players: { display: "flex", flexDirection: "column", gap: 10 },
  card: { background: "#fff", border: "1.5px solid #ece9e3", borderRadius: 14, padding: "14px 16px", transition: "border-color .12s" },
  cardTop: { display: "flex", alignItems: "center", gap: 10 },
  chevBtn: { background: "none", border: "none", cursor: "pointer", color: "#9a948a", padding: 2, display: "flex" },
  nameInput: { fontSize: 15.5, fontWeight: 700, border: "none", background: "transparent", flex: 1, minWidth: 60, padding: "2px 0", color: "#1a1815" },
  nameDisplay: { display: "inline-flex", alignItems: "center", gap: 6, flex: 1, minWidth: 60, background: "transparent", border: "none", cursor: "pointer", padding: "2px 0", fontSize: 15, fontWeight: 700, color: "#1a1815", textAlign: "left" },
  nameDisplayBig: { display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", padding: 0, fontSize: 14, fontWeight: 600, color: "#1a1815", textAlign: "left" },
  nameText: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  nameEditWrap: { display: "inline-flex", alignItems: "center", gap: 5, flex: 1, minWidth: 0 },
  nameInputEdit: { fontSize: 15, fontWeight: 700, border: "1.5px solid #e6e3dd", borderRadius: 7, background: "#fff", flex: 1, minWidth: 40, padding: "5px 8px", color: "#1a1815" },
  nameInputBig: { fontSize: 14, fontWeight: 600, border: "1.5px solid #e6e3dd", borderRadius: 7, background: "#fff", flex: 1, minWidth: 0, padding: "5px 8px", color: "#1a1815" },
  tickBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 7, border: "none", cursor: "pointer", flexShrink: 0 },
  posSelect: { fontSize: 13, fontWeight: 700, padding: "5px 8px", borderRadius: 7, border: "1.5px solid #e6e3dd", background: "#faf8f4", color: "#3a362f", cursor: "pointer" },
  minutesReadout: { display: "flex", alignItems: "baseline", gap: 3 },
  minutesBig: { fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums" },
  minutesUnit: { fontSize: 11, fontWeight: 600, color: "#9a948a" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", color: "#aaa49a", padding: 6, borderRadius: 6, display: "flex" },
  sliderRow: { marginTop: 12 },
  slider: { width: "100%", height: 8 },
  details: { display: "flex", gap: 18, marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0ede7", flexWrap: "wrap" },
  detailField: { display: "flex", flexDirection: "column", gap: 6 },
  detailLabel: { fontSize: 11, fontWeight: 600, color: "#9a948a", textTransform: "uppercase", letterSpacing: 0.5 },
  detailInput: { padding: "8px 10px", fontSize: 14, border: "1.5px solid #e6e3dd", borderRadius: 8, background: "#faf8f4", width: 150 },
  addBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px", fontSize: 14, fontWeight: 600, background: "#fff", border: "1.5px dashed #d8d4cc", borderRadius: 12, cursor: "pointer", color: "#7a756c", transition: "all .12s", marginTop: 2, width: "100%" },
  footer: { display: "flex", gap: 20, marginTop: 22, fontSize: 12.5, color: "#9a948a", fontWeight: 500, flexWrap: "wrap" },
  pitchWrap: { background: "#fff", border: "1px solid #ece9e3", borderRadius: 16, padding: 14, marginBottom: 12, display: "flex", justifyContent: "center" },
  pitchSvg: { width: "100%", maxWidth: 460, height: "auto" },
  formationNote: { fontSize: 12.5, color: "#9a948a", textAlign: "center", marginBottom: 16 },
  formationGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 },
  fCard: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #ece9e3", borderRadius: 10, padding: "8px 10px" },
  fName: { fontSize: 14, fontWeight: 600, border: "none", background: "transparent", flex: 1, minWidth: 0, padding: 0, color: "#1a1815" },
  fMins: { fontSize: 13, fontWeight: 700 },
  gameCentre: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 20, padding: "14px 16px", borderRadius: 14, border: "1.5px dashed #d8d4cc", background: "rgba(0,0,0,.015)" },
  gcTitle: { fontSize: 14, fontWeight: 800, color: "#3a362f" },
  gcSub: { fontSize: 12, color: "#9a948a", marginTop: 2 },
  gcBtn: { padding: "10px 18px", fontSize: 14, fontWeight: 700, borderRadius: 10, border: "none", background: "#d8d4cc", color: "#fff", cursor: "not-allowed", opacity: 0.7 },
};
