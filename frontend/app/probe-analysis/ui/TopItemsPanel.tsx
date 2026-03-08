"use client";

import styles from "../ProbeAnalysis.module.css";

type PopKey = "curated" | "hf";

export type ProbeItemStub = {
  id: string;
  rank: number;
  dataset: string;
  property: string;
  score: number;
  title: string;
};

const PROPS = ["difficulty", "uniqueness", "risk", "surprise", "typicality", "bridge"] as const;

export default function TopItemsPanel(props: {
  population: PopKey;
  selectedProperty: string;
  items: ProbeItemStub[];
  onChangeProperty: (p: string) => void;
  onOpenItem: (it: ProbeItemStub) => void;
}) {
  const { selectedProperty, items, onChangeProperty, onOpenItem } = props;

  return (
    <div className={styles.split}>
      {/* 左：列表 */}
      <div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 52 }}>Rank</th>
              <th>Probe</th>
              <th style={{ width: 120 }}>Dataset</th>
              <th style={{ width: 90 }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.muted}>
                  No items (placeholder).
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id}>
                  <td>#{it.rank}</td>
                  <td>
                    <button className={styles.rowButton} onClick={() => onOpenItem(it)} title="open details">
                      {it.title}
                    </button>
                  </td>
                  <td>{it.dataset}</td>
                  <td>{it.score.toFixed(3)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 右：property 切换区（后面你可以换成更高级的筛选器） */}
      <div>
        <div className={styles.muted} style={{ marginBottom: 8 }}>
          Choose property
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PROPS.map((p) => {
            const active = p === selectedProperty;
            return (
              <button
                key={p}
                className={styles.closeBtn}
                onClick={() => onChangeProperty(p)}
                style={{
                  borderColor: active ? "rgba(0,0,0,0.35)" : undefined,
                  fontWeight: active ? 700 : 500,
                }}
              >
                {p}
              </button>
            );
          })}
        </div>

        <div className={styles.panelPlaceholder} style={{ marginTop: 12, height: 220 }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Filters Placeholder</div>
            <div className={styles.muted}>
              这里后续可以放：dataset 选择、阈值筛选（top-k）、以及与你的 3D 图联动的控制器。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
