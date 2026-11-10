
const GoalProgress = ({
  percentage = 0,
  color,
  variant = "goal",
  label = "Progress",
}) => {
  const progress = Math.min(
    100,
    Math.max(0, Number(percentage) || 0),
  );

  const isOverall = variant === "overall";

  return (
    <div
      className={
        isOverall
          ? "overall-progress-track"
          : "goal-progress-track"
      }
    >
      <div
        className={
          isOverall
            ? "overall-progress-fill"
            : "goal-progress-fill"
        }
        role="progressbar"
        aria-label={label}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          width: `${progress}%`,
          ...(color ? { "--goal-color": color } : {}),
        }}
      />
    </div>
  );
};

export default GoalProgress;
