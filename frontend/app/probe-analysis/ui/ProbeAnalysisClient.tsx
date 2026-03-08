"use client";

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import styles from "../ProbeAnalysis.module.css";

import PopulationSelector, { type Population } from "../../leaderboard/ui/PopulationSelector";
import Overview3DPanel from "./Overview3DPanel";
import QuestionDrawer, { type DrawerContentStub } from "./QuestionDrawer";

type QuestionListItem = {
  question_hash: string;
  question_preview: string;
  probe_properties: Record<string, number>;
};

type QuestionsResponse = {
  population: Population;
  dataset: string;
  probe_property_columns: string[];
  total: number;
  offset: number;
  limit: number;
  items: QuestionListItem[];
};

type QuestionDetailResponse = {
  population: Population;
  dataset: string;
  question_hash: string;
  question: string;
  ground_truth?: string;
  probe_properties: Record<string, number>;
  correct_models: string[];
  wrong_models: string[];
};

type SortDir = "asc" | "desc";

const DEFAULT_SORT_PROP = "risk";
const ALL_PROPS = ["difficulty", "uniqueness", "risk", "surprise", "typicality", "bridge"];
const TABLE_FRAME_HEIGHT = 680;

function fmtScore(x: any) {
  if (x == null || !Number.isFinite(Number(x))) return "—";
  return Number(x).toFixed(3);
}

function numOrNaN(v: any) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
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

  const btnBase: React.CSSProperties = {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: "0 2px",
    fontSize: 10,
    lineHeight: 1,
    color: "rgba(15,23,42,0.45)",
    fontWeight: 800,
  };

  const btnActive: React.CSSProperties = {
    color: "rgba(15,23,42,0.92)",
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 1, marginLeft: 6 }}>
      <button
        type="button"
        onClick={() => onSort(col, "asc")}
        aria-label={`Sort ${col} ascending`}
        title="Sort ascending"
        style={isActive && sortDir === "asc" ? { ...btnBase, ...btnActive } : btnBase}
      >
        ▲
      </button>
      <button
        type="button"
        onClick={() => onSort(col, "desc")}
        aria-label={`Sort ${col} descending`}
        title="Sort descending"
        style={isActive && sortDir === "desc" ? { ...btnBase, ...btnActive } : btnBase}
      >
        ▼
      </button>
    </span>
  );
}

function safeQuestionKey(it: QuestionListItem, idx: number) {
  const preview = String(it.question_preview ?? "");
  return `${preview.slice(0, 80)}__${idx}`;
}

