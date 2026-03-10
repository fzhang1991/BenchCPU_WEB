"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import styles from "./LanguageSwitcher.module.css";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className={styles.pill} role="group" aria-label="Language switcher">
      <button
        type="button"
        className={`${styles.pillBtn} ${lang === "en" ? styles.pillActive : ""}`}
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        type="button"
        className={`${styles.pillBtn} ${lang === "zh" ? styles.pillActive : ""}`}
        onClick={() => setLang("zh")}
        aria-pressed={lang === "zh"}
      >
        中
      </button>
    </div>
  );
}