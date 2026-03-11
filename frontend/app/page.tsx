"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Home.module.css";
import { useLanguage } from "@/contexts/LanguageContext";
import { homeZh } from "./homeZh";

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

const BASE_TEXT = {
  heroDesc:
    "Below are quick previews of three sections (Model Comparison / Dataset Analysis / Experimental Workflow). Click a card to open the full page.",

  modelLeaderboard: "Model Leaderboard",
  datasetAnalysis: "Dataset Analysis",
  probingMemesParadigm: "The Probing Memes Paradigm",

  open: "Open →",

  radarComparisonAria: "Radar comparison",
  loading: "Loading…",
  failed: "Failed: ",
  modelNotFound: "Model not found: ",

  datasetAnalysisAlt: "Dataset analysis overview",
  exploreOverviewAlt: "Explore overview",
};

type HomeText = Record<keyof typeof BASE_TEXT, string>;

function MiniCombinedRadarSVG({
  valuesA,
  valuesB,
  metrics,
  ranges,
  t,
  compact = false,
}: {
  valuesA: Record<string, number>;
  valuesB: Record<string, number>;
  metrics: string[];
  ranges: Record<string, { min: number; max: number }>;
  t: HomeText;
  compact?: boolean;
}) {
  const W = compact ? 250 : 310;
  const H = compact ? 170 : 220;
  const cx = W / 2;
  const cy = compact ? 88 : 112;
  const R = compact ? 50 : 68;

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
    x: cx + (R + (compact ? 13 : 16)) * Math.cos(a),
    y: cy + (R + (compact ? 13 : 16)) * Math.sin(a),
  }));

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const labelPts = rawLabelPts.map((p) => ({
    x: clamp(p.x, compact ? 16 : 18, W - (compact ? 16 : 18)),
    y: clamp(p.y, compact ? 14 : 16, H - (compact ? 14 : 16)),
  }));

  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div
      className={styles.radarWrap}
      style={
        compact
          ? {
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginTop: 2,
            }
          : undefined
      }
    >
      <svg
        className={styles.radarSvg}
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t.radarComparisonAria}
        style={compact ? { maxWidth: 250, display: "block" } : undefined}
      >
        {rings.map((x) => (
          <path
            key={x}
            d={polygonPath(R * x)}
            fill="none"
            stroke="rgba(120,120,120,0.18)"
            strokeWidth={x === 1 ? 1.15 : 1}
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
              style={{
                fontSize: compact ? 8.2 : 9.5,
                fontWeight: 600,
              }}
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
  compact = false,
  showMoreHint = false,
}: {
  valuesA: Record<string, number>;
  valuesB: Record<string, number>;
  metrics: string[];
  ranges: Record<string, { min: number; max: number }>;
  compact?: boolean;
  showMoreHint?: boolean;
}) {
  const norm = (m: string, v: number) => {
    const r = ranges[m];
    if (!r) return 0.5;
    const { min, max } = r;
    if (!Number.isFinite(v)) return 0;
    if (max === min) return 0.5;
    return clamp01((v - min) / (max - min));
  };

  if (compact) {
    return (
      <div
        className={styles.barsWrap}
        style={{
          width: "100%",
          marginTop: 6,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 260,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {metrics.map((m) => {
            const va = valuesA[m];
            const vb = valuesB[m];
            const wa = `${(norm(m, va) * 100).toFixed(1)}%`;
            const wb = `${(norm(m, vb) * 100).toFixed(1)}%`;

            return (
              <div
                key={m}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "rgba(55,65,81,0.95)",
                      whiteSpace: "nowrap",
                      flex: "0 0 auto",
                    }}
                  >
                    {metricLabel(m)}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      whiteSpace: "nowrap",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "rgba(75,85,99,0.98)",
                      flex: "0 0 auto",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span className={styles.legendDotA} />
                      <span>{fmtPct(va)}</span>
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span className={styles.legendDotB} />
                      <span>{fmtPct(vb)}</span>
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      height: 5,
                      width: "100%",
                      borderRadius: 999,
                      background: "rgba(120,120,120,0.10)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: wa,
                        height: "100%",
                        borderRadius: 999,
                        background: RADAR_THEME_A.fill,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      height: 5,
                      width: "100%",
                      borderRadius: 999,
                      background: "rgba(120,120,120,0.10)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: wb,
                        height: "100%",
                        borderRadius: 999,
                        background: RADAR_THEME_B.fill,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {showMoreHint && (
            <div
              style={{
                textAlign: "center",
                fontSize: 14,
                lineHeight: 1,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "rgba(148,163,184,0.95)",
                paddingTop: 2,
              }}
              aria-hidden="true"
            >
              …
            </div>
          )}
        </div>
      </div>
    );
  }

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
  const { lang } = useLanguage();

  const t: HomeText = useMemo(
    () => (lang === "zh" ? { ...BASE_TEXT, ...homeZh } : BASE_TEXT),
    [lang]
  );

  const goto = (href: string) => router.push(href);

  const [metricsOrdered, setMetricsOrdered] = useState<string[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareErr, setCompareErr] = useState<string | null>(null);
  const [rowA, setRowA] = useState<Record<string, any> | null>(null);
  const [rowB, setRowB] = useState<Record<string, any> | null>(null);
  const [leaderboardRows, setLeaderboardRows] = useState<Record<string, any>[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const apply = () => setIsMobile(mq.matches);
    apply();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }

    mq.addListener(apply);
    return () => mq.removeListener(apply);
  }, []);

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
          setCompareErr(`${t.modelNotFound}${miss}`);
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
  }, [metricsOrdered, t.modelNotFound]);

  const metricsToShow = useMemo(() => {
    return metricsOrdered.length ? metricsOrdered : [ACC, ...ORDER_1D, ...ORDER_2D, ...ORDER_3D];
  }, [metricsOrdered]);

  const radarMetrics = useMemo(() => {
    return metricsToShow;
  }, [metricsToShow]);

  const barMetrics = useMemo(() => {
    if (!isMobile) return metricsToShow;

    const preferred = [ACC, "Difficulty", "Risk", "Typicality"];
    const picked = preferred.filter((m) => metricsToShow.includes(m));
    const source = picked.length >= 3 ? picked : metricsToShow;
    return source.slice(0, 3);
  }, [isMobile, metricsToShow]);

  const hasMoreBarMetrics = useMemo(() => {
    return isMobile && metricsToShow.length > barMetrics.length;
  }, [isMobile, metricsToShow, barMetrics]);

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
        <div className={styles.heroDesc}>{t.heroDesc}</div>
      </div>

      <div className={styles.stack}>
        <div className={styles.previewCard} onClick={() => goto("/leaderboard")} role="button" tabIndex={0}>
          <div className={`${styles.cardHead} ${styles.cardHeadCenter}`}>
            <div className={styles.cardTitle}>{t.modelLeaderboard}</div>
            <div className={styles.cardCtaAbs}>{t.open}</div>
          </div>

          <div className={styles.cardBodyCompare}>
            {compareLoading && <div className={styles.muted}>{t.loading}</div>}
            {compareErr && <div className={styles.muted}>{t.failed}{compareErr}</div>}

            {!compareLoading && !compareErr && rowA && rowB && (
              <>
                <div
                  className={styles.comparePreviewLegend}
                  style={
                    isMobile
                      ? {
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "nowrap",
                          minWidth: 0,
                          width: "100%",
                          marginBottom: 8,
                        }
                      : undefined
                  }
                >
                  <div
                    className={styles.legendItem}
                    title={MODEL_A}
                    style={
                      isMobile
                        ? {
                            flex: "1 1 0",
                            minWidth: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }
                        : undefined
                    }
                  >
                    <span className={styles.legendDotA} />
                    <span
                      className={styles.legendText}
                      style={
                        isMobile
                          ? {
                              minWidth: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              display: "block",
                            }
                          : undefined
                      }
                    >
                      {MODEL_A}
                    </span>
                  </div>

                  <span
                    className={styles.compareVs}
                    style={
                      isMobile
                        ? {
                            flex: "0 0 auto",
                            whiteSpace: "nowrap",
                            fontSize: 13,
                            fontWeight: 800,
                            color: "rgba(107,114,128,0.95)",
                          }
                        : undefined
                    }
                  >
                    vs.
                  </span>

                  <div
                    className={styles.legendItem}
                    title={MODEL_B}
                    style={
                      isMobile
                        ? {
                            flex: "1 1 0",
                            minWidth: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }
                        : undefined
                    }
                  >
                    <span className={styles.legendDotB} />
                    <span
                      className={styles.legendText}
                      style={
                        isMobile
                          ? {
                              minWidth: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              display: "block",
                            }
                          : undefined
                      }
                    >
                      {MODEL_B}
                    </span>
                  </div>
                </div>

                <div
                  className={styles.comparePreviewGrid}
                  style={
                    isMobile
                      ? {
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          alignItems: "stretch",
                        }
                      : undefined
                  }
                >
                  <MiniCombinedRadarSVG
                    valuesA={valuesA}
                    valuesB={valuesB}
                    metrics={radarMetrics}
                    ranges={radarRanges}
                    t={t}
                    compact={isMobile}
                  />
                  <MiniCompareBars
                    valuesA={valuesA}
                    valuesB={valuesB}
                    metrics={barMetrics}
                    ranges={radarRanges}
                    compact={isMobile}
                    showMoreHint={hasMoreBarMetrics}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.previewCard} onClick={() => goto("/probe-analysis")} role="button" tabIndex={0}>
          <div className={`${styles.cardHead} ${styles.cardHeadCenter}`}>
            <div className={styles.cardTitle}>{t.datasetAnalysis}</div>
            <div className={styles.cardCtaAbs}>{t.open}</div>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.imgBoxPreview}>
              <Image
                src="/probe-analysis/curated-overview.png"
                alt={t.datasetAnalysisAlt}
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
            <div className={styles.cardTitle}>{t.probingMemesParadigm}</div>
            <div className={styles.cardCtaAbs}>{t.open}</div>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.imgBoxPreview}>
              <Image
                src="/explore/overview.png"
                alt={t.exploreOverviewAlt}
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