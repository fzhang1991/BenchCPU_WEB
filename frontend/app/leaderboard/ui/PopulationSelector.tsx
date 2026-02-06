"use client";

import styles from "../Leaderboard.module.css";

export type Population = "Curated" | "HF";

export default function PopulationSelector({
  value,
  onChange,
}: {
  value: Population;
  onChange: (v: Population) => void;
}) {
  return (
    <div className={styles.popWrap}>
      <div className={styles.popLabel}>Population</div>
      <div className={styles.popPills}>
        <button
          type="button"
          className={`${styles.popPill} ${value === "Curated" ? styles.popActive : ""}`}
          onClick={() => onChange("Curated")}
        >
          Curated
        </button>
        <button
          type="button"
          className={`${styles.popPill} ${value === "HF" ? styles.popActive : ""}`}
          onClick={() => onChange("HF")}
        >
          HF
        </button>
      </div>
    </div>
  );
}
