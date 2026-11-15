
import {
  Target,
  CalendarDays,
  CircleCheck,
  Archive,
} from "lucide-react";

import GoalProgress from "./GoalProgress";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const getSafeNumber = (value) => {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const formatCurrency = (amount) => {
  return currencyFormatter.format(getSafeNumber(amount));
};

const formatDate = (date) => {
  if (!date) return "No deadline";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "No deadline";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const GoalCard = ({ goal = {}, onClick }) => {
  const savedAmount = getSafeNumber(goal.savedAmount);
  const targetAmount = getSafeNumber(goal.targetAmount);

  const calculatedProgress =
    targetAmount > 0
      ? (savedAmount / targetAmount) * 100
      : 0;

  const progressValue =
    goal.progressPercentage !== undefined &&
      goal.progressPercentage !== null
      ? getSafeNumber(goal.progressPercentage)
      : calculatedProgress;

  const progress = Math.min(100, Math.max(0, progressValue));

  const remainingAmount =
    goal.remainingAmount !== undefined &&
      goal.remainingAmount !== null
      ? Math.max(0, getSafeNumber(goal.remainingAmount))
      : Math.max(0, targetAmount - savedAmount);

  const isArchived =
    goal.status === "archived" || Boolean(goal.archivedAt);

  const isCompleted =
    !isArchived &&
    (goal.status === "completed" || Boolean(goal.isCompleted));

  const goalTitle = goal.title || "Untitled Goal";
  const goalColor = goal.color || "#176B45";

  const statusLabel = isArchived
    ? "Archived"
    : isCompleted
      ? "Completed"
      : "Active";

  const statusClass = isArchived
    ? "archived"
    : isCompleted
      ? "completed"
      : "active";

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <article
      className={`financial-goal-card ${isArchived ? "archived-goal-card" : ""}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${goalTitle}, ${statusLabel}`}
    >
      <div className="goal-card-top">
        <div
          className="goal-icon"
          style={{
            "--goal-color": goalColor,
          }}
        >
          <Target size={21} />
        </div>

        <span className={`goal-status ${statusClass}`}>
          {isArchived ? (
            <Archive size={13} />
          ) : isCompleted ? (
            <CircleCheck size={13} />
          ) : null}

          {statusLabel}
        </span>
      </div>

      <div className="goal-card-heading">
        <h3>{goalTitle}</h3>

        <p>
          {goal.description ||
            "Keep moving towards your goal."}
        </p>
      </div>

      <div className="goal-card-amounts">
        <div>
          <span className="goal-amount-label">
            Saved so far
          </span>

          <strong>{formatCurrency(savedAmount)}</strong>
        </div>

        <div className="goal-target-amount">
          <span className="goal-amount-label">
            Target amount
          </span>

          <strong>{formatCurrency(targetAmount)}</strong>
        </div>
      </div>

      <div className="goal-progress-section">
        <div className="goal-progress-info">
          <span>Progress</span>
          <strong>{progress.toFixed(1)}%</strong>
        </div>

        <GoalProgress
          percentage={progress}
          color={goalColor}
          label={`${goalTitle} progress`}
        />
      </div>

      <div className="goal-card-footer">
        <span>
          <CalendarDays size={14} />
          {formatDate(goal.targetDate)}
        </span>

        <strong>
          {isArchived
            ? "Archived goal"
            : isCompleted
              ? "Goal achieved"
              : `${formatCurrency(remainingAmount)} left`}
        </strong>
      </div>
    </article>
  );
};

export default GoalCard;
