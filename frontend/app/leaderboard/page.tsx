import LeaderboardClient from "./ui/LeaderboardClient";
import styles from "./Leaderboard.module.css";

export default function Page() {
  return (
    <div className={styles.page}>
      <LeaderboardClient />
    </div>
  );
}
