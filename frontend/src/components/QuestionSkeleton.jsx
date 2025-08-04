import styles from "../css/Question.module.css";

export default function QuestionSkeleton() {
  return (
    <div className={`${styles.card} ${styles.skeleton}`}>{/* width + style match */}
      <div className={styles.spinner} />
    </div>
  );
}