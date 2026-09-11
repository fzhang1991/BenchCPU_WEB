"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type MouseEvent, type UIEvent } from "react";
import styles from "../Leaderboard.module.css";
import { useLanguage } from "@/contexts/LanguageContext";

type ApiMetrics = { metrics: string[]; n_models: number; dataset?: string };
type RowValue = string | number | boolean | null | undefined;
type Row = Record<string, RowValue>;
type SortDir = "asc" | "desc";

type ApiLeaderboard = {
  selected_metrics: string[];
  sort_by: string;
  sort_dir: SortDir;
  total: number;
  rows: Row[];
};

const DEFAULT_METRIC = "BenchCPU Time";

type CpuDetailResponse = {
  cpu: string;
  headers: string[];
  rows: Array<Array<string | number | null>>;
};

type PairwiseWorkloadResult = {
  key: string;
  benchmark: string;
  workload: string;
  n: number;
  ratio: number;
  ciL: number;
  ciR: number;
  conclusion: "A_FAST" | "A_SLOW" | "NO_SIG";
};

type PairwiseAggregate = {
  cpuA: string;
  cpuB: string;
  nPairs: number;
  ratio: number;
  ciL: number;
  ciR: number;
  fasterPct: number;
  fasterCount: number;
  slowerCount: number;
  noSigCount: number;
  byWorkload: PairwiseWorkloadResult[];
};

type PairwiseErrorCode =
  | "PAIRWISE_NO_ROUND_OVERLAP"
  | "PAIRWISE_NO_WORKLOAD_OVERLAP"
  | "PAIRWISE_NO_VALID_SAMPLES"
  | "PAIRWISE_FETCH_FAILED"
  | "PAIRWISE_UNKNOWN";

const APPENDIX_WORKLOAD_ORDER = [
  "numpy/matmul",
  "numpy/svd",
  "numpy/fft",
  "tuf/metadata",
  "requests/json",
  "raytrace",
  "chaos_fractal",
  "deltablue",
  "pyflate",
  "go_board_game",
  "resnet50/inference",
  "resnet50/training",
  "bert/eval",
  "transformer_inference",
  "transformer_train",
  "ffmpeg",
  "redis",
  "openssl",
  "zstd",
  "gcc_compile",
  "clang_compile",
  "lapack/solve",
  "lapack/eigen",
  "lapack/svd",
  "rocksdb",
  "opencv/fft_batch",
  "opencv/conv_heavy",
  "opencv/mandelbrot",
  "opencv/jacobi",
  "opencv/canny",
  "opencv/optical_flow",
  "opencv/motion_blur",
  "opencv/background_sub",
  "opencv/color_tracking",
  "opencv/feature_match",
  "guava/event",
  "guava/cache",
  "guava/graph",
  "guava/bloom",
  "guava/immutable",
  "cassandra",
  "kafka",
  "biogo/igor",
  "bleve/index",
  "cockroachdb/kv",
  "cockroachdb/tpcc",
  "esbuild/ThreeJS",
  "esbuild/RomeTS",
  "gc_garbage",
  "go_compiler",
  "gopher_lua",
  "go_json",
  "go_markdown",
  "tile38/kdtree",
] as const;

const APPENDIX_ORDER_MAP = new Map(APPENDIX_WORKLOAD_ORDER.map((name, i) => [name, i]));

const WORKLOAD_ALIAS_TO_APPENDIX: Record<string, string> = {
  matmul: "numpy/matmul",
  svd: "numpy/svd",
  fft: "numpy/fft",
  "tuf-metadata": "tuf/metadata",
  "requests-json": "requests/json",
  "go-board-game": "go_board_game",
  resnet50_inference: "resnet50/inference",
  resnet50_training: "resnet50/training",
  bert_eval: "bert/eval",
  "redis-benchmark": "redis",
  lapack_solve: "lapack/solve",
  lapack_eigen: "lapack/eigen",
  lapack_svd: "lapack/svd",
  rocksdb_cpu: "rocksdb",
  fft_batch: "opencv/fft_batch",
  conv_heavy: "opencv/conv_heavy",
  mandelbrot: "opencv/mandelbrot",
  jacobi: "opencv/jacobi",
  canny: "opencv/canny",
  optical_flow: "opencv/optical_flow",
  motion_blur: "opencv/motion_blur",
  background_sub: "opencv/background_sub",
  color_tracking: "opencv/color_tracking",
  feature_match: "opencv/feature_match",
  guava_event: "guava/event",
  guava_cache: "guava/cache",
  guava_graph: "guava/graph",
  guava_bloom: "guava/bloom",
  guava_immutable: "guava/immutable",
  cassandra_stress_read: "cassandra",
  kafka_producer_perf: "kafka",
  "biogo-igor": "biogo/igor",
  "bleve-index": "bleve/index",
  kv: "cockroachdb/kv",
  tpcc: "cockroachdb/tpcc",
  json: "go_json",
  markdown_render: "go_markdown",
  kdtree: "tile38/kdtree",
  "chaos-fractal": "chaos_fractal",
};

function canonicalizeWorkloadName(name: string) {
  const raw = String(name || "").trim();
  if (!raw) return "";
  if ((APPENDIX_ORDER_MAP as Map<string, number>).has(raw)) return raw;
  const mapped = WORKLOAD_ALIAS_TO_APPENDIX[raw];
  if (mapped) return mapped;
  const normalized = raw.replace(/-/g, "_");
  return WORKLOAD_ALIAS_TO_APPENDIX[normalized] ?? normalized;
}

