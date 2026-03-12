"use client";

import { useId } from "react";
import styles from "../Leaderboard.module.css";

export type Population = "Curated" | "HF";

type PopulationTooltipText = {
  population: string;
  populationTooltipTitle: string;
  populationTooltipDesc: string;
  curatedPopulationTitle: string;
  curatedPopulationDesc: string;
  hfPopulationTitle: string;
  hfPopulationDesc: string;
};

export default function PopulationSelector({
  value,
  onChange,
  text,
}: {
  value: Population;
  onChange: (v: Population) => void;
  text?: PopulationTooltipText;
}) {
  const tooltipId = useId();

  const t = text ?? {
    population: "Population",
    populationTooltipTitle: "Population",
    populationTooltipDesc:
      "The set of models analyzed together. The results shown on this page are computed based on these models.",
    curatedPopulationTitle: "Curated Population",
    curatedPopulationDesc:
      "A set of representative models, designed to produce clearer and more interpretable behavioral contrasts.",
    hfPopulationTitle: "HF Population",
    hfPopulationDesc:
      "A broader population from the Open LLM Leaderboard, with Probing Memes metrics computed based on publicly available information from Hugging Face.",
  };

  return (
    <div className={styles.popWrap}>
      <div className={styles.popInfoWrap}>
        <button
          type="button"
          className={styles.popHelpBtn}
          aria-label={`${t.population} info`}
          aria-describedby={tooltipId}
        >
          ?
        </button>

        <div className={styles.popLabel}>{t.population}</div>

        <div id={tooltipId} role="tooltip" className={styles.popTooltip}>
          <div className={styles.popTooltipTitle}>{t.populationTooltipTitle}</div>
          <div className={styles.popTooltipText}>{t.populationTooltipDesc}</div>

          <div className={styles.popTooltipSection}>
            <div className={styles.popTooltipSubTitle}>{t.curatedPopulationTitle}</div>
            <div className={styles.popTooltipText}>{t.curatedPopulationDesc}</div>
          </div>

          <div className={styles.popTooltipSection}>
            <div className={styles.popTooltipSubTitle}>{t.hfPopulationTitle}</div>
            <div className={styles.popTooltipText}>{t.hfPopulationDesc}</div>
          </div>
        </div>
      </div>

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