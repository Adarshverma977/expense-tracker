
import {
  Target,
  CalendarDays,
  CircleCheck,
} from "lucide-react";

import GoalProgress from "./GoalProgress";

const formatCurrency = (amount) => {
  const value = Number(amount || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
};

const formatDate = (date) => {
  if (!date) return "No deadline";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const GoalCard = ({ goal, onClick }) => {
  const progress = Math.min(
    100,
    Math.max(0, Number(goal.progressPercentage || 0)),
  );

  const isCompleted =
    goal.status === "completed" || goal.isCompleted;

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <article
      className="financial-goal-card"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${goal.title}`}
    >
      <div className="goal-card-top">
        <div
          className="goal-icon"
          style={{
            "--goal-color": goal.color || "#176B45",
          }}
        >
          <Target size={21} />
        </div>

        {isCompleted ? (
          <span className="goal-status completed">
            <CircleCheck size={13} />
            Completed
          </span>
        ) : (
          <span className="goal-status active">
            Active
          </span>
        )}
      </div>

      <div className="goal-card-heading">
        <h3>{goal.title}</h3>

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

          <strong>
            {formatCurrency(goal.savedAmount)}
          </strong>
        </div>

        <div className="goal-target-amount">
          <span className="goal-amount-label">
            Target amount
          </span>

          <strong>
            {formatCurrency(goal.targetAmount)}
          </strong>
        </div>
      </div>

      <div className="goal-progress-section">
        <div className="goal-progress-info">
          <span>Progress</span>
          <strong>{progress.toFixed(1)}%</strong>
        </div>

        <GoalProgress
          percentage={progress}
          color={goal.color || "#176B45"}
          label={`${goal.title} progress`}
        />
      </div>

      <div className="goal-card-footer">
        <span>
          <CalendarDays size={14} />
          {formatDate(goal.targetDate)}
        </span>

        <strong>
          {isCompleted
            ? "Goal achieved"
            : `${formatCurrency(goal.remainingAmount)} left`}
        </strong>
      </div>
    </article>
  );
};

export default GoalCard;
