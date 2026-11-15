
const GoalProgress = ({
  percentage = 0,
  color,
  variant = "goal",
  label = "Progress",
}) => {
  const numericPercentage = Number(percentage);

  const progress = Number.isFinite(numericPercentage)
    ? Math.min(100, Math.max(0, numericPercentage))
    : 0;

  const isOverall = variant === "overall";

  const trackClassName = isOverall
    ? "overall-progress-track"
    : "goal-progress-track";

  const fillClassName = isOverall
    ? "overall-progress-fill"
    : "goal-progress-fill";

  return (
    <div
      className={trackClassName}
      role="progressbar"
      aria-label={label}
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={fillClassName}
        style={{
          width: `${progress}%`,
          ...(color ? { "--goal-color": color } : {}),
        }}
      />
    </div>
  );
};

export default GoalProgress;
