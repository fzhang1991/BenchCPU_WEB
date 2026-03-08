"use client";

import styles from "../Leaderboard.module.css";

type Row = Record<string, any>;

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function fmt(v: any) {
  if (v === null || v === undefined) return "-";
  if (typeof v === "number") return Number.isFinite(v) ? v.toFixed(3) : "-";
  return String(v);
}

export default function BarLeaderboard({
  rows,
  metric,
  title,
  topK = 12,
}: {
  rows: Row[];
  metric: string;
  title?: string;
  topK?: number;
}) {
  const top = rows.slice(0, topK);

  return (
    <div className={styles.barBox}>
      <div className={styles.barHeader}>
        <div className={styles.barTitle}>{title ?? `Top ${topK} by ${metric}`}</div>
        <div className={styles.barHint}>Bars use raw values (clamped to 0–1)</div>
      </div>

      <div className={styles.barList}>
        {top.map((r, i) => {
          const vRaw = r[metric];
          const v = typeof vRaw === "number" && Number.isFinite(vRaw) ? vRaw : null;

          const w = v === null ? 0 : clamp01(v);

          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";

          return (
            <div key={r.model} className={styles.barRow}>
              <div className={styles.barLeft}>
                <div className={styles.barRank}>{r.rank}</div>
                <div className={styles.barModel} title={r.model}>
                  {medal} {r.model}
                </div>
              </div>

              <div className={styles.barTrack} aria-label={`${r.model} ${metric}`}>
                <div className={styles.barFill} style={{ width: `${w * 100}%` }} />
              </div>

              <div className={styles.barValue}>{fmt(vRaw)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
