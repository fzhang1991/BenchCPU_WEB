"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type MouseEvent, type UIEvent } from "react";
import styles from "../Leaderboard.module.css";
import PopulationSelector, { type Population } from "./PopulationSelector";
import { leaderboardZh } from "../ui/leaderboardZh";
import { useLanguage } from "@/contexts/LanguageContext";

type ApiMetrics = { metrics: string[]; n_models: number; population?: string; dataset?: string };
type Row = Record<string, any>;
type SortDir = "asc" | "desc";

type ApiLeaderboard = {
  selected_metrics: string[];
  sort_by: string;
  sort_dir: SortDir;
  total: number;
  offset?: number;
  limit?: number;
  rows: Row[];
};

function fmt(v: any) {
  if (v === null || v === undefined) return "-";
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "-";
  return (n * 100).toFixed(2);
}

function fmtNum(v: any) {
  if (v === null || v === undefined) return "-";
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "-";
  return (n * 100).toFixed(2);
}

function numOrNaN(v: any) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function signed(n: number) {
  if (!Number.isFinite(n)) return "";
  return n > 0 ? `+${n}` : `${n}`;
}

const ACC_METRIC = "ACC";

const MEME_SCORES_2D = new Set(["Mastery", "Ingenuity", "Robustness"]);
const MEME_SCORES_3D = new Set(["Caution"]);
const MEME_SCORES_1D = new Set(["Difficulty", "Uniqueness", "Risk", "Surprise", "Typicality", "Bridge"]);

const ORDER_1D = ["Difficulty", "Uniqueness", "Risk", "Surprise", "Typicality", "Bridge"];
const ORDER_2D = ["Mastery", "Ingenuity", "Robustness"];
const ORDER_3D = ["Caution"];

const DATASETS_CURATED = ["Avg", "MATH-500", "MMLU-Redux", "SimpleQA"] as const;
const DATASETS_HF = ["Avg", "BBH", "GPQA-Diamond", "IFEval", "MATH", "MMLU-Pro", "MUSR"] as const;

type CuratedDataset = (typeof DATASETS_CURATED)[number];
type HFDataset = (typeof DATASETS_HF)[number];
type Dataset = CuratedDataset | HFDataset;

const MODES = ["Base", "CoT", "IR"] as const;
type Mode = (typeof MODES)[number];

const ORGANIZATIONS = [
  "OpenAI",
  "Alibaba",
  "Anthropic",
  "Google",
  "DeepSeek",
  "xAI",
  "Zhipu",
  "MiniMax",
  "Moonshot",
  "Spark",
  "Ark",
] as const;
type Organization = (typeof ORGANIZATIONS)[number];

const BASE_TEXT = {
  sectionTitle: "Probing Memes Leaderboard",
  bannerTitle: "Choose metrics, filters, and sort by clicking header arrows.",
  memeScoreSelect: "Choose Meme Scores",
  memeScoreIntro:
    "Meme Scores are derived from how models answer different probes. Based on probe properties at the question level, they provide fine-grained scores for model capabilities. They can be interpreted as how well a model performs on different types of probes, such as difficult, risky, prototypical, or rare ones.",
  memeScoreDetailsLink: "See details in Explore.",
  memePatternHint:
    "Here, Behavioral pattern refers to a population-level correct/incorrect pattern on a set of probes. For example, all non-reasoning models fail while reasoning models succeed, or all Qwen-family models fail while others succeed.",
  filters: "Filters",
  datasetSingle: "Dataset (single choice)",
  reasoningModes: "Reasoning Modes",
  reasoningModesHintLine1: "Base: answer directly without explicitly requesting reasoning;",
  reasoningModesHintLine2: "Chain-of-Thought (CoT): prompt the model to generate explicit intermediate reasoning;",
  reasoningModesHintLine3: "Intrinsic Reasoning (IR): enable the model’s internal reasoning capability.",
  organizations: "Organizations",
  selectAll: "Select all",
  clear: "Clear",
  show: "Show options",
  hide: "Hide",
  modelComparison: "Model Comparison",
  pick1st: "Pick 1st",
  pick2nd: "Pick 2nd",
  clearComparison: "Clear comparison",
  compareHint:
    "Please select two models: click the vs. button next to any model. The first selection will be highlighted; click a second one to generate the comparison panel.",
  leaderboardBarPrefix: "Leaderboard",
  leaderboardBarSortHintPrefix: "sorting: click",
  leaderboardBarSortHintSuffix: "in column headers",
  leaderboardBarSortHint: "sorting: click header arrows",
  population: "Population",
  dataset: "Dataset",
  models: "Models",
  search: "Search:",
  searchPlaceholder: "Type model name…",
  searchAria: "Search model",
  searchClearTitle: "Clear search",
  showing: "Showing",
  loading: "Loading...",
  sortedBy: "Sorted by",
  rank: "Rank",
  model: "Model",
  noData: "No data",
  radarComparison: "Radar Comparison",
  metricBars: "Metric Bars",
  sortLabel: "Sort",
  sortAscending: "Sort ascending",
  sortDescending: "Sort descending",
  clickToToggleMetric: "Click to toggle this metric",
  compareAriaPrefix: "Compare",
  compareVsTooltip: "vs.: choose models for comparison (after selecting 2 models, the comparison panel will appear)",
  comparedWith: "Compared with",
  accuracyLabel: "Accuracy",
  modeSummary: "Modes",
  organizationSummary: "Organizations",
  showRankDelta: "Show rank change",
  rankDeltaPrefix: "",
} as const;

