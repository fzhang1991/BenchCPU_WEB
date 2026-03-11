"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../ProbeAnalysis.module.css";
import type { Population } from "../../leaderboard/ui/PopulationSelector";

type DatasetPoint = {
  name: string;
  x: number;
  y: number;
  z: number;
  typicality: number;
  bridge: number;
  surprise: number;
};

type OverviewResponse = {
  population: Population;
  props_xyz: [string, string, string];
  prop_color: string;
  prop_radius: string;
  datasets: DatasetPoint[];
  meta: {
    color_vmin: number;
    color_vmax: number;
    size_min: number;
    size_max: number;
  };
};

type StatItem = { mean: number; std: number; min: number; max: number };
type DatasetStatsResponse = {
  population: Population;
  dataset: string;
  n_items: number;
  stats: Record<string, StatItem>;
};

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

function clamp01(t: number) {
  return Math.max(0, Math.min(1, t));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return NaN;
  const x = (p / 100) * (sorted.length - 1);
  const i = Math.floor(x);
  const j = Math.min(sorted.length - 1, i + 1);
  const t = x - i;
  return lerp(sorted[i], sorted[j], t);
}
function robustBounds(vals: number[], pclip: number) {
  const v = vals.filter((x) => Number.isFinite(x)).slice().sort((a, b) => a - b);
  if (v.length === 0) return { lo: 0, hi: 1 };
  const clip = Math.max(0, Math.min(49, pclip));
  let lo = percentile(v, clip);
  let hi = percentile(v, 100 - clip);

  if (!Number.isFinite(lo) || !Number.isFinite(hi) || Math.abs(hi - lo) < 1e-12) {
    lo = v[0];
    hi = v[v.length - 1];
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || Math.abs(hi - lo) < 1e-12) {
    lo = 0;
    hi = 1;
  }
  return { lo, hi };
}

function spow(x: number, p: number) {
  const s = x >= 0 ? 1 : -1;
  return s * Math.pow(Math.abs(x), p);
}
function superellipsoidUnit(u: number, v: number, n: number) {
  const nn = Math.max(n, 2);
  const p = 2.0 / nn;
  const cv = Math.cos(v);
  const sv = Math.sin(v);
  const cu = Math.cos(u);
  const su = Math.sin(u);
  const x = spow(cv, p) * spow(cu, p);
  const y = spow(cv, p) * spow(su, p);
  const z = spow(sv, p);
  return { x, y, z };
}

