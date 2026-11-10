
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Target,
  RefreshCw,
  AlertCircle,
  Plus,
} from "lucide-react";

import {
  getFinancialGoals,
  createFinancialGoal,
} from "./financialGoalService";

import GoalStats from "./components/GoalStats";
import GoalCard from "./components/GoalCard";
import GoalProgress from "./components/GoalProgress";
import GoalModal from "./components/GoalModal";

import "./FinancialGoalsPage.css";

const FinancialGoalsPage = () => {
  const [goals, setGoals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [actionError, setActionError] = useState("");

  // Fetch Financial Goals
  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getFinancialGoals();

      const fetchedGoals = response?.data?.goals;

      setGoals(
        Array.isArray(fetchedGoals) ? fetchedGoals : [],
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load your financial goals. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Calculate Dashboard Statistics
  const stats = useMemo(() => {
    const activeGoals = goals.filter(
      (goal) => goal.status === "active",
    );

    const completedGoals = goals.filter(
      (goal) => goal.status === "completed",
    );

    const totalSaved = goals.reduce(
      (total, goal) =>
        total + Number(goal.savedAmount || 0),
      0,
    );

    const totalTarget = goals.reduce(
      (total, goal) =>
        total + Number(goal.targetAmount || 0),
      0,
    );

    const overallProgress =
      totalTarget > 0
        ? Math.min(100, (totalSaved / totalTarget) * 100)
        : 0;

    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      totalSaved,
      overallProgress,
    };
  }, [goals]);

  // Open Create Goal Modal
  const handleOpenGoalModal = () => {
    setActionError("");
    setIsGoalModalOpen(true);
  };

  // Close Create Goal Modal
  const handleCloseGoalModal = () => {
    if (creatingGoal) return;

    setIsGoalModalOpen(false);
    setActionError("");
  };

  // Create Financial Goal
  const handleCreateGoal = async (goalData) => {
    try {
      setCreatingGoal(true);
      setActionError("");

      await createFinancialGoal(goalData);

      setIsGoalModalOpen(false);

      await fetchGoals();
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
        "Unable to create your financial goal. Please try again.",
      );
    } finally {
      setCreatingGoal(false);
    }
  };

  return (
    <div className="financial-goals-page">

      {/* Page Heading */}
      <div className="financial-goals-heading">
        <div>
          <span className="financial-goals-eyebrow">
            PLAN YOUR FUTURE
          </span>

          <h2>Financial Goals</h2>

          <p>
            Turn your financial dreams into achievable milestones.
          </p>
        </div>

        <div className="financial-goals-actions">

          {/* Refresh */}
          <button
            type="button"
            className="goals-refresh-button"
            onClick={fetchGoals}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={loading ? "refresh-spinning" : ""}
            />
            Refresh
          </button>

          {/* Create Goal */}
          <button
            type="button"
            className="create-goal-button"
            onClick={handleOpenGoalModal}
          >
            <Plus size={17} />
            Create Goal
          </button>

        </div>
      </div>

      {/* Goal Creation API Error */}
      {actionError && (
        <div className="goal-action-error" role="alert">
          <AlertCircle size={17} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Statistics */}
      <GoalStats stats={stats} />

      {/* Overall Progress */}
      {!loading && !error && goals.length > 0 && (
        <section className="overall-goal-progress">
          <div className="overall-progress-heading">
            <div>
              <span>YOUR SAVINGS JOURNEY</span>
              <h3>Overall progress</h3>
            </div>

            <strong>
              {stats.overallProgress.toFixed(1)}%
            </strong>
          </div>

          <GoalProgress
            percentage={stats.overallProgress}
            variant="overall"
            label="Overall savings progress"
          />
        </section>
      )}

      {/* Goals Section */}
      <section className="goals-list-section">

        <div className="goals-list-heading">
          <div>
            <h3>Your goals</h3>

            <p>
              Track your savings and celebrate every milestone.
            </p>
          </div>

          <span className="goals-count">
            {stats.totalGoals}{" "}
            {stats.totalGoals === 1 ? "Goal" : "Goals"}
          </span>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="goals-loading">
            <div className="goals-loader" />
            <p>Loading your financial goals...</p>
          </div>

        ) : error ? (

          /* Error State */
          <div className="goals-error">
            <AlertCircle size={22} />

            <p>{error}</p>

            <button
              type="button"
              onClick={fetchGoals}
            >
              Try again
            </button>
          </div>

        ) : goals.length === 0 ? (

          /* Empty State */
          <div className="goals-empty-state">
            <div className="goals-empty-icon">
              <Target size={30} />
            </div>

            <h3>Your financial journey starts here</h3>

            <p>
              You haven't created any financial goals yet.
              Start by defining something you want to save for.
            </p>

            <button
              type="button"
              className="create-goal-button"
              onClick={handleOpenGoalModal}
            >
              <Plus size={17} />
              Create Your First Goal
            </button>
          </div>

        ) : (

          /* Financial Goals Grid */
          <div className="financial-goals-grid">
            {goals.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
              />
            ))}
          </div>
        )}

      </section>

      {/* Create Goal Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={handleCloseGoalModal}
        onSubmit={handleCreateGoal}
        loading={creatingGoal}
      />

    </div>
  );
};

export default FinancialGoalsPage;
