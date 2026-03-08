"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Home.module.css";

type ApiMetrics = { metrics: string[]; n_models: number; population?: string; dataset?: string };

type ApiLeaderboard = {
  selected_metrics: string[];
  sort_by: string;
  sort_dir: "asc" | "desc";
  total: number;
  rows: Record<string, any>[];
};

function numOrNaN(v: any) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function clamp01(t: number) {
  return Math.max(0, Math.min(1, t));
}

function fmtPct(v: number) {
  return Number.isFinite(v) ? (v * 100).toFixed(2) : "-";
}

const ACC = "ACC";
const ACC_LABEL = "Accuracy";

function metricLabel(m: string) {
  return m === ACC ? ACC_LABEL : m;
}

const ORDER_1D = ["Difficulty", "Uniqueness", "Risk", "Surprise", "Typicality", "Bridge"];
const ORDER_2D = ["Mastery", "Ingenuity", "Robustness"];
const ORDER_3D = ["Caution"];

const MODEL_A = "doubao-seed-1-6-250615(CoT)";
const MODEL_B = "gpt-4o-2024-11-20(CoT)";

const RADAR_THEME_A = {
  fill: "rgba(255,190,122,0.78)",
};

const RADAR_THEME_B = {
  fill: "rgba(142,207,201,0.78)",
};

