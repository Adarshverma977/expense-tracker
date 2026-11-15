
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Target,
  RefreshCw,
  AlertCircle,
  Plus,
  Archive,
  CircleCheck,
  Activity,
  Layers3,
} from "lucide-react";

import {
  getFinancialGoals,
  createFinancialGoal,
} from "./financialGoalService";

import GoalStats from "./components/GoalStats";
import GoalCard from "./components/GoalCard";
import GoalProgress from "./components/GoalProgress";
import GoalModal from "./components/GoalModal";
import GoalDetails from "./components/GoalDetails";

import "./FinancialGoalsPage.css";

const getErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

const getSafeAmount = (value) => {
  const amount = Number(value);

  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
};

const tabs = [
  {
    id: "all",
    label: "All Goals",
    icon: Layers3,
  },
  {
    id: "active",
    label: "Active",
    icon: Activity,
  },
  {
    id: "completed",
    label: "Completed",
    icon: CircleCheck,
  },
  {
    id: "archived",
    label: "Archived",
    icon: Archive,
  },
];

const FinancialGoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [archivedGoals, setArchivedGoals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [archivedError, setArchivedError] = useState("");

  const [activeTab, setActiveTab] = useState("all");

  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [creatingGoal, setCreatingGoal] = useState(false);

  const requestIdRef = useRef(0);

  const fetchGoals = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError("");
    setArchivedError("");

    const [currentResult, archivedResult] = await Promise.allSettled([
      getFinancialGoals(),
      getFinancialGoals({ status: "archived" }),
    ]);

    if (requestId !== requestIdRef.current) return;

    if (currentResult.status === "fulfilled") {
      const fetchedGoals = currentResult.value?.data?.goals;

      if (Array.isArray(fetchedGoals)) {
        setGoals(
          fetchedGoals.filter(
            (goal) =>
              goal &&
              typeof goal === "object" &&
              typeof goal._id === "string" &&
              ["active", "completed"].includes(goal.status),
          ),
        );
      } else {
        setError("Unexpected financial goals response from server.");
      }
    } else {
      setError(
        getErrorMessage(
          currentResult.reason,
          "Unable to load your financial goals. Please try again.",
        ),
      );
    }

    if (archivedResult.status === "fulfilled") {
      const fetchedArchivedGoals = archivedResult.value?.data?.goals;

      if (Array.isArray(fetchedArchivedGoals)) {
        setArchivedGoals(
          fetchedArchivedGoals.filter(
            (goal) =>
              goal &&
              typeof goal === "object" &&
              typeof goal._id === "string" &&
              goal.status === "archived",
          ),
        );
      } else {
        setArchivedError(
          "Unexpected archived goals response from server.",
        );
      }
    } else {
      setArchivedError(
        getErrorMessage(
          archivedResult.reason,
          "Unable to load archived goals. Please try again.",
        ),
      );
    }

    if (requestId === requestIdRef.current) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();

    return () => {
      requestIdRef.current += 1;
    };
  }, [fetchGoals]);

  const stats = useMemo(() => {
    const activeGoals = goals.filter(
      (goal) => goal.status === "active",
    );

    const completedGoals = goals.filter(
      (goal) => goal.status === "completed",
    );

    const totalSaved = goals.reduce(
      (total, goal) => total + getSafeAmount(goal.savedAmount),
      0,
    );

    const totalTarget = goals.reduce(
      (total, goal) => total + getSafeAmount(goal.targetAmount),
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

  const visibleGoals = useMemo(() => {
    if (activeTab === "archived") {
      return archivedGoals;
    }

    if (activeTab === "active") {
      return goals.filter((goal) => goal.status === "active");
    }

    if (activeTab === "completed") {
      return goals.filter((goal) => goal.status === "completed");
    }

    return goals;
  }, [activeTab, goals, archivedGoals]);

  const tabCounts = useMemo(
    () => ({
      all: goals.length,
      active: stats.activeGoals,
      completed: stats.completedGoals,
      archived: archivedGoals.length,
    }),
    [
      goals.length,
      stats.activeGoals,
      stats.completedGoals,
      archivedGoals.length,
    ],
  );

  const handleOpenGoalModal = () => {
    setIsGoalModalOpen(true);
  };

  const handleCloseGoalModal = () => {
    if (creatingGoal) return;

    setIsGoalModalOpen(false);
  };

  const handleCreateGoal = async (goalData) => {
    if (creatingGoal) return;

    setCreatingGoal(true);

    try {
      await createFinancialGoal(goalData);

      setIsGoalModalOpen(false);
      setActiveTab("all");

      await fetchGoals();
    } catch (err) {
      throw new Error(
        getErrorMessage(
          err,
          "Unable to create your financial goal. Please try again.",
        ),
        { cause: err },
      );
    } finally {
      setCreatingGoal(false);
    }
  };

  const handleOpenGoalDetails = (goalId) => {
    if (!goalId) return;

    setSelectedGoalId(goalId);
  };

  const handleCloseGoalDetails = () => {
    setSelectedGoalId(null);
  };

  const currentTabError =
    activeTab === "archived" ? archivedError : error;

  const isArchivedTab = activeTab === "archived";

  const currentTabCount = visibleGoals.length;

  const emptyStateContent = {
    all: {
      title: "Your financial journey starts here",
      description:
        "You haven't created any financial goals yet. Start by defining something you want to save for.",
      icon: Target,
      action: true,
    },
    active: {
      title: "No active goals",
      description:
        "You don't have any active financial goals right now. Create a new goal to start your savings journey.",
      icon: Activity,
      action: true,
    },
    completed: {
      title: "No completed goals yet",
      description:
        "Your completed financial milestones will appear here. Keep working towards your savings targets.",
      icon: CircleCheck,
      action: false,
    },
    archived: {
      title: "No archived goals",
      description:
        "Goals you archive will appear here. You can restore them anytime or permanently delete them.",
      icon: Archive,
      action: false,
    },
  };

  const emptyState = emptyStateContent[activeTab];
  const EmptyIcon = emptyState.icon;

  return (
    <div className="financial-goals-page">
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

          <button
            type="button"
            className="create-goal-button"
            onClick={handleOpenGoalModal}
            disabled={creatingGoal}
          >
            <Plus size={17} />
            Create Goal
          </button>
        </div>
      </div>

      <GoalStats stats={stats} />

      {!loading &&
        !error &&
        goals.length > 0 &&
        !isArchivedTab && (
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

      <section className="goals-list-section">
        <div className="goals-list-heading">
          <div>
            <h3>Your goals</h3>

            <p>
              Track your savings and celebrate every milestone.
            </p>
          </div>

          <span className="goals-count">
            {currentTabCount}{" "}
            {currentTabCount === 1 ? "Goal" : "Goals"}
          </span>
        </div>

        <div
          className="financial-goals-tabs"
          role="tablist"
          aria-label="Filter financial goals"
        >
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isSelected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`financial-goals-tab ${isSelected ? "active" : ""
                  }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <TabIcon size={16} />
                <span>{tab.label}</span>
                <span className="financial-goals-tab-count">
                  {tabCounts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div
            className="goals-loading"
            role="status"
            aria-live="polite"
          >
            <div className="goals-loader" />
            <p>Loading your financial goals...</p>
          </div>
        ) : currentTabError ? (
          <div className="goals-error" role="alert">
            <AlertCircle size={22} />

            <p>{currentTabError}</p>

            <button
              type="button"
              onClick={fetchGoals}
              disabled={loading}
            >
              Try again
            </button>
          </div>
        ) : visibleGoals.length === 0 ? (
          <div className="goals-empty-state">
            <div className="goals-empty-icon">
              <EmptyIcon size={30} />
            </div>

            <h3>{emptyState.title}</h3>

            <p>{emptyState.description}</p>

            {emptyState.action && (
              <button
                type="button"
                className="create-goal-button"
                onClick={handleOpenGoalModal}
              >
                <Plus size={17} />
                Create Goal
              </button>
            )}
          </div>
        ) : (
          <div className="financial-goals-grid">
            {visibleGoals.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                onClick={() => handleOpenGoalDetails(goal._id)}
              />
            ))}
          </div>
        )}
      </section>

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={handleCloseGoalModal}
        onSubmit={handleCreateGoal}
        loading={creatingGoal}
        mode="create"
      />

      {selectedGoalId && (
        <GoalDetails
          goalId={selectedGoalId}
          onClose={handleCloseGoalDetails}
          onGoalUpdated={fetchGoals}
        />
      )}
    </div>
  );
};

export default FinancialGoalsPage;