type UIText = Record<keyof typeof BASE_TEXT, string>;

const MEME_DEFS_EN: Record<string, string> = {
  Difficulty: "Performs well on difficult probes.",
  Uniqueness: "Performs well on probes with rare behavioral patterns.",
  Risk: "Resists probes that tend to fail alongside many other probes.",
  Surprise: "Handles probes with anomalous behavioral patterns.",
  Typicality: "Proficiency on prototypical probes that represent major behavior clusters.",
  Bridge: "Proficiency on probes that connect multiple behavioral clusters.",
  Mastery: "Performs well on difficult, prototypical probes.",
  Ingenuity: "Flexibility on probes with rare and anomalous behavior patterns.",
  Robustness: "Remains correct on high-risk probes at cross-cluster intersections.",
  Caution: "Avoids errors on easy, prototypical, yet high-risk probes.",
};

const MEME_DEFS_ZH: Record<string, string> = {
  Difficulty: "擅长处理困难 probes。",
  Uniqueness: "擅长处理具有稀有行为模式的 probes。",
  Risk: "能够抵抗那些往往会与许多其他 probes 一同失败的高风险 probes。",
  Surprise: "能够处理具有异常行为模式的 probes。",
  Typicality: "在代表主要行为簇的原型 probes 上表现熟练。",
  Bridge: "在连接多个行为簇的 probes 上表现熟练。",
  Mastery: "擅长处理既困难又具原型性的 probes。",
  Ingenuity: "能够灵活处理稀有且异常的行为模式。",
  Robustness: "在跨簇交界的高风险 probes 上依然保持正确。",
  Caution: "避免在看似简单、具有原型性但高风险的 probes 上出错。",
};

const RANK_COL_W = 64;
const MODEL_COL_W = 300;
const METRIC_COL_W = 116;
const HEADER_H = 56;
const ROW_H = 48;
const OVERSCAN = 12;
const MAX_VIEW_H = 680;

function metricLabel(m: string, t: UIText) {
  return m === ACC_METRIC ? t.accuracyLabel : m;
}