const VIRIDIS_STOPS: Array<[number, [number, number, number]]> = [
  [0.0, [68, 1, 84]],
  [0.2, [59, 82, 139]],
  [0.4, [33, 145, 140]],
  [0.6, [94, 201, 98]],
  [0.8, [181, 222, 43]],
  [1.0, [253, 231, 37]],
];
function viridisColor(t: number) {
  const x = clamp01(t);
  for (let k = 0; k < VIRIDIS_STOPS.length - 1; k++) {
    const [t0, c0] = VIRIDIS_STOPS[k];
    const [t1, c1] = VIRIDIS_STOPS[k + 1];
    if (x >= t0 && x <= t1) {
      const a = (x - t0) / Math.max(1e-12, t1 - t0);
      const r = Math.round(lerp(c0[0], c1[0], a));
      const g = Math.round(lerp(c0[1], c1[1], a));
      const b = Math.round(lerp(c0[2], c1[2], a));
      return `rgb(${r},${g},${b})`;
    }
  }
  const c = VIRIDIS_STOPS[VIRIDIS_STOPS.length - 1][1];
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function fmt(x: number) {
  if (!Number.isFinite(x)) return "—";
  return x.toFixed(4);
}

export default function Overview3DPanel(props: {
  population: Population;
  selectedDataset: string | null;
  onSelectDataset?: (datasetName: string | null) => void;
  onDatasetsLoaded?: (datasetNames: string[]) => void;
}) {
  const { population, selectedDataset, onSelectDataset, onDatasetsLoaded } = props;

  const [data, setData] = useState<OverviewResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [statsLoading, setStatsLoading] = useState(false);
  const [statsErr, setStatsErr] = useState<string | null>(null);
  const [stats, setStats] = useState<DatasetStatsResponse | null>(null);

  const [plotRevision, setPlotRevision] = useState(0);
  const didInitBumpRef = useRef(false);

  useEffect(() => {
    setStats(null);
    setStatsErr(null);
    setStatsLoading(false);
    didInitBumpRef.current = false;
  }, [population]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);

    fetch(`/backend/api/probe-analysis/overview?population=${encodeURIComponent(population)}`)
      .then(async (r) => {
        if (!r.ok) {
          const t = await r.text().catch(() => "");
          throw new Error(`HTTP ${r.status} ${r.statusText} ${t}`.trim());
        }
        return (await r.json()) as OverviewResponse;
      })
      .then((json) => {
        if (!alive) return;
        setData(json);
        onDatasetsLoaded?.((json.datasets ?? []).map((d) => d.name));
      })
      .catch((e: any) => {
        if (!alive) return;
        setErr(e?.message ?? String(e));
        setData(null);
        onDatasetsLoaded?.([]);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [population, onDatasetsLoaded]);

  useEffect(() => {
    if (!data?.datasets?.length) return;
    if (didInitBumpRef.current) return;

    didInitBumpRef.current = true;

    const id = requestAnimationFrame(() => {
      setPlotRevision((v) => v + 1);
    });

    return () => cancelAnimationFrame(id);
  }, [data]);

  useEffect(() => {
    if (!selectedDataset) {
      setStats(null);
      setStatsErr(null);
      setStatsLoading(false);
      return;
    }

    let alive = true;
    setStatsLoading(true);
    setStatsErr(null);
    setStats(null);

    fetch(
      `/backend/api/probe-analysis/dataset-stats?population=${encodeURIComponent(population)}&dataset=${encodeURIComponent(
        selectedDataset
      )}`
    )
      .then(async (r) => {
        if (!r.ok) {
          const t = await r.text().catch(() => "");
          throw new Error(`HTTP ${r.status} ${r.statusText} ${t}`.trim());
        }
        return (await r.json()) as DatasetStatsResponse;
      })
      .then((json) => {
        if (!alive) return;
        setStats(json);
      })
      .catch((e: any) => {
        if (!alive) return;
        setStatsErr(e?.message ?? String(e));
      })
      .finally(() => {
        if (!alive) return;
        setStatsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [selectedDataset, population]);

  const computed = useMemo(() => {
    if (!data || !data.datasets?.length) return null;

    const pts = data.datasets;
    const [xName, yName, zName] = data.props_xyz;

    const nMin = 2.0;
    const nMax = 20.0;
    const pclip = 5.0;

    const bndBridge = robustBounds(pts.map((p) => p.bridge), pclip);
    const nVals = pts.map((p) => {
      const t = clamp01((p.bridge - bndBridge.lo) / (bndBridge.hi - bndBridge.lo + 1e-12));
      return nMin + t * (nMax - nMin);
    });

    const xs0 = pts.map((p) => p.x);
    const ys0 = pts.map((p) => p.y);
    const zs0 = pts.map((p) => p.z);

    const spanX = Math.max(...xs0) - Math.min(...xs0);
    const spanY = Math.max(...ys0) - Math.min(...ys0);
    const spanZ = Math.max(...zs0) - Math.min(...zs0);
    const span = Math.max(spanX, spanY, spanZ, 1e-6);

    const rUserLo = 0.05 * span;
    const rUserHi = 0.15 * span;

    const capLo = 0.025 * span;
    const capHi = 0.085 * span;

    let rLo = Math.max(Math.min(rUserLo, rUserHi), capLo);
    let rHi = Math.min(Math.max(rUserLo, rUserHi), capHi);
    if (rHi <= rLo) rHi = rLo * 1.05;

    const bndSurprise = robustBounds(pts.map((p) => p.surprise), pclip);
    const rrVals = pts.map((p) => {
      if (Math.abs(bndSurprise.hi - bndSurprise.lo) < 1e-12) return (rLo + rHi) / 2;
      const t = clamp01((p.surprise - bndSurprise.lo) / (bndSurprise.hi - bndSurprise.lo + 1e-12));
      return rLo + t * (rHi - rLo);
    });

    const cLo = data.meta.color_vmin;
    const cHi = data.meta.color_vmax;
    const cNorm = pts.map((p) => clamp01((p.typicality - cLo) / (cHi - cLo + 1e-12)));
    const meshColors = cNorm.map((t) => viridisColor(t));

    const meshU = 36;
    const meshV = 28;

    const us: number[] = [];
    const vs: number[] = [];
    for (let i = 0; i < meshU; i++) us.push((2 * Math.PI * i) / (meshU - 1));
    for (let j = 0; j < meshV; j++) vs.push((-Math.PI / 2) + (Math.PI * j) / (meshV - 1));
    const vid = (i: number, j: number) => j * meshU + i;

    const meshTraces: any[] = [];
    const markerTraces: any[] = [];

    const baseLabelX: number[] = [];
    const baseLabelY: number[] = [];
    const baseLabelZ: number[] = [];
    const baseLabelText: string[] = [];

    const selectedLabelX: number[] = [];
    const selectedLabelY: number[] = [];
    const selectedLabelZ: number[] = [];
    const selectedLabelText: string[] = [];

    const baseLift = 0.005 * span;

    for (let idx = 0; idx < pts.length; idx++) {
      const p = pts[idx];
      const n = nVals[idx];
      const rr = rrVals[idx];
      const col = meshColors[idx];
      const isSelected = selectedDataset === p.name;

      const vx: number[] = [];
      const vy: number[] = [];
      const vz: number[] = [];

      for (let j = 0; j < meshV; j++) {
        for (let i = 0; i < meshU; i++) {
          const u = us[i];
          const v = vs[j];
          const su = superellipsoidUnit(u, v, n);

          vx.push(p.x + rr * su.x);
          vy.push(p.y + rr * su.y);
          vz.push(p.z + rr * su.z);
        }
      }

      const I: number[] = [];
      const J: number[] = [];
      const K: number[] = [];
      for (let j = 0; j < meshV - 1; j++) {
        for (let i = 0; i < meshU - 1; i++) {
          const a = vid(i, j);
          const b2 = vid(i + 1, j);
          const c = vid(i, j + 1);
          const d = vid(i + 1, j + 1);
          I.push(a);
          J.push(b2);
          K.push(c);
          I.push(b2);
          J.push(d);
          K.push(c);
        }
      }

      const hovertemplate =
        `<b>${p.name}</b><br>` +
        `${xName}: ${p.x.toFixed(3)}<br>` +
        `${yName}: ${p.y.toFixed(3)}<br>` +
        `${zName}: ${p.z.toFixed(3)}<br>` +
        `${data.prop_color}: ${p.typicality.toFixed(3)}<br>` +
        `bridge: ${p.bridge.toFixed(3)}<br>` +
        `${data.prop_radius}: ${p.surprise.toFixed(3)}<br>` +
        "<extra></extra>";

      const hovertext = Array(meshU * meshV).fill("1");

      meshTraces.push({
        type: "mesh3d",
        name: p.name,
        x: vx,
        y: vy,
        z: vz,
        i: I,
        j: J,
        k: K,
        color: col,
        opacity: isSelected ? 0.9 : 0.72,
        flatshading: false,
        showlegend: false,
        hoverinfo: "text",
        hovertext,
        hovertemplate,
      });

      markerTraces.push({
        type: "scatter3d",
        mode: "markers",
        x: [p.x],
        y: [p.y],
        z: [p.z],
        customdata: [p.name],
        marker: {
          size: 50,
          color: "rgba(0,0,0,0.001)",
          line: { width: 0, color: "rgba(0,0,0,0)" },
          opacity: 0.01,
        },
        opacity: 0.01,
        hoverinfo: "skip",
        showlegend: false,
      });

      baseLabelX.push(p.x);
      baseLabelY.push(p.y);
      baseLabelZ.push(p.z + rr + baseLift);
      baseLabelText.push(isSelected ? "" : p.name);

      if (isSelected) {
        selectedLabelX.push(p.x);
        selectedLabelY.push(p.y);
        selectedLabelZ.push(p.z + rr + baseLift);
        selectedLabelText.push(p.name);
      }
    }

    const traces: any[] = [];

    traces.push(...meshTraces);

    traces.push({
      type: "scatter3d",
      mode: "text",
      x: baseLabelX,
      y: baseLabelY,
      z: baseLabelZ,
      text: baseLabelText,
      textfont: { size: 12, color: "rgba(15,23,42,0.78)" },
      textposition: "top center",
      hoverinfo: "skip",
      showlegend: false,
    });

    traces.push({
      type: "scatter3d",
      mode: "text",
      x: selectedLabelX,
      y: selectedLabelY,
      z: selectedLabelZ,
      text: selectedLabelText,
      textfont: { size: 12, color: "rgb(29, 78, 216)" },
      textposition: "top center",
      hoverinfo: "skip",
      showlegend: false,
    });

    traces.push(...markerTraces);

    const xmin = Math.min(...pts.map((p, i) => p.x - rrVals[i] * 1.15));
    const xmax = Math.max(...pts.map((p, i) => p.x + rrVals[i] * 1.15));
    const ymin = Math.min(...pts.map((p, i) => p.y - rrVals[i] * 1.15));
    const ymax = Math.max(...pts.map((p, i) => p.y + rrVals[i] * 1.15));
    const zmin = Math.min(...pts.map((p, i) => p.z - rrVals[i] * 1.15));
    const zmax = Math.max(...pts.map((p, i) => p.z + rrVals[i] * 1.15));

    const padx = 0.01 * Math.max(1e-6, xmax - xmin);
    const pady = 0.01 * Math.max(1e-6, ymax - ymin);
    const padz = 0.01 * Math.max(1e-6, zmax - zmin);

    const Y_POS_EXPAND = 0.09;
    const Z_POS_EXPAND = 0.05;

    let xlim: [number, number] = [xmin - padx, xmax + padx];
    if (population === "Curated") xlim = [0.0, 0.83];
    if (population === "HF") xlim = [0.12, 0.95];

    const ylim: [number, number] = [ymin - pady, ymax + pady + Y_POS_EXPAND];
    const zlim: [number, number] = [zmin - padz, zmax + padz + Z_POS_EXPAND];

    const dx = Math.max(1e-9, xlim[1] - xlim[0]);
    const dy = Math.max(1e-9, ylim[1] - ylim[0]);
    const dz = Math.max(1e-9, zlim[1] - zlim[0]);
    const m = Math.max(dx, dy, dz);
    const aspectratio = { x: dx / m, y: dy / m, z: dz / m };

    return {
      traces,
      axis: { xName, yName, zName },
      legend: {
        colorMin: data.meta.color_vmin,
        colorMax: data.meta.color_vmax,
        colorLabel: data.prop_color,
        radiusLabel: data.prop_radius,
      },
      ranges: { xlim, ylim, zlim },
      aspectratio,
    };
  }, [data, population, selectedDataset]);

  if (loading) {
    return (
      <div className={styles.panelPlaceholder}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Loading 3D overview…</div>
        </div>
      </div>
    );
  }
  if (err) {
    return (
      <div className={styles.panelPlaceholder}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Failed to load</div>
          <div className={styles.muted} style={{ whiteSpace: "pre-wrap" }}>
            {err}
          </div>
        </div>
      </div>
    );
  }
  if (!computed) {
    return (
      <div className={styles.panelPlaceholder}>
        <div className={styles.muted}>No data.</div>
      </div>
    );
  }

  const { xName, yName, zName } = computed.axis;
  const { colorMin, colorMax, colorLabel, radiusLabel } = computed.legend;

  const axisCommon: any = {
    visible: true,
    showbackground: false,
    showgrid: true,
    zeroline: false,
    showline: true,
    ticks: "outside",
    showticklabels: true,
    tickmode: "auto",
    nticks: 6,
    tickfont: { size: 11 },
    titlefont: { size: 13 },
    automargin: true,
  };

  const layout: any = {
    autosize: true,
    clickmode: "event",
    margin: { l: 18, r: 8, t: 4, b: 18 },
    scene: {
      domain: { x: [0.07, 0.995], y: [0.06, 0.995] },
      xaxis: { ...axisCommon, title: { text: xName }, range: computed.ranges.xlim },
      yaxis: { ...axisCommon, title: { text: yName }, range: computed.ranges.ylim },
      zaxis: { ...axisCommon, title: { text: zName }, range: computed.ranges.zlim },
      aspectmode: "manual",
      aspectratio: computed.aspectratio,
      dragmode: "orbit",
      camera: { eye: { x: 0.8, y: 0.95, z: 0.4 } },
    },
    showlegend: false,
  };

  const config: any = {
    displaylogo: false,
    responsive: true,
    scrollZoom: true,
  };

  return (
    <div className={styles.overviewWrap3}>
      <div className={styles.legendCard}>
        <div className={styles.legendTitle}>
          (x, y, z): ({xName}, {yName}, {zName})
        </div>

        <div className={styles.legendRow}>
          <div className={styles.legendLabel}>bridge ↑</div>
          <div className={styles.legendIcons}>
            <div className={styles.iconBox}>
              <svg width="46" height="26" viewBox="0 0 46 26" aria-hidden="true">
                <ellipse
                  cx="23"
                  cy="13"
                  rx="12"
                  ry="10"
                  fill="rgba(120,120,120,0.55)"
                  stroke="rgba(0,0,0,0.85)"
                />
              </svg>
              <div className={styles.iconCaption}>sphere</div>
            </div>

            <div className={styles.arrow} />

            <div className={styles.iconBox}>
              <svg width="46" height="26" viewBox="0 0 46 26" aria-hidden="true">
                <rect
                  x="13"
                  y="5"
                  width="20"
                  height="16"
                  rx="2"
                  fill="rgba(120,120,120,0.55)"
                  stroke="rgba(0,0,0,0.85)"
                />
              </svg>
              <div className={styles.iconCaption}>cube</div>
            </div>
          </div>
        </div>

        <div className={styles.legendRow}>
          <div className={styles.legendLabel}>{radiusLabel} ↑</div>
          <div className={styles.legendIcons}>
            <div className={styles.iconBox}>
              <svg width="46" height="26" viewBox="0 0 46 26" aria-hidden="true">
                <circle
                  cx="23"
                  cy="13"
                  r="6"
                  fill="rgba(120,120,120,0.55)"
                  stroke="rgba(0,0,0,0.85)"
                />
              </svg>
              <div className={styles.iconCaption}>small</div>
            </div>

            <div className={styles.arrow} />

            <div className={styles.iconBox}>
              <svg width="46" height="26" viewBox="0 0 46 26" aria-hidden="true">
                <circle
                  cx="23"
                  cy="13"
                  r="10"
                  fill="rgba(120,120,120,0.55)"
                  stroke="rgba(0,0,0,0.85)"
                />
              </svg>
              <div className={styles.iconCaption}>large</div>
            </div>
          </div>
        </div>

        <div className={styles.gradBarWrap}>
          <div className={styles.gradLabel}>
            <span>{colorLabel}</span>
            <span style={{ color: "rgba(0,0,0,0.55)", fontWeight: 700 }}>
              {colorMin.toFixed(2)} — {colorMax.toFixed(2)}
            </span>
          </div>
          <div className={styles.gradBar} />
          <div className={styles.gradTicks}>
            <span>{colorMin.toFixed(2)}</span>
            <span>{((colorMin + colorMax) / 2).toFixed(2)}</span>
            <span>{colorMax.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className={styles.plotWrap}>
        <Plot
          revision={plotRevision}
          data={computed.traces as any}
          layout={layout}
          config={config}
          useResizeHandler={true}
          style={{ width: "100%", height: "100%" }}
          onClick={(ev: any) => {
            const points: any[] = Array.isArray(ev?.points) ? ev.points : [];
            if (points.length === 0) return;

            for (const pt of points) {
              const fromPoint = pt?.customdata;
              const fromTraceArr = pt?.data?.customdata?.[pt?.pointIndex];
              const ds = fromPoint ?? fromTraceArr;
              if (ds) {
                onSelectDataset?.(String(ds));
                return;
              }
            }

            for (const pt of points) {
              const traceType = String(pt?.data?.type ?? "");
              if (traceType === "mesh3d" && pt?.data?.name) {
                onSelectDataset?.(String(pt.data.name));
                return;
              }
            }
          }}
        />
      </div>

      <div className={styles.detailCard}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>Details</div>
        </div>

        <div className={styles.detailBody}>
          {!selectedDataset && (
            <div className={styles.muted}>
              Select a dataset from the dropdown above, or click one in the 3D plot, to view statistics.
            </div>
          )}

          {selectedDataset && (
            <>
              <div className={styles.detailDatasetName}>
                {selectedDataset} <span className={styles.detailPop}>({population})</span>
              </div>

              {statsLoading && <div className={styles.muted}>Loading stats…</div>}

              {statsErr && (
                <div className={styles.muted} style={{ whiteSpace: "pre-wrap" }}>
                  {statsErr}
                </div>
              )}

              {stats && (
                <>
                  <div className={styles.muted} style={{ marginBottom: 10 }}>
                    n_items = <b>{stats.n_items}</b>
                  </div>

                  <table className={styles.statsTable}>
                    <thead>
                      <tr>
                        <th>metric</th>
                        <th>mean</th>
                        <th>std</th>
                        <th>min</th>
                        <th>max</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stats.stats).map(([k, v]) => (
                        <tr key={k}>
                          <td style={{ fontWeight: 700 }}>{k}</td>
                          <td>{fmt(v.mean)}</td>
                          <td>{fmt(v.std)}</td>
                          <td>{fmt(v.min)}</td>
                          <td>{fmt(v.max)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}