export default function ProbeAnalysisClient() {
  const [population, setPopulation] = useState<Population>("Curated");

  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [datasetOptions, setDatasetOptions] = useState<string[]>([]);

  const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT_PROP);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [cols, setCols] = useState<string[]>(ALL_PROPS);
  const [items, setItems] = useState<QuestionListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loadingList, setLoadingList] = useState(false);
  const [listErr, setListErr] = useState<string | null>(null);

  const [drawer, setDrawer] = useState<DrawerContentStub | null>(null);

  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [questionQuery, setQuestionQuery] = useState("");

  const subtitle = useMemo(() => {
    return (
      "Probe Analysis 将数据集中的每个样本视为一个 probe，并为 probe 计算多个属性（properties）。" +
      " 上方展示 3D 总览；你可以通过下拉菜单或点击 3D 数据集来选择数据集。" +
      " 选中后，下方在固定高度的表格框中浏览题目，并支持按各属性排序和查看详细信息。"
    );
  }, []);

  const showTip = (e: MouseEvent, text: string) => {
    setTip({ x: e.clientX + 12, y: e.clientY + 12, text });
  };
  const moveTip = (e: MouseEvent) => {
    setTip((prev) => (prev ? { ...prev, x: e.clientX + 12, y: e.clientY + 12 } : prev));
  };
  const hideTip = () => setTip(null);

  const handleSelectDataset = useCallback((ds: string | null) => {
    setSelectedDataset(ds);
  }, []);

  const handleDatasetsLoaded = useCallback(
    (names: string[]) => {
      setDatasetOptions(names);

      if (population === "Curated" && names.length > 0) {
        setSelectedDataset((prev) => prev ?? names[0]);
      }
    },
    [population]
  );

  useEffect(() => {
    setSelectedDataset(null);
    setDatasetOptions([]);
    setItems([]);
    setTotal(0);
    setListErr(null);
    setDrawer(null);
    setSortBy(DEFAULT_SORT_PROP);
    setSortDir("desc");
    setQuestionQuery("");
    setCols(ALL_PROPS);
  }, [population]);

  useEffect(() => {
    if (!selectedDataset) return;
    if (!datasetOptions.includes(selectedDataset)) {
      setSelectedDataset(datasetOptions.length > 0 ? datasetOptions[0] : null);
    }
  }, [datasetOptions, selectedDataset]);

  useEffect(() => {
    if (!selectedDataset) {
      setItems([]);
      setTotal(0);
      setListErr(null);
      return;
    }

    if (population !== "Curated") {
      setItems([]);
      setTotal(0);
      setListErr(null);
      return;
    }

    let alive = true;
    setLoadingList(true);
    setListErr(null);

    const url =
      `/backend/api/probe-analysis/questions?population=${encodeURIComponent(population)}` +
      `&dataset=${encodeURIComponent(selectedDataset)}` +
      `&sort_by=${encodeURIComponent(sortBy)}` +
      `&sort_dir=${encodeURIComponent(sortDir)}` +
      `&offset=0&limit=5000`;

    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const t = await r.text().catch(() => "");
          throw new Error(`HTTP ${r.status} ${r.statusText} ${t}`.trim());
        }
        return (await r.json()) as QuestionsResponse;
      })
      .then((json) => {
        if (!alive) return;

        const nextCols = (json.probe_property_columns ?? []).length > 0 ? json.probe_property_columns : ALL_PROPS;
        setCols(nextCols);
        setItems(json.items ?? []);
        setTotal(json.total ?? 0);

        if (!nextCols.includes(sortBy)) {
          setSortBy(nextCols.includes(DEFAULT_SORT_PROP) ? DEFAULT_SORT_PROP : nextCols[0] ?? DEFAULT_SORT_PROP);
          setSortDir("desc");
        }
      })
      .catch((e: any) => {
        if (!alive) return;
        setListErr(e?.message ?? String(e));
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (!alive) return;
        setLoadingList(false);
      });

    return () => {
      alive = false;
    };
  }, [selectedDataset, sortBy, sortDir, population]);

  const openQuestionDetail = useCallback(
    async (q: QuestionListItem) => {
      if (!selectedDataset) return;

      try {
        const url =
          `/backend/api/probe-analysis/question-detail?population=${encodeURIComponent(population)}` +
          `&dataset=${encodeURIComponent(selectedDataset)}` +
          `&question_hash=${encodeURIComponent(q.question_hash)}`;

        const r = await fetch(url);
        if (!r.ok) {
          const t = await r.text().catch(() => "");
          throw new Error(`HTTP ${r.status} ${r.statusText} ${t}`.trim());
        }
        const json = (await r.json()) as QuestionDetailResponse;

        const content =
          `【Question】\n${json.question}\n\n` +
          `【Ground Truth】\n${json.ground_truth ?? ""}\n\n` +
          `【Probe Properties】\n` +
          cols.map((c) => `• ${c}: ${fmtScore(json.probe_properties?.[c])}`).join("\n") +
          `\n\n【Correct Models】\n` +
          ((json.correct_models ?? []).length > 0 ? (json.correct_models ?? []).join("\n") : "None") +
          `\n\n【Wrong Models】\n` +
          ((json.wrong_models ?? []).length > 0 ? (json.wrong_models ?? []).join("\n") : "None");

        setDrawer({
          title: `${selectedDataset} · Question Detail`,
          content,
        });
      } catch (e: any) {
        setDrawer({
          title: `${selectedDataset} · Question Detail`,
          content: `【Error】\n${e?.message ?? String(e)}`,
        });
      }
    },
    [population, selectedDataset, cols]
  );

  const shownRows = useMemo(() => {
    const q = questionQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => String(it.question_preview ?? "").toLowerCase().includes(q));
  }, [items, questionQuery]);

  const onSort = useCallback((col: string, dir: SortDir) => {
    setSortBy(col);
    setSortDir(dir);
  }, []);

  const topSummary = useMemo(() => {
    if (population === "HF") return "HF Population：Coming soon.";
    if (!selectedDataset) return "请先通过上方下拉菜单或 3D 图选择一个数据集。";
    return `Dataset = ${selectedDataset} · Questions = ${total}`;
  }, [population, selectedDataset, total]);

  return (
    <div className={styles.page} onMouseLeave={hideTip}>
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
            maxWidth: 360,
            lineHeight: 1.25,
          }}
        >
          {tip.text}
        </div>
      )}

      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <div className={styles.title}>Probe Analysis</div>
          <div className={styles.subtitle}>{subtitle}</div>
        </div>

        <div className={styles.controls}>
          <PopulationSelector value={population} onChange={setPopulation} />
          <span className={styles.badge}>{population} Population</span>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Overview (3D)</div>
              <div className={styles.muted}>你可以点击 3D 数据集，也可以用下拉菜单选择数据集。</div>
            </div>

            <div className={styles.controls}>
              <span className={styles.badge}>pop = {population}</span>

              <select
                value={selectedDataset ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setSelectedDataset(v ? v : null);
                }}
                style={{
                  height: 32,
                  minWidth: 220,
                  borderRadius: 10,
                  padding: "0 10px",
                  border: "1px solid rgba(0,0,0,0.14)",
                  background: "#fff",
                }}
              >
                <option value="">Select dataset...</option>
                {datasetOptions.map((ds) => (
                  <option key={ds} value={ds}>
                    {ds}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.cardBody}>
            <Overview3DPanel
              population={population}
              selectedDataset={selectedDataset}
              onSelectDataset={handleSelectDataset}
              onDatasetsLoaded={handleDatasetsLoaded}
            />
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Question Browser</div>
              <div className={styles.muted}>{topSummary}</div>
            </div>

            {population === "Curated" && selectedDataset ? (
              <div className={styles.controls}>
                <span className={styles.badge}>total = {total}</span>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    border: "1px solid rgba(0,0,0,0.14)",
                    borderRadius: 10,
                    padding: "0 10px",
                    height: 32,
                    background: "#fff",
                  }}
                >
                  <span className={styles.muted} style={{ fontSize: 12 }}>
                    Search
                  </span>
                  <input
                    value={questionQuery}
                    onChange={(e) => setQuestionQuery(e.target.value)}
                    placeholder="Type question text…"
                    aria-label="Search question"
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      width: 180,
                      fontSize: 13,
                    }}
                  />
                  {questionQuery ? (
                    <button
                      type="button"
                      onClick={() => setQuestionQuery("")}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 16,
                        lineHeight: 1,
                        color: "rgba(0,0,0,0.45)",
                        padding: 0,
                      }}
                      title="Clear search"
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className={styles.badge}>{population === "HF" ? "Coming soon" : "No dataset selected"}</div>
            )}
          </div>

          <div className={styles.cardBody}>
            {population === "HF" ? (
              <div className={styles.panelPlaceholder}>
                <div className={styles.muted}>Coming soon for HF Population.</div>
              </div>
            ) : !selectedDataset ? (
              <div className={styles.panelPlaceholder}>
                <div className={styles.muted}>Select a dataset from the dropdown above to start browsing questions.</div>
              </div>
            ) : (
              <div
                style={{
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 12,
                  background: "rgba(0,0,0,0.01)",
                  height: TABLE_FRAME_HEIGHT,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "10px 12px",
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                    flex: "0 0 auto",
                    background: "rgba(255,255,255,0.78)",
                  }}
                >
                  <div className={styles.muted}>
                    Showing: <b>{shownRows.length}</b>
                  </div>
                  <div className={styles.muted}>
                    {loadingList ? "Loading..." : `Sorted by ${sortBy} (${sortDir})`}
                  </div>
                </div>

                {listErr && (
                  <div className={styles.muted} style={{ padding: 12, whiteSpace: "pre-wrap" }}>
                    {listErr}
                  </div>
                )}

                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                  }}
                >
                  <table className={styles.table} style={{ tableLayout: "fixed" }}>
                    <thead
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        background: "rgba(255,255,255,0.98)",
                      }}
                    >
                      <tr>
                        <th style={{ width: "70px" }}>Rank</th>
                        <th style={{ width: "42%" }}>Question</th>
                        {cols.map((c) => (
                          <th key={c}>
                            <div style={{ display: "inline-flex", alignItems: "center" }}>
                              <span>{c}</span>
                              <SortArrows col={c} sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {shownRows.map((it, idx) => {
                        const rank = idx + 1;

                        return (
                          <tr key={safeQuestionKey(it, idx)}>
                            <td style={{ fontVariantNumeric: "tabular-nums" }}>{rank}</td>

                            <td>
                              <button
                                className={styles.rowButton}
                                onClick={() => openQuestionDetail(it)}
                                title="Click to view detail"
                                style={{
                                  display: "block",
                                  textAlign: "left",
                                  width: "100%",
                                }}
                                onMouseEnter={(e) => showTip(e, "Click to view question details and model behavior.")}
                                onMouseMove={(e) => moveTip(e)}
                                onMouseLeave={hideTip}
                              >
                                <div
                                  className={styles.muted}
                                  style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "normal",
                                    lineHeight: 1.4,
                                    color: "rgba(15,23,42,0.88)",
                                  }}
                                >
                                  {it.question_preview}
                                </div>
                              </button>
                            </td>

                            {cols.map((c) => (
                              <td
                                key={c}
                                style={{ fontVariantNumeric: "tabular-nums" }}
                                onMouseEnter={(e) => showTip(e, `Sort by ${c} using ▲ / ▼ in the table header.`)}
                                onMouseMove={(e) => moveTip(e)}
                                onMouseLeave={hideTip}
                              >
                                {fmtScore(numOrNaN(it.probe_properties?.[c]))}
                              </td>
                            ))}
                          </tr>
                        );
                      })}

                      {!loadingList && shownRows.length === 0 && (
                        <tr>
                          <td colSpan={2 + cols.length} style={{ textAlign: "center", padding: 16 }}>
                            No data
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <QuestionDrawer open={drawer !== null} data={drawer} onClose={() => setDrawer(null)} />
    </div>
  );
}