function MiniCombinedRadarSVG({
  valuesA,
  valuesB,
  metrics,
  ranges,
}: {
  valuesA: Record<string, number>;
  valuesB: Record<string, number>;
  metrics: string[];
  ranges: Record<string, { min: number; max: number }>;
}) {
  const W = 310;
  const H = 220;
  const cx = W / 2;
  const cy = 112;
  const R = 68;

  const n = Math.max(3, metrics.length);
  const angles = metrics.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / n);

  const norm = (m: string, v: number) => {
    const r = ranges[m];
    if (!r) return 0.5;
    const { min, max } = r;
    if (!Number.isFinite(v)) return 0;
    if (max === min) return 0.5;
    return clamp01((v - min) / (max - min));
  };

  const pointAt = (radius: number, angle: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  const polygonPath = (radius: number) =>
    angles
      .map((a, i) => {
        const p = pointAt(radius, a);
        return `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      })
      .join(" ") + " Z";

  const seriesPath = (vals: Record<string, number>) =>
    metrics
      .map((m, i) => {
        const p = pointAt(R * norm(m, vals[m]), angles[i]);
        return `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      })
      .join(" ") + " Z";

  const rawLabelPts = angles.map((a) => ({
    x: cx + (R + 16) * Math.cos(a),
    y: cy + (R + 16) * Math.sin(a),
  }));

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const labelPts = rawLabelPts.map((p) => ({
    x: clamp(p.x, 18, W - 18),
    y: clamp(p.y, 16, H - 16),
  }));

  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className={styles.radarWrap}>
      <svg className={styles.radarSvg} width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Radar comparison">
        {rings.map((t) => (
          <path
            key={t}
            d={polygonPath(R * t)}
            fill="none"
            stroke="rgba(120,120,120,0.18)"
            strokeWidth={t === 1 ? 1.15 : 1}
            strokeLinejoin="round"
          />
        ))}

        <path d={seriesPath(valuesA)} fill={RADAR_THEME_A.fill} stroke="none" />
        <path d={seriesPath(valuesB)} fill={RADAR_THEME_B.fill} stroke="none" />

        {metrics.map((m, i) => {
          const x = labelPts[i].x;
          const y = labelPts[i].y;
          const anchor = x < cx - 8 ? "end" : x > cx + 8 ? "start" : "middle";

          return (
            <text
              key={m}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fill="rgba(110,110,110,0.92)"
              style={{ fontSize: 9.5, fontWeight: 600 }}
            >
              {metricLabel(m)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function MiniCompareBars({
  valuesA,
  valuesB,
  metrics,
  ranges,
}: {
  valuesA: Record<string, number>;
  valuesB: Record<string, number>;
  metrics: string[];
  ranges: Record<string, { min: number; max: number }>;
}) {
  const norm = (m: string, v: number) => {
    const r = ranges[m];
    if (!r) return 0.5;
    const { min, max } = r;
    if (!Number.isFinite(v)) return 0;
    if (max === min) return 0.5;
    return clamp01((v - min) / (max - min));
  };

  return (
    <div className={styles.barsWrap}>
      <div className={styles.miniBarsList}>
        {metrics.map((m) => {
          const va = valuesA[m];
          const vb = valuesB[m];
          const wa = `${(norm(m, va) * 100).toFixed(1)}%`;
          const wb = `${(norm(m, vb) * 100).toFixed(1)}%`;

          return (
            <div key={m} className={styles.miniBarRow}>
              <div className={styles.miniBarMetric}>{metricLabel(m)}</div>

              <div className={styles.miniBarTracks}>
                <div className={styles.miniBarTrack}>
                  <div className={styles.miniBarFillA} style={{ width: wa }} />
                </div>
                <div className={styles.miniBarTrack}>
                  <div className={styles.miniBarFillB} style={{ width: wb }} />
                </div>
              </div>

              <div className={styles.miniBarNums}>
                <div className={styles.miniBarNumLine}>
                  <span className={styles.legendDotA} />
                  <span className={styles.miniBarNum}>{fmtPct(va)}</span>
                </div>
                <div className={styles.miniBarNumLine}>
                  <span className={styles.legendDotB} />
                  <span className={styles.miniBarNum}>{fmtPct(vb)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const goto = (href: string) => router.push(href);

  const [metricsOrdered, setMetricsOrdered] = useState<string[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareErr, setCompareErr] = useState<string | null>(null);
  const [rowA, setRowA] = useState<Record<string, any> | null>(null);
  const [rowB, setRowB] = useState<Record<string, any> | null>(null);
  const [leaderboardRows, setLeaderboardRows] = useState<Record<string, any>[]>([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const params = new URLSearchParams();
        params.set("population", "Curated");
        params.set("dataset", "Avg");

        const r = await fetch(`/backend/api/metrics?${params.toString()}`);
        if (!r.ok) throw new Error(`metrics HTTP ${r.status}`);

        const js = (await r.json()) as ApiMetrics;
        if (!alive) return;

        const backend = (js.metrics ?? []).filter(Boolean);
        const ordered: string[] = [];

        if (backend.includes(ACC)) ordered.push(ACC);
        for (const m of ORDER_1D) if (backend.includes(m)) ordered.push(m);
        for (const m of ORDER_2D) if (backend.includes(m)) ordered.push(m);
        for (const m of ORDER_3D) if (backend.includes(m)) ordered.push(m);
        for (const m of backend) if (!ordered.includes(m)) ordered.push(m);

        setMetricsOrdered(ordered);
      } catch {
        if (!alive) return;
        setMetricsOrdered([ACC, ...ORDER_1D, ...ORDER_2D, ...ORDER_3D]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    if (metricsOrdered.length === 0) return;

    setCompareLoading(true);
    setCompareErr(null);

    (async () => {
      try {
        const params = new URLSearchParams();
        params.set("population", "Curated");
        params.set("dataset", "Avg");
        params.set("metrics", metricsOrdered.join(","));
        params.set("sort_by", "ACC");
        params.set("sort_dir", "desc");
        params.set("limit", "1000000");
        params.set("offset", "0");

        const r = await fetch(`/backend/api/leaderboard?${params.toString()}`);
        if (!r.ok) throw new Error(`leaderboard HTTP ${r.status}`);

        const js = (await r.json()) as ApiLeaderboard;
        if (!alive) return;

        const rows = js.rows ?? [];
        const a = rows.find((x) => String(x.model) === MODEL_A) ?? null;
        const b = rows.find((x) => String(x.model) === MODEL_B) ?? null;

        setLeaderboardRows(rows);
        setRowA(a);
        setRowB(b);

        if (!a || !b) {
          const miss = [!a ? MODEL_A : null, !b ? MODEL_B : null].filter(Boolean).join(" / ");
          setCompareErr(`Model not found: ${miss}`);
        }
      } catch (e: any) {
        if (!alive) return;
        setLeaderboardRows([]);
        setRowA(null);
        setRowB(null);
        setCompareErr(e?.message ?? String(e));
      } finally {
        if (!alive) return;
        setCompareLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [metricsOrdered]);

  const metricsToShow = useMemo(() => {
    return metricsOrdered.length ? metricsOrdered : [ACC, ...ORDER_1D, ...ORDER_2D, ...ORDER_3D];
  }, [metricsOrdered]);

  const valuesA = useMemo(() => {
    const out: Record<string, number> = {};
    for (const m of metricsToShow) out[m] = rowA ? numOrNaN(rowA[m]) : NaN;
    return out;
  }, [rowA, metricsToShow]);

  const valuesB = useMemo(() => {
    const out: Record<string, number> = {};
    for (const m of metricsToShow) out[m] = rowB ? numOrNaN(rowB[m]) : NaN;
    return out;
  }, [rowB, metricsToShow]);

  const radarRanges = useMemo(() => {
    const ranges: Record<string, { min: number; max: number }> = {};

    for (const m of metricsToShow) {
      let mn = Infinity;
      let mx = -Infinity;

      for (const r of leaderboardRows) {
        const v = numOrNaN(r[m]);
        if (!Number.isFinite(v)) continue;
        mn = Math.min(mn, v);
        mx = Math.max(mx, v);
      }

      ranges[m] = !Number.isFinite(mn) || !Number.isFinite(mx) ? { min: 0, max: 1 } : { min: mn, max: mx };
    }

    return ranges;
  }, [leaderboardRows, metricsToShow]);

  return (
    <div className={styles.page}>
      <div className={styles.heroCard}>
        <div className={styles.heroTitle}>Probing Memes</div>
        <div className={styles.heroDesc}>
          这是项目主页：下方提供三个板块的快速预览（模型对比 / 数据集分析 / 实验流程）。点击对应卡片即可进入完整页面。
        </div>
      </div>

      <div className={styles.stack}>
        <div className={styles.previewCard} onClick={() => goto("/leaderboard")} role="button" tabIndex={0}>
          <div className={`${styles.cardHead} ${styles.cardHeadCenter}`}>
            <div className={styles.cardTitle}>Model Leaderboard</div>
            <div className={styles.cardCtaAbs}>Open →</div>
          </div>

          <div className={styles.cardBodyCompare}>
            {compareLoading && <div className={styles.muted}>Loading…</div>}
            {compareErr && <div className={styles.muted}>Failed: {compareErr}</div>}

            {!compareLoading && !compareErr && rowA && rowB && (
              <>
                <div className={styles.comparePreviewLegend}>
                  <div className={styles.legendItem} title={MODEL_A}>
                    <span className={styles.legendDotA} />
                    <span className={styles.legendText}>{MODEL_A}</span>
                  </div>

                  <span className={styles.compareVs}>vs.</span>

                  <div className={styles.legendItem} title={MODEL_B}>
                    <span className={styles.legendDotB} />
                    <span className={styles.legendText}>{MODEL_B}</span>
                  </div>
                </div>

                <div className={styles.comparePreviewGrid}>
                  <MiniCombinedRadarSVG valuesA={valuesA} valuesB={valuesB} metrics={metricsToShow} ranges={radarRanges} />
                  <MiniCompareBars valuesA={valuesA} valuesB={valuesB} metrics={metricsToShow} ranges={radarRanges} />
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.previewCard} onClick={() => goto("/probe-analysis")} role="button" tabIndex={0}>
          <div className={`${styles.cardHead} ${styles.cardHeadCenter}`}>
            <div className={styles.cardTitle}>Dataset Analysis</div>
            <div className={styles.cardCtaAbs}>Open →</div>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.imgBoxPreview}>
              <Image
                src="/probe-analysis/curated-overview.png"
                alt="Dataset analysis overview"
                fill
                priority={false}
                sizes="(max-width: 980px) 92vw, 900px"
                className={styles.previewImg}
              />
            </div>
          </div>
        </div>

        <div className={styles.previewCard} onClick={() => goto("/explore")} role="button" tabIndex={0}>
          <div className={`${styles.cardHead} ${styles.cardHeadCenter}`}>
            <div className={styles.cardTitle}>The Probing Memes Paradigm</div>
            <div className={styles.cardCtaAbs}>Open →</div>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.imgBoxPreview}>
              <Image
                src="/explore/overview.png"
                alt="Explore overview"
                fill
                priority={false}
                sizes="(max-width: 980px) 92vw, 900px"
                className={styles.previewImg}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}