function SortArrow({
  direction,
  active,
  onClick,
  title,
  ariaLabel,
}: {
  direction: "asc" | "desc";
  active: boolean;
  onClick: () => void;
  title: string;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      className={`${styles.sortArrowBtn} ${active ? styles.sortArrowActive : ""}`}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
    >
      <svg className={styles.sortArrowSvg} viewBox="0 0 10 18" fill="none" aria-hidden="true">
        {direction === "asc" ? (
          <path
            d="M5 16V3M5 3L2.7 5.3M5 3L7.3 5.3"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M5 2V15M5 15L2.7 12.7M5 15L7.3 12.7"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}

function SortArrows({
  col,
  sortBy,
  sortDir,
  onSort,
  t,
}: {
  col: string;
  sortBy: string;
  sortDir: SortDir;
  onSort: (col: string, dir: SortDir) => void;
  t: UIText;
}) {
  const isActive = col === sortBy;
  const label = metricLabel(col, t);

  return (
    <span className={styles.sortInline} aria-label={`${t.sortLabel} ${label}`}>
      <SortArrow
        direction="asc"
        active={isActive && sortDir === "asc"}
        onClick={() => onSort(col, "asc")}
        title={t.sortAscending}
        ariaLabel={`${t.sortAscending}: ${label}`}
      />
      <SortArrow
        direction="desc"
        active={isActive && sortDir === "desc"}
        onClick={() => onSort(col, "desc")}
        title={t.sortDescending}
        ariaLabel={`${t.sortDescending}: ${label}`}
      />
    </span>
  );
}

function MetaSortHintIcon() {
  return (
    <svg className={styles.sortHintIcon} viewBox="0 0 18 20" fill="none" aria-hidden="true">
      <path
        d="M6 17V4M6 4L3.7 6.3M6 4L8.3 6.3"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 3V16M12 16L9.7 13.7M12 16L14.3 13.7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type RadarTheme = {
  fill: string;
  bar: string;
};

const RADAR_THEME_A: RadarTheme = {
  fill: "rgba(255,190,122,0.8)",
  bar: "rgb(255,190,122)",
};

const RADAR_THEME_B: RadarTheme = {
  fill: "rgba(142,207,201,0.8)",
  bar: "rgb(142,207,201)",
};

function CombinedRadarSVG({
  titleA,
  titleB,
  valuesA,
  valuesB,
  metrics,
  ranges,
  t,
}: {
  titleA: string;
  titleB: string;
  valuesA: Record<string, number>;
  valuesB: Record<string, number>;
  metrics: string[];
  ranges: Record<string, { min: number; max: number }>;
  t: UIText;
}) {
  const W = 460;
  const H = 330;
  const cx = W / 2;
  const cy = 172;
  const R = 118;

  const n = Math.max(3, metrics.length);
  const angles = metrics.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / n);

  const norm = (m: string, v: number) => {
    const r = ranges[m];
    if (!r) return 0.5;
    const { min, max } = r;
    if (!Number.isFinite(v)) return 0;
    if (max === min) return 0.5;
    const x = (v - min) / (max - min);
    return Math.max(0, Math.min(1, x));
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

  const polyA = seriesPath(valuesA);
  const polyB = seriesPath(valuesB);

  const rawLabelPts = angles.map((a) => ({
    x: cx + (R + 20) * Math.cos(a),
    y: cy + (R + 20) * Math.sin(a),
  }));

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const labelPts = rawLabelPts.map((p) => ({
    x: clamp(p.x, 22, W - 22),
    y: clamp(p.y, 22, H - 22),
  }));

  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className={styles.radarCard}>
      <div className={styles.radarTitle}>{t.radarComparison}</div>

      <div className={styles.radarLegend}>
        <div className={styles.legendItem} title={titleA}>
          <span className={styles.legendDotA} />
          <span className={styles.legendText}>{titleA}</span>
        </div>
        <div className={styles.legendItem} title={titleB}>
          <span className={styles.legendDotB} />
          <span className={styles.legendText}>{titleB}</span>
        </div>
      </div>

      <svg className={styles.radarSvg} width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.radarComparison}>
        {rings.map((x) => (
          <path
            key={x}
            d={polygonPath(R * x)}
            fill="none"
            stroke="rgba(120,120,120,0.18)"
            strokeWidth={x === 1 ? 1.25 : 1}
            strokeLinejoin="round"
          />
        ))}

        <path d={polyA} fill={RADAR_THEME_A.fill} stroke="none" />
        <path d={polyB} fill={RADAR_THEME_B.fill} stroke="none" />

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
              style={{ fontSize: 12, fontWeight: 500 }}
            >
              {metricLabel(m, t)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function CompareBars({
  titleA,
  titleB,
  valuesA,
  valuesB,
  metrics,
  t,
}: {
  titleA: string;
  titleB: string;
  valuesA: Record<string, number>;
  valuesB: Record<string, number>;
  metrics: string[];
  t: UIText;
}) {
  const widthPct = (v: number) => {
    if (!Number.isFinite(v)) return "0%";
    const clamped = Math.max(0, Math.min(1, v));
    return `${(clamped * 100).toFixed(1)}%`;
  };

  return (
    <div className={styles.barsCard}>
      <div className={styles.barsTitle}>{t.metricBars}</div>

      <div className={styles.barsLegend}>
        <div className={styles.legendItem} title={titleA}>
          <span className={styles.legendDotA} />
          <span className={styles.legendText}>{titleA}</span>
        </div>
        <div className={styles.legendItem} title={titleB}>
          <span className={styles.legendDotB} />
          <span className={styles.legendText}>{titleB}</span>
        </div>
      </div>

      <div className={styles.barsList}>
        {metrics.map((m) => {
          const va = valuesA[m];
          const vb = valuesB[m];

          return (
            <div key={m} className={styles.barMetricRow}>
              <div className={styles.barMetricLabel}>{metricLabel(m, t)}</div>

              <div className={styles.barTracks}>
                <div className={styles.barTrack}>
                  <div className={styles.barFillA} style={{ width: widthPct(va) }} />
                </div>
                <div className={styles.barTrack}>
                  <div className={styles.barFillB} style={{ width: widthPct(vb) }} />
                </div>
              </div>

              <div className={styles.barNums}>
                <div className={styles.barNumLine}>
                  <span className={styles.legendDotA} />
                  <span className={styles.barNum}>{fmtNum(va)}</span>
                </div>
                <div className={styles.barNumLine}>
                  <span className={styles.legendDotB} />
                  <span className={styles.barNum}>{fmtNum(vb)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildGridTemplate(cols: string[]) {
  return `${RANK_COL_W}px ${MODEL_COL_W}px ${cols.map(() => `${METRIC_COL_W}px`).join(" ")}`;
}

function headerCellBase(extra?: React.CSSProperties): React.CSSProperties {
  return {
    height: HEADER_H,
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
    padding: "0 12px",
    fontWeight: 900,
    fontSize: 13,
    color: "var(--text)",
    background: "linear-gradient(180deg, #eff6ff 0%, #e8f1ff 100%)",
    borderBottom: "1px solid rgba(15,23,42,0.10)",
    ...extra,
  };
}

function bodyCellBase(extra?: React.CSSProperties): React.CSSProperties {
  return {
    height: ROW_H,
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
    padding: "0 12px",
    fontSize: 13,
    borderTop: "1px solid rgba(15,23,42,0.06)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    ...extra,
  };
}

export default function LeaderboardClient() {
  const { lang } = useLanguage();

  const t: UIText = useMemo(
    () => (lang === "zh" ? { ...BASE_TEXT, ...leaderboardZh } : BASE_TEXT),
    [lang]
  );

  const memeDefs = useMemo(
    () => (lang === "zh" ? MEME_DEFS_ZH : MEME_DEFS_EN),
    [lang]
  );

  const [population, setPopulation] = useState<Population>("Curated");
  const isHF = population === "HF";

  const datasets = useMemo<readonly Dataset[]>(() => (isHF ? DATASETS_HF : DATASETS_CURATED), [isHF]);
  const avgDatasetCount = Math.max(0, datasets.length - 1);

  const datasetText = useMemo(() => {
    return lang === "zh"
      ? `数据集平均（${avgDatasetCount}）`
      : `Averaged over Datasets (${avgDatasetCount})`;
  }, [lang, avgDatasetCount]);

  const renderDatasetName = (ds: Dataset) => {
    if (ds === "Avg") return datasetText;
    return ds;
  };

  const [dataset, setDataset] = useState<Dataset>("Avg");

  const [allMetrics, setAllMetrics] = useState<string[]>([]);
  const [nModels, setNModels] = useState(0);

  const DEFAULT_SELECTED = useMemo(() => [ACC_METRIC, ...ORDER_1D], []);
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTED);

  const [sortBy, setSortBy] = useState<string>(ACC_METRIC);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [selectedModes, setSelectedModes] = useState<Mode[]>([...MODES]);
  const [selectedOrganizations, setSelectedOrganizations] = useState<Organization[]>([...ORGANIZATIONS]);

  const [data, setData] = useState<ApiLeaderboard | null>(null);
  const [loading, setLoading] = useState(false);

  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [modelQuery, setModelQuery] = useState("");
  const [showRankDelta, setShowRankDelta] = useState(true);

  const compareWrapRef = useRef<HTMLDivElement | null>(null);

  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const syncSourceRef = useRef<"top" | "main" | null>(null);

  const [tableScrollWidth, setTableScrollWidth] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(MAX_VIEW_H);

  useEffect(() => {
    setDataset("Avg");
    setSelected([ACC_METRIC, ...ORDER_1D]);
    setSortBy(ACC_METRIC);
    setSortDir("desc");
    setSelectedModes([...MODES]);
    setSelectedOrganizations([...ORGANIZATIONS]);
    setFiltersOpen(false);
    setCompareA(null);
    setCompareB(null);
    setModelQuery("");
    setShowRankDelta(true);
  }, [population]);

  useEffect(() => {
    if (!datasets.includes(dataset)) setDataset("Avg");
  }, [datasets, dataset]);

  useEffect(() => {
    setCompareA(null);
    setCompareB(null);
    setModelQuery("");
  }, [dataset]);

  useEffect(() => {
    if (compareA && compareB) {
      requestAnimationFrame(() => {
        compareWrapRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, [compareA, compareB]);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams();
      params.set("dataset", dataset);
      params.set("population", population);

      const res = await fetch(`/backend/api/metrics?${params.toString()}`);
      if (!res.ok) throw new Error(`metrics api failed: ${res.status}`);
      const js = (await res.json()) as ApiMetrics;

      const allowed = new Set<string>([
        ACC_METRIC,
        ...Array.from(MEME_SCORES_1D),
        ...Array.from(MEME_SCORES_2D),
        ...Array.from(MEME_SCORES_3D),
      ]);

      const backendMetrics = js.metrics ?? [];
      const filtered = backendMetrics.filter((m) => allowed.has(m));

      const ordered: string[] = [];
      if (filtered.includes(ACC_METRIC)) ordered.push(ACC_METRIC);
      for (const m of ORDER_1D) if (filtered.includes(m)) ordered.push(m);
      for (const m of ORDER_2D) if (filtered.includes(m)) ordered.push(m);
      for (const m of ORDER_3D) if (filtered.includes(m)) ordered.push(m);

      setAllMetrics(ordered);
      setNModels(js.n_models ?? 0);
      setSelected(ordered.length ? ordered : [ACC_METRIC]);
      setSortBy(ACC_METRIC);
      setSortDir("desc");
    })();
  }, [dataset, population]);

  const memeDefList = useMemo(() => {
    const available = new Set(allMetrics);
    const out: { name: string; def: string; group: "1D" | "2D" | "3D" }[] = [];
    for (const m of ORDER_1D) if (available.has(m) && memeDefs[m]) out.push({ name: m, def: memeDefs[m], group: "1D" });
    for (const m of ORDER_2D) if (available.has(m) && memeDefs[m]) out.push({ name: m, def: memeDefs[m], group: "2D" });
    for (const m of ORDER_3D) if (available.has(m) && memeDefs[m]) out.push({ name: m, def: memeDefs[m], group: "3D" });
    return out;
  }, [allMetrics, memeDefs]);

  const onSort = (col: string, dir: SortDir) => {
    setSortBy(col);
    setSortDir(dir);
  };

  useEffect(() => {
    const normalized = selected.includes(ACC_METRIC) ? selected : [ACC_METRIC, ...selected];
    if (normalized.length !== selected.length) {
      setSelected(normalized);
      return;
    }

    if (!selected.includes(sortBy)) {
      setSortBy(ACC_METRIC);
      setSortDir("desc");
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("population", population);
        params.set("dataset", dataset);
        params.set("metrics", selected.join(","));
        params.set("sort_by", sortBy);
        params.set("sort_dir", sortDir);
        params.set("limit", String(1000000));
        params.set("offset", "0");

        if (!isHF) {
          params.set("modes", selectedModes.join(","));
          params.set("vendors", selectedOrganizations.join(","));
        }

        const res = await fetch(`/backend/api/leaderboard?${params.toString()}`);
        if (!res.ok) throw new Error(`leaderboard api failed: ${res.status}`);
        const js = (await res.json()) as ApiLeaderboard;
        setData(js);
      } finally {
        setLoading(false);
      }
    })();
  }, [selected, sortBy, sortDir, dataset, population, isHF, selectedModes, selectedOrganizations]);

  const toggleMetric = (m: string) => {
    if (m === ACC_METRIC) return;
    setSelected((prev) => {
      const base = prev.includes(ACC_METRIC) ? prev : [ACC_METRIC, ...prev];
      const next = base.includes(m) ? base.filter((x) => x !== m) : [...base, m];
      if (!next.includes(ACC_METRIC)) next.unshift(ACC_METRIC);
      if (!next.includes(sortBy)) {
        setSortBy(ACC_METRIC);
        setSortDir("desc");
      }
      return next;
    });
  };

  const toggleMode = (m: Mode) => setSelectedModes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  const toggleOrganization = (v: Organization) =>
    setSelectedOrganizations((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const selectAllModes = () => setSelectedModes([...MODES]);
  const clearAllModes = () => setSelectedModes([]);
  const selectAllOrganizations = () => setSelectedOrganizations([...ORGANIZATIONS]);
  const clearAllOrganizations = () => setSelectedOrganizations([]);

  const cols = data?.selected_metrics ?? selected;
  const total = data?.total ?? nModels;
  const allRows = data?.rows ?? [];

  const rowByModel = useMemo(() => {
    const mp = new Map<string, Row>();
    for (const r of allRows) mp.set(String(r.model), r);
    return mp;
  }, [allRows]);

  const shownRows = useMemo(() => {
    const q = modelQuery.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((r) => String(r.model).toLowerCase().includes(q));
  }, [allRows, modelQuery]);

  const rankMap = useMemo(() => {
    const mp: Record<string, Record<string, number>> = {};

    const cmp = (a: Row, b: Row, m: string) => {
      const va = numOrNaN(a[m]);
      const vb = numOrNaN(b[m]);
      const aBad = !Number.isFinite(va);
      const bBad = !Number.isFinite(vb);
      if (aBad && bBad) return String(a.model).localeCompare(String(b.model));
      if (aBad) return 1;
      if (bBad) return -1;
      if (va === vb) return String(a.model).localeCompare(String(b.model));
      return sortDir === "asc" ? va - vb : vb - va;
    };

    for (const m of cols) {
      const sorted = [...allRows].sort((a, b) => cmp(a, b, m));
      mp[m] = {};
      sorted.forEach((r, i) => {
        mp[m][String(r.model)] = i + 1;
      });
    }
    return mp;
  }, [allRows, cols, sortDir]);

  const radarRanges = useMemo(() => {
    const ranges: Record<string, { min: number; max: number }> = {};
    for (const m of cols) {
      let mn = Infinity;
      let mx = -Infinity;
      for (const r of allRows) {
        const v = numOrNaN(r[m]);
        if (!Number.isFinite(v)) continue;
        mn = Math.min(mn, v);
        mx = Math.max(mx, v);
      }
      ranges[m] = !Number.isFinite(mn) || !Number.isFinite(mx) ? { min: 0, max: 1 } : { min: mn, max: mx };
    }
    return ranges;
  }, [allRows, cols]);

  const onPickCompare = (model: string) => {
    if (compareA === model) {
      if (compareB) {
        setCompareA(compareB);
        setCompareB(null);
      } else {
        setCompareA(null);
      }
      return;
    }

    if (compareB === model) {
      setCompareB(null);
      return;
    }

    if (!compareA) {
      setCompareA(model);
      return;
    }

    if (!compareB) {
      setCompareB(model);
      return;
    }

    setCompareB(model);
  };

  const clearCompare = () => {
    setCompareA(null);
    setCompareB(null);
  };

  const showTip = (e: MouseEvent, text: string) => setTip({ x: e.clientX + 12, y: e.clientY + 12, text });
  const moveTip = (e: MouseEvent) => setTip((prev) => (prev ? { ...prev, x: e.clientX + 12, y: e.clientY + 12 } : prev));
  const hideTip = () => setTip(null);

  const filterSummary = isHF
    ? `${t.dataset}: ${renderDatasetName(dataset)}`
    : `${t.dataset}: ${renderDatasetName(dataset)} · ${t.modeSummary}: ${selectedModes.length}/${MODES.length} · ${t.organizationSummary}: ${selectedOrganizations.length}/${ORGANIZATIONS.length}`;

  const rowA = compareA ? rowByModel.get(compareA) : null;
  const rowB = compareB ? rowByModel.get(compareB) : null;

  const valuesA = useMemo(() => {
    const out: Record<string, number> = {};
    for (const m of cols) out[m] = rowA ? numOrNaN(rowA[m]) : NaN;
    return out;
  }, [rowA, cols]);

  const valuesB = useMemo(() => {
    const out: Record<string, number> = {};
    for (const m of cols) out[m] = rowB ? numOrNaN(rowB[m]) : NaN;
    return out;
  }, [rowB, cols]);

  const getRankDelta = (model: string, metric: string) => {
    if (metric === sortBy) return null;
    const rSort = rankMap[sortBy]?.[model];
    const rMetric = rankMap[metric]?.[model];
    if (!Number.isFinite(rSort) || !Number.isFinite(rMetric)) return null;
    return (rSort as number) - (rMetric as number);
  };

  const gridTemplate = useMemo(() => buildGridTemplate(cols), [cols]);
  const contentWidth = RANK_COL_W + MODEL_COL_W + cols.length * METRIC_COL_W;
  const totalHeight = shownRows.length * ROW_H;

  useEffect(() => {
    setTableScrollWidth(Math.max(contentWidth, scrollRef.current?.clientWidth ?? 0));
  }, [contentWidth, shownRows.length, cols.length]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const update = () => {
      setViewportH(el.clientHeight);
      setTableScrollWidth(Math.max(contentWidth, el.clientWidth));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [contentWidth]);

  useEffect(() => {
    if (!scrollRef.current || !topScrollRef.current) return;
    scrollRef.current.scrollTop = 0;
    scrollRef.current.scrollLeft = 0;
    topScrollRef.current.scrollLeft = 0;
    setScrollTop(0);
  }, [population, dataset, sortBy, sortDir, modelQuery, selected.join("|")]);

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const endIndex = Math.min(
    shownRows.length,
    Math.ceil((scrollTop + viewportH) / ROW_H) + OVERSCAN
  );
  const virtualRows = shownRows.slice(startIndex, endIndex);

  const handleTopScroll = () => {
    if (!topScrollRef.current || !scrollRef.current) return;
    if (syncSourceRef.current === "main") {
      syncSourceRef.current = null;
      return;
    }
    syncSourceRef.current = "top";
    scrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
  };

  const handleMainScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setScrollTop(el.scrollTop);

    if (!topScrollRef.current) return;
    if (syncSourceRef.current === "top") {
      syncSourceRef.current = null;
    } else {
      syncSourceRef.current = "main";
      topScrollRef.current.scrollLeft = el.scrollLeft;
    }
  };

  return (
    <div onMouseLeave={hideTip}>
      {tip && (
        <div
          style={{
            position: "fixed",
            left: tip.x,
            top: tip.y,
            zIndex: 9999,
            pointerEvents: "none",
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(15,23,42,0.14)",
            background: "rgba(255,255,255,0.98)",
            boxShadow: "0 10px 24px rgba(15,23,42,0.12)",
            fontSize: 12,
            fontWeight: 800,
            color: "rgba(15,23,42,0.88)",
            maxWidth: 360,
            lineHeight: 1.25,
          }}
        >
          {tip.text}
        </div>
      )}

      <div className={styles.topRow}>
        <div>
          <div className={styles.sectionTitle}>{t.sectionTitle}</div>
        </div>
        <PopulationSelector value={population} onChange={setPopulation} />
      </div>

      <div className={styles.card} style={{ marginTop: 14 }}>
        <div className={styles.memeDefTitle}>{t.memeScoreSelect}</div>

        <div className={styles.memeDefHint}>
          <span>{t.memeScoreIntro} </span>
          <span>{t.memePatternHint} </span>
          <Link href="/explore#meme-scores" className={styles.memeDefHintLink}>
            {t.memeScoreDetailsLink}
          </Link>
        </div>

        <div className={styles.memeDefGrid}>
          {memeDefList.map((it) => {
            const active = selected.includes(it.name);
            return (
              <button
                key={it.name}
                type="button"
                className={`${styles.memeDefItem} ${active ? styles.memeDefActive : ""}`}
                onClick={() => toggleMetric(it.name)}
                aria-pressed={active}
                title={t.clickToToggleMetric}
              >
                <div className={styles.memeDefHead}>
                  <span className={styles.memeDefName}>{it.name}</span>
                  <span className={styles.memeDefTag}>{it.group}</span>
                </div>
                <div className={styles.memeDefText}>{it.def}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: 10 }}>
        <div className={styles.collapseHead}>
          <div className={styles.collapseTitleRow}>
            <div className={styles.cardTitle}>{t.filters}</div>

            <button
              type="button"
              className={styles.collapseBtn}
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
            >
              {filtersOpen ? t.hide : t.show}
              <span className={`${styles.collapseChevron} ${filtersOpen ? styles.chevOpen : ""}`} aria-hidden="true">
                ▼
              </span>
            </button>
          </div>

          <div className={styles.collapseHint}>{filterSummary}</div>
        </div>

        {filtersOpen &&
          (isHF ? (
            <div className={styles.filtersInnerSingle}>
              <div className={styles.sectionBlock}>
                <div className={styles.sectionBlockTitle}>{t.datasetSingle}</div>
                <div className={styles.radioList}>
                  {datasets.map((ds) => (
                    <label key={ds} className={styles.radioItem}>
                      <input type="radio" name="dataset" checked={dataset === ds} onChange={() => setDataset(ds)} />
                      <span>{renderDatasetName(ds)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.filtersInnerGrid}>
              <div className={styles.filtersLeftCol}>
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionBlockTitle}>{t.datasetSingle}</div>
                  <div className={styles.radioList}>
                    {datasets.map((ds) => (
                      <label key={ds} className={styles.radioItem}>
                        <input type="radio" name="dataset" checked={dataset === ds} onChange={() => setDataset(ds)} />
                        <span>{renderDatasetName(ds)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.sectionBlock}>
                  <div className={styles.sectionBlockTitle}>{t.reasoningModes}</div>
                  <div className={styles.hint}>
                    {t.reasoningModesHintLine1}
                    <br />
                    {t.reasoningModesHintLine2}
                    <br />
                    {t.reasoningModesHintLine3}
                  </div>

                  <div className={styles.controlsRow} style={{ marginTop: 8 }}>
                    <button className={styles.btn} onClick={selectAllModes} type="button">
                      {t.selectAll}
                    </button>
                    <button className={styles.btn} onClick={clearAllModes} type="button">
                      {t.clear}
                    </button>
                  </div>

                  <div className={`${styles.metricList} ${styles.modesList}`} style={{ marginTop: 6 }}>
                    {MODES.map((m) => (
                      <label key={m} className={styles.metricItem}>
                        <input type="checkbox" checked={selectedModes.includes(m)} onChange={() => toggleMode(m)} />
                        <span>{m}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.filtersRightCol}>
                <div className={styles.sectionBlock} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <div className={styles.sectionBlockTitle}>{t.organizations}</div>

                  <div className={styles.controlsRow} style={{ marginTop: 8 }}>
                    <button className={styles.btn} onClick={selectAllOrganizations} type="button">
                      {t.selectAll}
                    </button>
                    <button className={styles.btn} onClick={clearAllOrganizations} type="button">
                      {t.clear}
                    </button>
                  </div>

                  <div className={`${styles.metricList} ${styles.vendorList}`} style={{ marginTop: 6, flex: 1, maxHeight: "none" }}>
                    {ORGANIZATIONS.map((v) => (
                      <label key={v} className={styles.metricItem}>
                        <input
                          type="checkbox"
                          checked={selectedOrganizations.includes(v)}
                          onChange={() => toggleOrganization(v)}
                        />
                        <span>{v}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {(compareA || compareB) && (
        <div ref={compareWrapRef} className={styles.compareWrap}>
          <div className={styles.compareHead}>
            <div className={styles.compareTitle}>{t.modelComparison}</div>

            <div className={styles.compareSub}>
              {compareA ? <span className={styles.compareChip}>{compareA}</span> : <span className={styles.compareChipEmpty}>{t.pick1st}</span>}
              <span className={styles.compareVs}>vs</span>
              {compareB ? <span className={styles.compareChip}>{compareB}</span> : <span className={styles.compareChipEmpty}>{t.pick2nd}</span>}
            </div>

            <button className={styles.btn} type="button" onClick={clearCompare}>
              {t.clearComparison}
            </button>
          </div>

          {compareA && compareB && rowA && rowB ? (
            <div className={styles.compareGrid}>
              <CombinedRadarSVG
                titleA={compareA}
                titleB={compareB}
                valuesA={valuesA}
                valuesB={valuesB}
                metrics={cols}
                ranges={radarRanges}
                t={t}
              />
              <CompareBars
                titleA={compareA}
                titleB={compareB}
                valuesA={valuesA}
                valuesB={valuesB}
                metrics={cols}
                t={t}
              />
            </div>
          ) : (
            <div className={styles.compareHint}>{t.compareHint}</div>
          )}
        </div>
      )}

      <div className={styles.tableWrap}>
        <div className={styles.tableTop}>
          <div className={styles.leaderboardTitle}>{t.leaderboardBarPrefix}</div>

          <div className={styles.tableMetaRow}>
            <div className={styles.tableMetaInfo}>
              <span>{t.leaderboardBarSortHintPrefix}</span>
              <MetaSortHintIcon />
              <span>{t.leaderboardBarSortHintSuffix}</span>
              <span>·</span>
              <span>
                {t.population}: <b>{population}</b>
              </span>
              <span>·</span>
              <span>
                {t.dataset}: <b>{renderDatasetName(dataset)}</b>
              </span>
              <span>·</span>
              <span>
                {t.models}: <b>{total}</b>
              </span>
            </div>

            <div className={styles.tableMetaRight}>
              {loading ? t.loading : data ? `${t.sortedBy} ${metricLabel(data.sort_by, t)} (${data.sort_dir})` : ""}
            </div>
          </div>

          <div className={styles.tableTopTools}>
            <div className={styles.searchWrap}>
              <span className={styles.searchLabel}>{t.search}</span>
              <input
                className={styles.searchInput}
                value={modelQuery}
                onChange={(e) => setModelQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchAria}
              />
              {modelQuery && (
                <button className={styles.searchClear} type="button" onClick={() => setModelQuery("")} title={t.searchClearTitle}>
                  ×
                </button>
              )}
            </div>

            <label className={styles.deltaToggle}>
              <input
                type="checkbox"
                checked={showRankDelta}
                onChange={(e) => setShowRankDelta(e.target.checked)}
              />
              <span>{t.showRankDelta}</span>
            </label>
          </div>
        </div>

        <div
          ref={topScrollRef}
          className={styles.tableTopScroll}
          onScroll={handleTopScroll}
          aria-label="Top horizontal scrollbar"
        >
          <div className={styles.tableTopScrollInner} style={{ width: tableScrollWidth }} />
        </div>

        <div
          ref={scrollRef}
          className={styles.tableScroller}
          onScroll={handleMainScroll}
          style={{
            overflow: "auto",
            maxHeight: isHF ? MAX_VIEW_H : Math.min(MAX_VIEW_H, Math.max(320, shownRows.length * ROW_H + HEADER_H)),
          }}
        >
          <div style={{ width: Math.max(tableScrollWidth, contentWidth), minWidth: "100%" }}>
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 3,
                display: "grid",
                gridTemplateColumns: gridTemplate,
                width: contentWidth,
                minWidth: "100%",
              }}
            >
              <div style={{ ...headerCellBase({ justifyContent: "center" }) }}>{t.rank}</div>
              <div style={headerCellBase()}>{t.model}</div>
              {cols.map((c) => (
                <div key={c} style={{ ...headerCellBase({ justifyContent: "center" }) }}>
                  <div className={styles.thInner}>
                    <span className={styles.thLabel}>{metricLabel(c, t)}</span>
                    <SortArrows col={c} sortBy={sortBy} sortDir={sortDir} onSort={onSort} t={t} />
                  </div>
                </div>
              ))}
            </div>

            {shownRows.length === 0 && !loading ? (
              <div style={{ padding: 20, textAlign: "center", fontSize: 13 }}>{t.noData}</div>
            ) : (
              <div style={{ position: "relative", height: totalHeight }}>
                {virtualRows.map((r, i) => {
                  const rowIndex = startIndex + i;
                  const top = rowIndex * ROW_H;
                  const model = String(r.model);
                  const picked = model === compareA || model === compareB;
                  const bg =
                    picked
                      ? "rgba(37,99,235,0.10)"
                      : rowIndex % 2 === 1
                        ? "#fbfdff"
                        : "#fff";

                  return (
                    <div
                      key={`${r.model}-${r.rank}-${rowIndex}`}
                      style={{
                        position: "absolute",
                        top,
                        left: 0,
                        width: contentWidth,
                        display: "grid",
                        gridTemplateColumns: gridTemplate,
                        background: bg,
                      }}
                    >
                      <div style={{ ...bodyCellBase({ justifyContent: "center", fontVariantNumeric: "tabular-nums" }) }}>
                        {r.rank}
                      </div>

                      <div style={{ ...bodyCellBase({ fontWeight: 850 }) }}>
                        <div className={styles.modelCellInner} style={{ width: "100%" }}>
                          <span className={styles.modelName}>{model}</span>

                          <button
                            type="button"
                            className={styles.vsBtn}
                            onClick={() => onPickCompare(model)}
                            onMouseEnter={(e) => showTip(e, t.compareVsTooltip)}
                            onMouseMove={(e) => moveTip(e)}
                            onMouseLeave={hideTip}
                            aria-label={`${t.compareAriaPrefix} ${model}`}
                            title="Compare (vs.)"
                          >
                            vs.
                          </button>
                        </div>
                      </div>

                      {cols.map((c) => {
                        const val = fmt(r[c]);
                        const delta = getRankDelta(model, c);

                        let tipText = "";
                        if (delta !== null) {
                          tipText = `${t.comparedWith} ${metricLabel(sortBy, t)}: ${t.rankDeltaPrefix}${signed(delta)}`;
                        }

                        const deltaClass =
                          delta === null
                            ? ""
                            : delta < 0
                              ? styles.rankDeltaBetter
                              : delta > 0
                                ? styles.rankDeltaWorse
                                : styles.rankDeltaEqual;

                        return (
                          <div
                            key={c}
                            style={{ ...bodyCellBase({ justifyContent: "center", fontVariantNumeric: "tabular-nums" }) }}
                            onMouseEnter={(e) => {
                              if (tipText) showTip(e, tipText);
                            }}
                            onMouseMove={(e) => {
                              if (tipText) moveTip(e);
                            }}
                            onMouseLeave={hideTip}
                          >
                            <div className={styles.metricCellContent}>
                              <span className={styles.metricValue}>{val}</span>
                              {showRankDelta && delta !== null && (
                                <span className={`${styles.rankDelta} ${deltaClass}`}>
                                  {t.rankDeltaPrefix}
                                  {signed(delta)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}