import styles from "./Explore.module.css";

export default function ExplorePage() {
  return (
    <div className={styles.page}>
      <div className={styles.heroCard}>
        <div className={styles.heroTitle}>Explore</div>
        <div className={styles.heroSub}>
          Placeholder page. This will become the single-page overview of the experimental pipeline and how Probing Memes works.
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Workflow (Placeholder)</div>
        <div className={styles.flow}>
          <div className={styles.node}>Dataset</div>
          <div className={styles.arrow}>→</div>
          <div className={styles.node}>Meme Probes</div>
          <div className={styles.arrow}>→</div>
          <div className={styles.node}>Probe Properties</div>
          <div className={styles.arrow}>→</div>
          <div className={styles.node}>Meme Scores</div>
          <div className={styles.arrow}>→</div>
          <div className={styles.node}>Analysis</div>
        </div>

        <div className={styles.note}>
        placehold
        </div>
      </div>
    </div>
  );
}