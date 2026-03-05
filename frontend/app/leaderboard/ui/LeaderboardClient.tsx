"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "../Leaderboard.module.css";
import BarLeaderboard from "./BarLeaderboard";
import PopulationSelector, { type Population } from "./PopulationSelector";

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
  if (typeof v === "number") return Number.isFinite(v) ? v.toFixed(3) : "-";
  return String(v);
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

const MEME_DEFS: Record<string, string> = {
  Difficulty: "模型是否擅长解决困难题。",
  Uniqueness: "模型是否擅长对于模型群体而言行为模式少见的题目。",
  Risk: "模型能否解决那些一旦出错会增加其他题目错误风险的题目。",
  Surprise: "模型能否处理对于模型群体而言出人意料的题目。",
  Typicality: "模型能否解决能代表多数模型行为模式的题目。",
  Bridge: "模型能否解决跨越多种行为模式交界处的题目。",
  Mastery: "模型能否真正解决既难又在模型群体中典型的核心题目。",
  Ingenuity: "模型能否在稀有并且异常的题目上灵活应对。",
  Robustness: "模型能否在高风险、易错且跨多种题型的题目上保持稳健。",
  Caution: "模型能否保持谨慎，避免在看似简单但后果严重的典型题目上犯低级错误。",
};

const MODES = ["Base", "CoT", "IR"] as const;
type Mode = (typeof MODES)[number];

const VENDORS = [
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
type Vendor = (typeof VENDORS)[number];

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
    <span className={styles.sortBtns} aria-label={`Sort ${col}`}>
      <button
        type="button"
        className={`${styles.sortBtn} ${isActive && sortDir === "asc" ? styles.sortActive : ""}`}
        onClick={() => onSort(col, "asc")}
        aria-label={`Sort ${col} ascending`}
        title="Sort ascending"
      >
        ▲
      </button>
      <button
        type="button"
        className={`${styles.sortBtn} ${isActive && sortDir === "desc" ? styles.sortActive : ""}`}
        onClick={() => onSort(col, "desc")}
        aria-label={`Sort ${col} descending`}
        title="Sort descending"
      >
        ▼
      </button>
    </span>
  );
}