function fmt(v: unknown) {
  if (v === null || v === undefined) return "-";
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "-";
  if (Math.abs(n) <= 1) return (n * 100).toFixed(2);
  return n.toFixed(3);
}

function numOrNaN(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function signed(n: number) {
  if (!Number.isFinite(n)) return "";
  return n > 0 ? `+${n}` : `${n}`;
}

function clampPct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function defaultSortDir(metric: string): SortDir {
  return metric === DEFAULT_METRIC ? "asc" : "desc";
}

function tCritical95(df: number) {
  // Two-sided 95% CI uses t_{0.025, df}
  const table: Record<number, number> = {
    1: 12.706,
    2: 4.303,
    3: 3.182,
    4: 2.776,
    5: 2.571,
    6: 2.447,
    7: 2.365,
    8: 2.306,
    9: 2.262,
    10: 2.228,
    11: 2.201,
    12: 2.179,
    13: 2.160,
    14: 2.145,
    15: 2.131,
    16: 2.120,
    17: 2.110,
    18: 2.101,
    19: 2.093,
    20: 2.086,
    21: 2.080,
    22: 2.074,
    23: 2.069,
    24: 2.064,
    25: 2.060,
    26: 2.056,
    27: 2.052,
    28: 2.048,
    29: 2.045,
    30: 2.042,
  };
  if (df <= 1) return table[1];
  if (df <= 30) return table[Math.floor(df)] ?? 2.042;
  if (df <= 40) return 2.021;
  if (df <= 60) return 2.000;
  if (df <= 120) return 1.980;
  return 1.960;
}

function extractRoundOrder(name: string) {
  const m = name.match(/(?:round_?|Round\s*)(\d+)/i);
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
}

function getRoundIndexMap(headers: string[]) {
  const out = new Map<number, number>();
  headers.forEach((h, i) => {
    if (!/(?:_time$)|(?:^Round\d+\s+Time\s*\(s\)$)/i.test(h)) return;
    const ord = extractRoundOrder(h);
    if (!Number.isFinite(ord) || ord === Number.MAX_SAFE_INTEGER) return;
    out.set(ord, i);
  });
  return out;
}

function computePairwise(
  cpuA: string,
  a: CpuDetailResponse,
  cpuB: string,
  b: CpuDetailResponse
): PairwiseAggregate {
  const aRoundMap = getRoundIndexMap(a.headers);
  const bRoundMap = getRoundIndexMap(b.headers);
  const commonRounds = [...aRoundMap.keys()]
    .filter((r) => bRoundMap.has(r))
    .sort((x, y) => x - y);

  if (commonRounds.length === 0) {
    throw new Error("PAIRWISE_NO_ROUND_OVERLAP");
  }

  const findIndex = (headers: string[], candidates: string[]) => {
    for (const c of candidates) {
      const i = headers.findIndex((h) => h.toLowerCase() === c.toLowerCase());
      if (i >= 0) return i;
    }
    return -1;
  };

  const aBenchIdx = findIndex(a.headers, ["benchmark_name", "benchmark"]);
  const aWlIdx = findIndex(a.headers, ["workload_name", "workload", "Workload"]);
  const bBenchIdx = findIndex(b.headers, ["benchmark_name", "benchmark"]);
  const bWlIdx = findIndex(b.headers, ["workload_name", "workload", "Workload"]);

  const buildMap = (
    rows: Array<Array<string | number | null>>,
    benchI: number,
    wlI: number,
    roundMap: Map<number, number>
  ) => {
    const out = new Map<string, Array<number | null>>();
    for (const row of rows) {
      const bench = benchI >= 0 ? String(row[benchI] ?? "").trim() : "";
      const wl = String(row[wlI] ?? "").trim();
      if (!wl) continue;
      const key = `${bench || "_"}||${wl}`;
      const vals = commonRounds.map((roundNo) => {
        const i = roundMap.get(roundNo);
        if (i === undefined) return null;
        const n = Number(row[i]);
        return Number.isFinite(n) ? n : null;
      });
      out.set(key, vals);
    }
    return out;
  };

  const mapA = buildMap(a.rows, aBenchIdx, aWlIdx, aRoundMap);
  const mapB = buildMap(b.rows, bBenchIdx, bWlIdx, bRoundMap);

  const keysByWorkload = (m: Map<string, Array<number | null>>) => {
    const out = new Map<string, Array<number | null>>();
    for (const [k, v] of m.entries()) {
      const wl = k.split("||")[1] ?? k;
      out.set(wl, v);
    }
    return out;
  };

  const mapAByWl = keysByWorkload(mapA);
  const mapBByWl = keysByWorkload(mapB);
  const keys = [...mapAByWl.keys()]
    .filter((k) => mapBByWl.has(k))
    .sort((x, y) => x.localeCompare(y));

  if (keys.length === 0) {
    throw new Error("PAIRWISE_NO_WORKLOAD_OVERLAP");
  }

  const byWorkload: PairwiseWorkloadResult[] = [];
  const allLogs: number[] = [];
  let fasterCount = 0;
  let slowerCount = 0;
  let noSigCount = 0;

  for (const key of keys) {
    const arrA = mapAByWl.get(key)!;
    const arrB = mapBByWl.get(key)!;
    const logs: number[] = [];
    for (let i = 0; i < commonRounds.length; i++) {
      const va = arrA[i];
      const vb = arrB[i];
      if (!Number.isFinite(va) || !Number.isFinite(vb) || (va as number) <= 0 || (vb as number) <= 0) continue;
      logs.push(Math.log((va as number) / (vb as number)));
    }
    if (logs.length < 2) continue;

    const n = logs.length;
    const d = logs.reduce((s, x) => s + x, 0) / n;
    const ss = logs.reduce((s, x) => s + (x - d) * (x - d), 0);
    const sx = Math.sqrt(ss / (n - 1));
    const t = tCritical95(n - 1);
    const margin = t * sx / Math.sqrt(n);
    const l = d - margin;
    const r = d + margin;
    const ratio = Math.exp(d);
    const ciL = Math.exp(l);
    const ciR = Math.exp(r);

    let conclusion: PairwiseWorkloadResult["conclusion"] = "NO_SIG";
    if (ciR < 1) conclusion = "A_FAST";
    else if (ciL > 1) conclusion = "A_SLOW";

    if (conclusion === "A_FAST") fasterCount += 1;
    else if (conclusion === "A_SLOW") slowerCount += 1;
    else noSigCount += 1;

    allLogs.push(...logs);
    byWorkload.push({ key, benchmark: "", workload: key, n, ratio, ciL, ciR, conclusion });
  }

  if (byWorkload.length === 0 || allLogs.length < 2) {
    throw new Error("PAIRWISE_NO_VALID_SAMPLES");
  }

  const nPairs = allLogs.length;
  const dAll = allLogs.reduce((s, x) => s + x, 0) / nPairs;
  const ssAll = allLogs.reduce((s, x) => s + (x - dAll) * (x - dAll), 0);
  const sxAll = Math.sqrt(ssAll / (nPairs - 1));
  const tAll = tCritical95(nPairs - 1);
  const marginAll = tAll * sxAll / Math.sqrt(nPairs);
  const lAll = dAll - marginAll;
  const rAll = dAll + marginAll;
  const ratioAll = Math.exp(dAll);
  const ciLAll = Math.exp(lAll);
  const ciRAll = Math.exp(rAll);
  const fasterPct = (1 - ratioAll) * 100;

  byWorkload.sort((x, y) => {
    const cx = canonicalizeWorkloadName(x.workload);
    const cy = canonicalizeWorkloadName(y.workload);
    const ox = (APPENDIX_ORDER_MAP as Map<string, number>).get(cx) ?? Number.MAX_SAFE_INTEGER;
    const oy = (APPENDIX_ORDER_MAP as Map<string, number>).get(cy) ?? Number.MAX_SAFE_INTEGER;
    if (ox !== oy) return ox - oy;
    return x.workload.localeCompare(y.workload);
  });

  return {
    cpuA,
    cpuB,
    nPairs,
    ratio: ratioAll,
    ciL: ciLAll,
    ciR: ciRAll,
    fasterPct,
    fasterCount,
    slowerCount,
    noSigCount,
    byWorkload,
  };
}

const HEADER_H = 56;
const ROW_H = 48;
const OVERSCAN = 12;
const MAX_VIEW_H = 680;

function SortArrow({
  direction,
  active,
  onClick,
  title,
}: {
  direction: "asc" | "desc";
  active: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      className={`${styles.sortArrowBtn} ${active ? styles.sortArrowActive : ""}`}
      onClick={onClick}
      title={title}
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
}: {
  col: string;
  sortBy: string;
  sortDir: SortDir;
  onSort: (col: string, dir: SortDir) => void;
}) {
  const isActive = col === sortBy;
  return (
    <span className={styles.sortInline}>
      <SortArrow
        direction="asc"
        active={isActive && sortDir === "asc"}
        onClick={() => onSort(col, "asc")}
        title={`Sort ${col} ascending`}
      />
      <SortArrow
        direction="desc"
        active={isActive && sortDir === "desc"}
        onClick={() => onSort(col, "desc")}
        title={`Sort ${col} descending`}
      />
    </span>
  );
}

function buildGridTemplate(cols: string[]) {
  return `56px minmax(280px, 1fr) ${cols.map(() => `minmax(100px, 1fr)`).join(" ")}`;
}

function headerCellBase(extra?: React.CSSProperties): React.CSSProperties {
  return {
    height: HEADER_H,
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
    padding: "0 8px",
    fontWeight: 900,
    fontSize: 12,
    color: "var(--text)",
    background: "linear-gradient(180deg, #eff6ff 0%, #e8f1ff 100%)",
    borderBottom: "1px solid rgba(15,23,42,0.10)",
    whiteSpace: "nowrap",
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
    textOverflow: "ellipsis",
    ...extra,
  };
}

export default function LeaderboardClient() {
  const { lang } = useLanguage();

  const t = useMemo(
    () => ({
      sectionTitle: lang === "zh" ? "CPU 排行榜" : "BenchCPU Leaderboard",
      rank: lang === "zh" ? "排名" : "Rank",
      model: lang === "zh" ? "CPU" : "CPU",
      showing: lang === "zh" ? "显示" : "Showing",
      loading: lang === "zh" ? "加载中..." : "Loading...",
      sortedBy: lang === "zh" ? "排序依据" : "Sorted by",
      rankingMetrics: lang === "zh" ? "排行指标" : "Ranking metrics",
      selectAllMetrics: lang === "zh" ? "全选" : "Select all",
      deselectAllMetrics: lang === "zh" ? "全取消" : "Clear all",
      noData: lang === "zh" ? "暂无数据" : "No data",
      search: lang === "zh" ? "搜索:" : "Search:",
      searchPlaceholder: lang === "zh" ? "输入 CPU 名称…" : "Type CPU name…",
      searchClearTitle: lang === "zh" ? "清除搜索" : "Clear search",
      compareVsTooltip: lang === "zh" ? "vs.: 选择两个 CPU 进行对比" : "vs.: choose CPUs for comparison",
      compareAriaPrefix: lang === "zh" ? "对比" : "Compare",
      comparedWith: lang === "zh" ? "与" : "Compared with",
      showRankDelta: lang === "zh" ? "显示排名变化" : "Show rank change",
      rankDeltaPrefix: "",
      pick1st: lang === "zh" ? "选择第1个" : "Pick 1st",
      pick2nd: lang === "zh" ? "选择第2个" : "Pick 2nd",
      clearComparison: lang === "zh" ? "清除对比" : "Clear comparison",
      modelComparison: lang === "zh" ? "CPU 对比" : "CPU Comparison",
      pairwiseTitle: lang === "zh" ? "CPU 两两比较（BenchCPU 对数比值法）" : "Pairwise CPU Comparison (BenchCPU Log-Ratio)",
      cpuA: lang === "zh" ? "CPU A" : "CPU A",
      cpuB: lang === "zh" ? "CPU B" : "CPU B",
      selectCpu: lang === "zh" ? "请选择 CPU" : "Select CPU",
      pairwiseLoading: lang === "zh" ? "计算中..." : "Computing...",
      pairwiseNoSelection: lang === "zh" ? "请选择两个不同的 CPU 进行比较。" : "Select two different CPUs to compare.",
      pairwiseSummary: lang === "zh" ? "汇总" : "Summary",
      ratioLabel: lang === "zh" ? "Time A/Time B" : "Time A/Time B",
      ciLabel: lang === "zh" ? "95% CI" : "95% CI",
      fasterLabel: lang === "zh" ? "A 比 B 快" : "A faster than B",
      slowerLabel: lang === "zh" ? "A 比 B 慢" : "A slower than B",
      workloadResults: lang === "zh" ? "各 workload 结果" : "Per-workload Results",
      workload: lang === "zh" ? "Workload" : "Workload",
      conclusion: lang === "zh" ? "结论" : "Conclusion",
      aFast: lang === "zh" ? "A 显著更快" : "A significantly faster",
      aSlow: lang === "zh" ? "A 显著更慢" : "A significantly slower",
      noSig: lang === "zh" ? "无显著差异" : "No significant difference",
      errNoRoundOverlap: lang === "zh" ? "轮次不重叠：两台 CPU 的可用轮次列无法对齐。" : "Round mismatch: no overlapping round columns between selected CPUs.",
      errNoWorkloadOverlap: lang === "zh" ? "workload 不重叠：两台 CPU 的 workload 名称没有交集。" : "Workload mismatch: no overlapping workload names between selected CPUs.",
      errNoValidSamples: lang === "zh" ? "workload-轮次样本无效：存在交集但没有可用于统计的有效正数样本。" : "No valid workload-round samples: overlap exists but no valid positive samples for statistics.",
      errPairwiseFetchFailed: lang === "zh" ? "明细数据获取失败，请检查后端接口是否可用。" : "Failed to fetch CPU detail data. Please check backend API availability.",
      errPairwiseUnknown: lang === "zh" ? "两两比较计算失败，请稍后重试。" : "Pairwise comparison failed. Please try again.",
      compareHint: lang === "zh"
        ? "请选择两个 CPU：点击 vs. 按钮选择第一个，再选择第二个即可生成对比面板。"
        : "Please select two CPUs: click the vs. button next to any CPU. Select a second one to generate the comparison panel.",
      total: lang === "zh" ? "总计" : "Total",
      cpus: lang === "zh" ? "个 CPU" : " CPUs",
    }),
    [lang]
  );

  const [nModels, setNModels] = useState(0);
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>(DEFAULT_METRIC);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [data, setData] = useState<ApiLeaderboard | null>(null);
  const [loading, setLoading] = useState(false);

  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [modelQuery, setModelQuery] = useState("");
  const [showRankDelta, setShowRankDelta] = useState(true);
  const [pairCpuA, setPairCpuA] = useState("");
  const [pairCpuB, setPairCpuB] = useState("");
  const [pairwiseLoading, setPairwiseLoading] = useState(false);
  const [pairwiseErrorCode, setPairwiseErrorCode] = useState<PairwiseErrorCode | null>(null);
  const [pairwiseResult, setPairwiseResult] = useState<PairwiseAggregate | null>(null);

  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const syncSourceRef = useRef<"top" | "main" | null>(null);

  const [tableScrollWidth, setTableScrollWidth] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(MAX_VIEW_H);

  // Fetch available metrics
  useEffect(() => {
    (async () => {
      const res = await fetch("/backend/api/metrics");
      if (!res.ok) return;
      const js = (await res.json()) as ApiMetrics;
      const metrics = js.metrics ?? [];
      const defaultMetric = metrics.includes(DEFAULT_METRIC) ? DEFAULT_METRIC : metrics[0];
      setNModels(js.n_models ?? 0);
      setAvailableMetrics(metrics);
      setSelected(defaultMetric ? [defaultMetric] : []);
      if (defaultMetric) {
        setSortBy(defaultMetric);
        setSortDir(defaultSortDir(defaultMetric));
      }
    })();
  }, []);

  // Fetch leaderboard data
  useEffect(() => {
    if (selected.length === 0) return;

    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("dataset", "BenchCPU");
        params.set("metrics", selected.join(","));
        params.set("sort_by", sortBy);
        params.set("sort_dir", sortDir);
        params.set("limit", String(1000000));
        params.set("offset", "0");

        const res = await fetch(`/backend/api/leaderboard?${params.toString()}`);
        if (!res.ok) throw new Error(`leaderboard api failed: ${res.status}`);
        const js = (await res.json()) as ApiLeaderboard;
        setData(js);
      } finally {
        setLoading(false);
      }
    })();
  }, [selected, sortBy, sortDir]);

  useEffect(() => {
    if (!pairCpuA || !pairCpuB || pairCpuA === pairCpuB) {
      setPairwiseResult(null);
      setPairwiseErrorCode(null);
      setPairwiseLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setPairwiseLoading(true);
      setPairwiseErrorCode(null);
      try {
        const [resA, resB] = await Promise.all([
          fetch(`/backend/api/cpu-detail?cpu=${encodeURIComponent(pairCpuA)}`),
          fetch(`/backend/api/cpu-detail?cpu=${encodeURIComponent(pairCpuB)}`),
        ]);
        if (!resA.ok || !resB.ok) {
          throw new Error("PAIRWISE_FETCH_FAILED");
        }

        const [detailA, detailB] = (await Promise.all([
          resA.json(),
          resB.json(),
        ])) as [CpuDetailResponse, CpuDetailResponse];

        const result = computePairwise(pairCpuA, detailA, pairCpuB, detailB);
        if (!cancelled) setPairwiseResult(result);
      } catch (err) {
        if (!cancelled) {
          setPairwiseResult(null);
          const raw = err instanceof Error ? err.message : "PAIRWISE_UNKNOWN";
          const known: PairwiseErrorCode[] = [
            "PAIRWISE_NO_ROUND_OVERLAP",
            "PAIRWISE_NO_WORKLOAD_OVERLAP",
            "PAIRWISE_NO_VALID_SAMPLES",
            "PAIRWISE_FETCH_FAILED",
            "PAIRWISE_UNKNOWN",
          ];
          setPairwiseErrorCode((known as string[]).includes(raw) ? (raw as PairwiseErrorCode) : "PAIRWISE_UNKNOWN");
        }
      } finally {
        if (!cancelled) setPairwiseLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pairCpuA, pairCpuB]);

  const onSort = (col: string, dir: SortDir) => {
    setSortBy(col);
    setSortDir(dir);
  };

  const toggleMetric = (metric: string) => {
    setSelected((prev) => {
      const hasMetric = prev.includes(metric);
      if (hasMetric && prev.length === 1) return prev;
      const next = hasMetric
        ? prev.filter((m) => m !== metric)
        : availableMetrics.filter((m) => m === metric || prev.includes(m));

      if (!hasMetric) {
        setSortBy(metric);
        setSortDir(defaultSortDir(metric));
        return next;
      }

      if (!next.includes(sortBy)) {
        const nextSort = next[0] ?? metric;
        setSortBy(nextSort);
        setSortDir(defaultSortDir(nextSort));
      }

      return next;
    });
  };

  const allMetricsSelected = availableMetrics.length > 0 && selected.length === availableMetrics.length;

  const toggleAllMetrics = () => {
    if (allMetricsSelected) {
      const defaultMetric = availableMetrics.includes(DEFAULT_METRIC) ? DEFAULT_METRIC : availableMetrics[0];
      setSelected(defaultMetric ? [defaultMetric] : []);
      if (defaultMetric) {
        setSortBy(defaultMetric);
        setSortDir(defaultSortDir(defaultMetric));
      }
      return;
    }

    setSelected(availableMetrics);
  };

  const cols = data?.selected_metrics ?? selected;
  const total = data?.total ?? nModels;
  const allRows = useMemo(() => data?.rows ?? [], [data?.rows]);

  const cpuOptions = useMemo(
    () => [...new Set(allRows.map((r) => String(r.model)).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [allRows]
  );

  const shownRows = useMemo(() => {
    const q = modelQuery.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((r) => String(r.model).toLowerCase().includes(q));
  }, [allRows, modelQuery]);

  const metricExtents = useMemo(() => {
    const out: Record<string, { min: number; max: number }> = {};
    for (const metric of cols) {
      const values = allRows.map((r) => numOrNaN(r[metric])).filter(Number.isFinite);
      if (values.length === 0) continue;
      out[metric] = {
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }
    return out;
  }, [allRows, cols]);

  const getMetricBarPercent = (metric: string, value: number) => {
    const extents = metricExtents[metric];
    if (!extents || !Number.isFinite(value) || value <= 0) return 0;
    if (metric === DEFAULT_METRIC) return clampPct((extents.min / value) * 100);
    return clampPct((value / extents.max) * 100);
  };

  const rankMap = useMemo(() => {
    const mp: Record<string, Record<string, number>> = {};

    for (const m of cols) {
      // Time: lower is better (ascending); SPEC*: higher is better (descending)
      const asc = m === "BenchCPU Time";
      const sorted = [...allRows].sort((a, b) => {
        const va = numOrNaN(a[m]);
        const vb = numOrNaN(b[m]);
        const aBad = !Number.isFinite(va);
        const bBad = !Number.isFinite(vb);
        if (aBad && bBad) return String(a.model).localeCompare(String(b.model));
        if (aBad) return 1;
        if (bBad) return -1;
        if (va === vb) return String(a.model).localeCompare(String(b.model));
        return asc ? va - vb : vb - va;
      });
      mp[m] = {};
      sorted.forEach((r, i) => {
        mp[m][String(r.model)] = i + 1;
      });
    }
    return mp;
  }, [allRows, cols]);

  const showTip = (e: MouseEvent, text: string) => setTip({ x: e.clientX + 12, y: e.clientY + 12, text });
  const moveTip = (e: MouseEvent) => setTip((prev) => (prev ? { ...prev, x: e.clientX + 12, y: e.clientY + 12 } : prev));
  const hideTip = () => setTip(null);

  const getRankDelta = (model: string, metric: string) => {
    if (metric === sortBy) return null;
    const rSort = rankMap[sortBy]?.[model];
    const rMetric = rankMap[metric]?.[model];
    if (!Number.isFinite(rSort) || !Number.isFinite(rMetric)) return null;
    return (rSort as number) - (rMetric as number);
  };

  const gridTemplate = useMemo(() => buildGridTemplate(cols), [cols]);
  const totalHeight = shownRows.length * ROW_H;
  const selectedKey = selected.join("|");

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const update = () => {
      setViewportH(el.clientHeight);
      setTableScrollWidth(el.clientWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!scrollRef.current || !topScrollRef.current) return;
    scrollRef.current.scrollTop = 0;
    scrollRef.current.scrollLeft = 0;
    topScrollRef.current.scrollLeft = 0;
    setScrollTop(0);
  }, [sortBy, sortDir, modelQuery, selectedKey]);

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const endIndex = Math.min(shownRows.length, Math.ceil((scrollTop + viewportH) / ROW_H) + OVERSCAN);
  const virtualRows = shownRows.slice(startIndex, endIndex);

  const handleTopScroll = () => {
    if (!topScrollRef.current || !scrollRef.current) return;
    if (syncSourceRef.current === "main") { syncSourceRef.current = null; return; }
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
            position: "fixed", left: tip.x, top: tip.y, zIndex: 9999, pointerEvents: "none",
            padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.14)",
            background: "rgba(255,255,255,0.98)", boxShadow: "0 10px 24px rgba(15,23,42,0.12)",
            fontSize: 12, fontWeight: 800, color: "rgba(15,23,42,0.88)", maxWidth: 360, lineHeight: 1.25,
          }}
        >
          {tip.text}
        </div>
      )}

      <div className={styles.topRow}>
        <div>
          <div className={styles.sectionTitle}>{t.sectionTitle}</div>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          padding: "14px 14px 12px",
          border: "1px solid rgba(15,23,42,0.10)",
          borderRadius: 12,
          background: "#ffffff",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>{t.pairwiseTitle}</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(180px, 280px))", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#334155", fontWeight: 700 }}>{t.cpuA}</span>
            <select
              value={pairCpuA}
              onChange={(e) => setPairCpuA(e.target.value)}
              style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 10px", fontSize: 13 }}
            >
              <option value="">{t.selectCpu}</option>
              {cpuOptions.map((cpu) => (
                <option key={`a-${cpu}`} value={cpu}>{cpu}</option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#334155", fontWeight: 700 }}>{t.cpuB}</span>
            <select
              value={pairCpuB}
              onChange={(e) => setPairCpuB(e.target.value)}
              style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 10px", fontSize: 13 }}
            >
              <option value="">{t.selectCpu}</option>
              {cpuOptions.map((cpu) => (
                <option key={`b-${cpu}`} value={cpu}>{cpu}</option>
              ))}
            </select>
          </label>
        </div>

        {(!pairCpuA || !pairCpuB || pairCpuA === pairCpuB) && (
          <div style={{ marginTop: 10, color: "#64748b", fontSize: 12 }}>{t.pairwiseNoSelection}</div>
        )}
        {pairwiseLoading && <div style={{ marginTop: 10, color: "#0f172a", fontSize: 12 }}>{t.pairwiseLoading}</div>}
        {pairwiseErrorCode && (
          <div style={{ marginTop: 10, color: "#b91c1c", fontSize: 12 }}>
            {pairwiseErrorCode === "PAIRWISE_NO_ROUND_OVERLAP"
              ? t.errNoRoundOverlap
              : pairwiseErrorCode === "PAIRWISE_NO_WORKLOAD_OVERLAP"
                ? t.errNoWorkloadOverlap
                : pairwiseErrorCode === "PAIRWISE_NO_VALID_SAMPLES"
                  ? t.errNoValidSamples
                  : pairwiseErrorCode === "PAIRWISE_FETCH_FAILED"
                    ? t.errPairwiseFetchFailed
                    : t.errPairwiseUnknown}
          </div>
        )}

        {pairwiseResult && !pairwiseLoading && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{t.pairwiseSummary}</div>
            {(() => {
              const isAFaster = pairwiseResult.fasterPct >= 0;
              const speedLabel = isAFaster ? t.fasterLabel : t.slowerLabel;
              const speedPct = Math.abs(pairwiseResult.fasterPct);
              const speedBorder = isAFaster ? "#dcfce7" : "#fecaca";
              const speedBg = isAFaster ? "#f0fdf4" : "#fef2f2";
              const speedColor = isAFaster ? "#14532d" : "#991b1b";
              return (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, border: "1px solid #dbeafe", background: "#eff6ff", color: "#1e3a8a", borderRadius: 999, padding: "6px 10px", fontWeight: 700 }}>
                    {t.ratioLabel}: {pairwiseResult.ratio.toFixed(2)}
                  </span>
                  <span style={{ fontSize: 12, border: "1px solid #dbeafe", background: "#eff6ff", color: "#1e3a8a", borderRadius: 999, padding: "6px 10px", fontWeight: 700 }}>
                    {t.ciLabel}: [{pairwiseResult.ciL.toFixed(2)}, {pairwiseResult.ciR.toFixed(2)}]
                  </span>
                  <span style={{ fontSize: 12, border: `1px solid ${speedBorder}`, background: speedBg, color: speedColor, borderRadius: 999, padding: "6px 10px", fontWeight: 700 }}>
                    {speedLabel}: {speedPct.toFixed(0)}%
                  </span>
                  <span style={{ fontSize: 12, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#0f172a", borderRadius: 999, padding: "6px 10px", fontWeight: 700 }}>
                    {t.aFast}: {pairwiseResult.fasterCount} | {t.aSlow}: {pairwiseResult.slowerCount} | {t.noSig}: {pairwiseResult.noSigCount}
                  </span>
                </div>
              );
            })()}

            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{t.workloadResults}</div>
            <div style={{ overflowX: "auto", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, borderBottom: "1px solid rgba(15,23,42,0.08)" }}>#</th>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, borderBottom: "1px solid rgba(15,23,42,0.08)" }}>{t.workload}</th>
                    <th style={{ textAlign: "center", padding: "8px 10px", fontSize: 12, borderBottom: "1px solid rgba(15,23,42,0.08)" }}>{t.ratioLabel}</th>
                    <th style={{ textAlign: "center", padding: "8px 10px", fontSize: 12, borderBottom: "1px solid rgba(15,23,42,0.08)" }}>{t.ciLabel}</th>
                    <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 12, borderBottom: "1px solid rgba(15,23,42,0.08)" }}>{t.conclusion}</th>
                  </tr>
                </thead>
                <tbody>
                  {pairwiseResult.byWorkload.map((w, i) => {
                    const isFast = w.conclusion === "A_FAST";
                    const isSlow = w.conclusion === "A_SLOW";
                    const label = isFast ? (lang === "zh" ? "A快" : "A faster") : isSlow ? (lang === "zh" ? "A慢" : "A slower") : t.noSig;
                    const icon = isFast ? "✅" : isSlow ? "❌" : "➖";
                    const fg = isFast ? "#166534" : isSlow ? "#b91c1c" : "#6d28d9";
                    const bg = isFast ? "#f0fdf4" : isSlow ? "#fef2f2" : "#f5f3ff";
                    const bd = isFast ? "#bbf7d0" : isSlow ? "#fecaca" : "#ddd6fe";
                    return (
                      <tr key={w.key} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                        <td style={{ padding: "8px 10px", fontSize: 12, borderTop: "1px solid rgba(15,23,42,0.06)" }}>{i + 1}</td>
                        <td style={{ padding: "8px 10px", fontSize: 12, borderTop: "1px solid rgba(15,23,42,0.06)" }}>{w.workload}</td>
                        <td style={{ textAlign: "center", padding: "8px 10px", fontSize: 12, borderTop: "1px solid rgba(15,23,42,0.06)" }}>{w.ratio.toFixed(2)}</td>
                        <td style={{ textAlign: "center", padding: "8px 10px", fontSize: 12, borderTop: "1px solid rgba(15,23,42,0.06)" }}>[{w.ciL.toFixed(2)}, {w.ciR.toFixed(2)}]</td>
                        <td style={{ padding: "8px 10px", fontSize: 12, borderTop: "1px solid rgba(15,23,42,0.06)" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              color: fg,
                              background: bg,
                              border: `1px solid ${bd}`,
                              borderRadius: 999,
                              padding: "3px 10px",
                              fontWeight: 800,
                            }}
                          >
                            <span aria-hidden="true">{icon}</span>
                            <span>{label}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className={styles.tableWrap} style={{ marginTop: 10 }}>
        <div className={styles.tableTop}>
          <div className={styles.leaderboardTitle}>
            {loading ? t.loading : `${t.total}: ${total}${t.cpus}`}
          </div>

          <div className={styles.tableMetaRow}>
            <div className={styles.tableMetaInfo}>
              {data ? `${t.sortedBy} ${data.sort_by} (${data.sort_dir})` : ""}
            </div>
          </div>

          <div className={styles.tableTopTools}>
            <div className={styles.metricPicker} aria-label={t.rankingMetrics}>
              <span className={styles.metricPickerLabel}>{t.rankingMetrics}</span>
              <div className={styles.metricPickerButtons}>
                <button
                  type="button"
                  className={`${styles.metricButton} ${styles.metricBulkButton}`}
                  onClick={toggleAllMetrics}
                  aria-pressed={allMetricsSelected}
                >
                  {allMetricsSelected ? t.deselectAllMetrics : t.selectAllMetrics}
                </button>
                {availableMetrics.map((metric) => {
                  const checked = selected.includes(metric);
                  return (
                    <button
                      key={metric}
                      type="button"
                      className={`${styles.metricButton} ${checked ? styles.metricButtonActive : ""}`}
                      onClick={() => toggleMetric(metric)}
                      aria-pressed={checked}
                    >
                      {metric}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.searchWrap}>
              <span className={styles.searchLabel}>{t.search}</span>
              <input
                className={styles.searchInput}
                value={modelQuery}
                onChange={(e) => setModelQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
              />
              {modelQuery && (
                <button className={styles.searchClear} type="button" onClick={() => setModelQuery("")} title={t.searchClearTitle}>
                  ×
                </button>
              )}
            </div>

            <label className={styles.deltaToggle}>
              <input type="checkbox" checked={showRankDelta} onChange={(e) => setShowRankDelta(e.target.checked)} />
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
            maxHeight: Math.min(MAX_VIEW_H, Math.max(320, shownRows.length * ROW_H + HEADER_H)),
          }}
        >
          <div style={{ width: "100%" }}>
            {/* Header */}
            <div
              style={{
                position: "sticky", top: 0, zIndex: 3,
                display: "grid", gridTemplateColumns: gridTemplate,
                width: "100%",
              }}
            >
              <div style={{ ...headerCellBase({ justifyContent: "center" }) }}>{t.rank}</div>
              <div style={headerCellBase()}>{t.model}</div>
              {cols.map((c) => (
                <div key={c} style={{ ...headerCellBase({ justifyContent: "center" }) }}>
                  <div className={styles.thInner}>
                    <span className={styles.thLabel}>{c}</span>
                    <SortArrows col={c} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                  </div>
                </div>
              ))}
            </div>

            {/* Body */}
            {shownRows.length === 0 && !loading ? (
              <div style={{ padding: 20, textAlign: "center", fontSize: 13 }}>{t.noData}</div>
            ) : (
              <div style={{ position: "relative", height: totalHeight }}>
                {virtualRows.map((r, i) => {
                  const rowIndex = startIndex + i;
                  const cpuInfo = r.cpu_info ? String(r.cpu_info) : "";
                  const top = rowIndex * ROW_H;
                  const model = String(r.model);
                  const bg = rowIndex % 2 === 1 ? "#fbfdff" : "#fff";

                  return (
                    <div
                      key={`${r.model}-${r.rank}-${rowIndex}`}
                      style={{
                        position: "absolute", top, left: 0,
                        width: "100%",
                        display: "grid", gridTemplateColumns: gridTemplate,
                        background: bg,
                      }}
                    >
                      <div style={{ ...bodyCellBase({ justifyContent: "center", fontVariantNumeric: "tabular-nums" }) }}>
                        {r.rank}
                      </div>

                      <div style={{ ...bodyCellBase({ fontWeight: 850, gap: 6 }) }}>
                        <Link
                          href={`/leaderboard/cpu?cpu=${encodeURIComponent(model)}`}
                          style={{
                            color: "#2563eb", textDecoration: "none", fontWeight: 850, fontSize: 13,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            if (cpuInfo) showTip(e, cpuInfo);
                          }}
                          onMouseMove={(e) => {
                            if (cpuInfo) moveTip(e);
                          }}
                          onMouseLeave={hideTip}
                        >
                          {model}
                        </Link>
                      </div>

                      {cols.map((c) => {
                        const rawValue = numOrNaN(r[c]);
                        const val = fmt(r[c]);
                        const barPct = getMetricBarPercent(c, rawValue);
                        const delta = getRankDelta(model, c);
                        let tipText = "";
                        if (delta !== null) {
                          tipText = `${t.comparedWith} ${sortBy}: ${t.rankDeltaPrefix}${signed(delta)}`;
                        }
                        // delta = sortRank - metricRank
                        // delta > 0 → metric rank is better (lower number) than sort rank
                        // delta < 0 → metric rank is worse (higher number) than sort rank
                        const deltaClass =
                          delta === null ? "" : delta > 0 ? styles.rankDeltaBetter : delta < 0 ? styles.rankDeltaWorse : styles.rankDeltaEqual;

                        const isTimeCol = c === "BenchCPU Time";
                        const isSpecCol = c.startsWith("SPEC");
                        const isClickable = isTimeCol || isSpecCol;
                        const cellStyle = isClickable
                          ? { ...bodyCellBase({ justifyContent: "center", fontVariantNumeric: "tabular-nums" }), cursor: "pointer" }
                          : bodyCellBase({ justifyContent: "center", fontVariantNumeric: "tabular-nums" });

                        const handleClick = isTimeCol
                          ? () => window.open(
                            `/leaderboard/cpu?cpu=${encodeURIComponent(model)}&full=1`,
                            "_blank"
                          )
                          : isSpecCol
                            ? () => window.open(
                              `/backend/api/cpu-spec-report?cpu=${encodeURIComponent(model)}&metric=${encodeURIComponent(c)}`,
                              "_blank"
                            )
                            : undefined;

                        return (
                          <div
                            key={c}
                            style={cellStyle}
                            onClick={handleClick}
                          >
                            <div className={styles.metricCellContent}>
                              <div className={styles.metricBarTrack} aria-hidden="true">
                                <div className={styles.metricBarFill} style={{ width: `${barPct}%` }} />
                              </div>
                              <div className={styles.metricCellText}>
                                <span className={styles.metricValue} style={isClickable ? { color: "#2563eb", cursor: "pointer" } : undefined}>
                                  {val}
                                </span>
                                {showRankDelta && delta !== null && (
                                  <span
                                    className={`${styles.rankDelta} ${deltaClass}`}
                                    onMouseEnter={(e) => showTip(e, tipText)}
                                    onMouseMove={(e) => moveTip(e)}
                                    onMouseLeave={hideTip}
                                    style={{ cursor: "default" }}
                                  >
                                    {t.rankDeltaPrefix}{signed(delta)}
                                  </span>
                                )}
                              </div>
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