export default function LeaderboardClient() {
  const [population, setPopulation] = useState<Population>("Curated");
  const isHF = population === "HF";

  const datasets = useMemo<readonly Dataset[]>(() => (isHF ? DATASETS_HF : DATASETS_CURATED), [isHF]);
  const [dataset, setDataset] = useState<Dataset>("Avg");

  const [allMetrics, setAllMetrics] = useState<string[]>([]);
  const [nModels, setNModels] = useState(0);

  const [selected, setSelected] = useState<string[]>([ACC_METRIC, "Difficulty"]);
  const [sortBy, setSortBy] = useState<string>(ACC_METRIC);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [selectedModes, setSelectedModes] = useState<Mode[]>([...MODES]);
  const [selectedVendors, setSelectedVendors] = useState<Vendor[]>([...VENDORS]);

  const [data, setData] = useState<ApiLeaderboard | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Bar toggle
  const [showBars, setShowBars] = useState(true);

  // tooltip state
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);

  // ✅ HF: cancel paging, but limit visible area to ~50 rows (scroll inside table)
  const HF_VISIBLE_ROWS = 50;
  const HF_ROW_PX = 44; // approximate row height
  const HF_TABLE_MAX_HEIGHT_PX = HF_VISIBLE_ROWS * HF_ROW_PX + 120; // header + tableTop allowance

  useEffect(() => {
    // switching population resets controls
    setDataset("Avg");
    setSelected([ACC_METRIC, "Difficulty"]);
    setSortBy(ACC_METRIC);
    setSortDir("desc");
    setSelectedModes([...MODES]);
    setSelectedVendors([...VENDORS]);
  }, [population]);

  useEffect(() => {
    if (!datasets.includes(dataset)) setDataset("Avg");
  }, [datasets, dataset]);

  // load metrics (per dataset + population)
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

      setSelected([ACC_METRIC, "Difficulty"]);
      setSortBy(ACC_METRIC);
      setSortDir("desc");
    })();
  }, [dataset, population]);

  const memeDefList = useMemo(() => {
    const available = new Set(allMetrics);
    const out: { name: string; def: string; group: "1D" | "2D" | "3D" }[] = [];
    for (const m of ORDER_1D) if (available.has(m) && MEME_DEFS[m]) out.push({ name: m, def: MEME_DEFS[m], group: "1D" });
    for (const m of ORDER_2D) if (available.has(m) && MEME_DEFS[m]) out.push({ name: m, def: MEME_DEFS[m], group: "2D" });
    for (const m of ORDER_3D) if (available.has(m) && MEME_DEFS[m]) out.push({ name: m, def: MEME_DEFS[m], group: "3D" });
    return out;
  }, [allMetrics]);

  const onSort = (col: string, dir: SortDir) => {
    setSortBy(col);
    setSortDir(dir);
  };

  // fetch leaderboard
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

        // ✅ HF: cancel paging -> request all rows once
        // ✅ Curated: still request all rows
        params.set("limit", String(1000000));
        params.set("offset", "0");

        // Curated 才传 modes/vendors；HF 不传
        if (!isHF) {
          params.set("modes", selectedModes.join(","));
          params.set("vendors", selectedVendors.join(","));
        }

        const res = await fetch(`/backend/api/leaderboard?${params.toString()}`);
        if (!res.ok) throw new Error(`leaderboard api failed: ${res.status}`);
        const js = (await res.json()) as ApiLeaderboard;
        setData(js);
      } finally {
        setLoading(false);
      }
    })();
  }, [selected, sortBy, sortDir, dataset, population, isHF, selectedModes, selectedVendors]);

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

  const toggleMode = (m: Mode) => {
    setSelectedModes((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const toggleVendor = (v: Vendor) => {
    setSelectedVendors((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  const selectAllModes = () => setSelectedModes([...MODES]);
  const clearAllModes = () => setSelectedModes([]);

  const selectAllVendors = () => setSelectedVendors([...VENDORS]);
  const clearAllVendors = () => setSelectedVendors([]);

  const cols = data?.selected_metrics ?? selected;

  const total = data?.total ?? nModels;

  const startRank = total > 0 ? 1 : 0;
  const endRank = total;

  const showTip = (e: React.MouseEvent, text: string) => {
    setTip({ x: e.clientX + 12, y: e.clientY + 12, text });
  };
  const moveTip = (e: React.MouseEvent) => {
    setTip((prev) => (prev ? { ...prev, x: e.clientX + 12, y: e.clientY + 12 } : prev));
  };
  const hideTip = () => setTip(null);

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
            fontWeight: 700,
            color: "rgba(15,23,42,0.88)",
            maxWidth: 260,
            lineHeight: 1.25,
          }}
        >
          {tip.text}
        </div>
      )}

      <div className={styles.topRow}>
        <div>
          <div className={styles.sectionTitle}>Probing Memes Leaderboard</div>
          <div className={styles.bannerTitle}>Choose metrics, filters, and sort by clicking header arrows.</div>
        </div>
        <PopulationSelector value={population} onChange={setPopulation} />
      </div>

      {/* Filters */}
      {isHF ? (
        <div className={styles.card} style={{ marginTop: 10 }}>
          <div className={styles.cardTitle}>Dataset</div>
          <div className={styles.radioList}>
            {datasets.map((ds) => (
              <label key={ds} className={styles.radioItem}>
                <input type="radio" name="dataset" checked={dataset === ds} onChange={() => setDataset(ds)} />
                <span>{ds}</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.filtersGrid}>
          <div className={styles.filtersLeft}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Dataset</div>
              <div className={styles.radioList}>
                {datasets.map((ds) => (
                  <label key={ds} className={styles.radioItem}>
                    <input type="radio" name="dataset" checked={dataset === ds} onChange={() => setDataset(ds)} />
                    <span>{ds}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}> 推理模式 </div>
              <div className={styles.hint}>
                Base（直接回答）：不显式要求推理过程；<br />
                Chain-of-Thought（CoT）：引导模型生成显式中间推理；<br />
                Intrinsic Reasoning（IR）：启用模型内在推理能力（深度思考）
              </div>

              <div className={styles.controlsRow} style={{ marginTop: 8 }}>
                <button className={styles.btn} onClick={selectAllModes} type="button">
                  Select all
                </button>
                <button className={styles.btn} onClick={clearAllModes} type="button">
                  Clear
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

          <div className={`${styles.card} ${styles.vendorCard}`}>
            <div className={styles.cardTitle}> 厂商 </div>

            <div className={styles.controlsRow} style={{ marginTop: 8 }}>
              <button className={styles.btn} onClick={selectAllVendors} type="button">
                Select all
              </button>
              <button className={styles.btn} onClick={clearAllVendors} type="button">
                Clear
              </button>
            </div>

            <div className={`${styles.metricList} ${styles.vendorList}`} style={{ marginTop: 6 }}>
              {VENDORS.map((v) => (
                <label key={v} className={styles.metricItem}>
                  <input type="checkbox" checked={selectedVendors.includes(v)} onChange={() => toggleVendor(v)} />
                  <span>{v}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Meme defs */}
      <div className={styles.card} style={{ marginTop: 14 }}>
        <div className={styles.memeDefTitle}>Meme Scores 选择</div>
        <div className={styles.memeDefHint}>
          行为模式：指模型群体在题目上的对/错模式，比如一套题目上，所有非推理模型都答错，而推理模型答对；或者所有 qwen family 模型都答错而其余模型答对。
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
                title="Click to toggle this metric"
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

      {/* Gray bar + toggle */}
      <div className={styles.grayBar} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span>Leaderboard（排序：点表头右侧 ▲/▼）</span>

        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 800,
            color: "rgba(15,23,42,0.78)",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={showBars}
            onChange={(e) => setShowBars(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          Show bar chart
        </label>
      </div>

      {showBars && data && data.rows?.length > 0 && (
        <BarLeaderboard rows={data.rows} metric={data.sort_by} title={`Bar Leaderboard · Sorted by ${data.sort_by} (${data.sort_dir})`} topK={10} />
      )}

      <div
        className={styles.tableWrap}
        // ✅ only HF: internal scroll, visible area ~50 rows
        style={
          isHF
            ? {
                overflowY: "auto",
                maxHeight: HF_TABLE_MAX_HEIGHT_PX,
              }
            : undefined
        }
      >
        <div className={styles.tableTop}>
          <div className={styles.hint}>
            Population: <b>{population}</b> · Dataset: <b>{dataset}</b> · Models: {total} · Showing: {startRank}-{endRank}
          </div>
          <div className={styles.hint}>{loading ? "Loading..." : data ? `Sorted by ${data.sort_by} (${data.sort_dir})` : ""}</div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Rank</th>
              <th className={styles.th}>Model</th>
              {cols.map((c) => (
                <th key={c} className={styles.th}>
                  <div className={styles.thInner}>
                    <span>{c}</span>
                    <SortArrows col={c} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {(data?.rows ?? []).map((r) => (
              <tr key={`${r.model}-${r.rank}`}>
                <td className={styles.td}>{r.rank}</td>
                <td className={`${styles.td} ${styles.modelCell}`}>{r.model}</td>

                {cols.map((c) => {
                  const val = fmt(r[c]);
                  const isSortMetricCell = c === sortBy && c !== ACC_METRIC;
                  const delta = r?.delta_vs_acc;
                  const tipText = isSortMetricCell && delta !== null && delta !== undefined ? `Compared with ACC: ${delta}` : "";

                  return (
                    <td
                      key={c}
                      className={styles.td}
                      onMouseEnter={(e) => {
                        if (tipText) showTip(e, tipText);
                      }}
                      onMouseMove={(e) => {
                        if (tipText) moveTip(e);
                      }}
                      onMouseLeave={hideTip}
                    >
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}

            {!loading && (!data || data.rows.length === 0) && (
              <tr>
                <td className={styles.td} colSpan={2 + cols.length}>
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
