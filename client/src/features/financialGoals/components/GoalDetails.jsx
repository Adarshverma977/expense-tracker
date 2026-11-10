
import { useCallback, useEffect, useState } from "react";
import {
  X,
  Target,
  CalendarDays,
  Wallet,
  TrendingUp,
  CircleCheck,
  AlertCircle,
  Pencil,
  Archive,
  PlusCircle,
} from "lucide-react";

import {
  getFinancialGoalById,
  updateFinancialGoal,
  archiveFinancialGoal,
  createGoalContribution,
} from "../financialGoalService";

import GoalProgress from "./GoalProgress";
import GoalModal from "./GoalModal";
import ContributionForm from "./ContributionForm";
import ContributionHistory from "./ContributionHistory";

const formatCurrency = (amount) => {
  const value = Number(amount || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
};

const formatDate = (date) => {
  if (!date) return "Not specified";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not specified";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const GoalDetails = ({ goalId, onClose, onGoalUpdated }) => {
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updatingGoal, setUpdatingGoal] = useState(false);

  const [showContributionForm, setShowContributionForm] = useState(false);
  const [submittingContribution, setSubmittingContribution] =
    useState(false);

  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const [showArchiveConfirmation, setShowArchiveConfirmation] =
    useState(false);

  const [archivingGoal, setArchivingGoal] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchGoalDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getFinancialGoalById(goalId);

      setGoal(response?.data?.goal || null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load goal details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    if (goalId) {
      fetchGoalDetails();
    }
  }, [goalId, fetchGoalDetails]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;

      if (
        isEditModalOpen ||
        showArchiveConfirmation ||
        showContributionForm ||
        submittingContribution ||
        archivingGoal ||
        updatingGoal
      ) {
        return;
      }

      onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    onClose,
    isEditModalOpen,
    showArchiveConfirmation,
    showContributionForm,
    submittingContribution,
    archivingGoal,
    updatingGoal,
  ]);

  const handleUpdateGoal = async (goalData) => {
    try {
      setUpdatingGoal(true);
      setActionError("");

      await updateFinancialGoal(goalId, goalData);

      setIsEditModalOpen(false);

      await fetchGoalDetails();

      if (onGoalUpdated) {
        await onGoalUpdated();
      }
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
        "Unable to update this financial goal. Please try again."
      );
    } finally {
      setUpdatingGoal(false);
    }
  };

  const handleContributionSubmit = async (contributionData) => {
    try {
      setSubmittingContribution(true);
      setActionError("");

      await createGoalContribution(goalId, contributionData);

      setShowContributionForm(false);

      setHistoryRefreshKey((previous) => previous + 1);

      await fetchGoalDetails();

      if (onGoalUpdated) {
        await onGoalUpdated();
      }
    } catch (err) {
      throw err;
    } finally {
      setSubmittingContribution(false);
    }
  };

  const handleArchiveGoal = async () => {
    try {
      setArchivingGoal(true);
      setActionError("");

      await archiveFinancialGoal(goalId);

      setShowArchiveConfirmation(false);
      onClose();

      if (onGoalUpdated) {
        try {
          await onGoalUpdated();
        } catch (refreshError) {
          console.error(
            "Unable to refresh financial goals:",
            refreshError
          );
        }
      }
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
        "Unable to archive this financial goal. Please try again."
      );
    } finally {
      setArchivingGoal(false);
    }
  };

  const progress = Math.min(
    100,
    Math.max(0, Number(goal?.progressPercentage || 0))
  );

  const isCompleted = goal?.status === "completed";
  const isArchived = goal?.status === "archived";

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

  return (
    <>
      <div
        className="goal-details-overlay"
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !isEditModalOpen &&
            !showArchiveConfirmation &&
            !showContributionForm &&
            !submittingContribution &&
            !archivingGoal &&
            !updatingGoal
          ) {
            onClose();
          }
        }}
      >
        <section
          className="goal-details-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="goal-details-title"
        >
          <header className="goal-details-header">
            <div>
              <span className="goal-details-eyebrow">
                FINANCIAL MILESTONE
              </span>

              <h2 id="goal-details-title">Goal Details</h2>
            </div>

            <button
              type="button"
              className="goal-details-close"
              onClick={onClose}
              aria-label="Close goal details"
              disabled={
                updatingGoal ||
                archivingGoal ||
                submittingContribution
              }
            >
              <X size={19} />
            </button>
          </header>

          {loading ? (
            <div className="goal-details-loading">
              <div className="goals-loader" />
              <p>Loading goal details...</p>
            </div>
          ) : error ? (
            <div className="goal-details-error">
              <AlertCircle size={25} />
              <p>{error}</p>

              <button type="button" onClick={fetchGoalDetails}>
                Try again
              </button>
            </div>
          ) : goal ? (
            <div className="goal-details-content">
              <div className="goal-details-main">
                <div
                  className="goal-details-icon"
                  style={{
                    "--goal-color": goal.color || "#176B45",
                  }}
                >
                  <Target size={27} />
                </div>

                <div className="goal-details-title">
                  <h3>{goal.title}</h3>

                  <p>
                    {goal.description ||
                      "No description added for this goal."}
                  </p>
                </div>

                <span className={`goal-status ${statusClass}`}>
                  {isCompleted && <CircleCheck size={13} />}
                  {statusLabel}
                </span>
              </div>

              {actionError && (
                <div
                  className="goal-details-action-error"
                  role="alert"
                >
                  <AlertCircle size={17} />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="goal-details-progress">
                <div className="goal-details-progress-heading">
                  <span>Goal completion</span>
                  <strong>{progress.toFixed(1)}%</strong>
                </div>

                <GoalProgress
                  percentage={progress}
                  color={goal.color || "#176B45"}
                  label="Financial goal completion"
                />

                <div className="goal-details-progress-footer">
                  <span>{formatCurrency(goal.savedAmount)} saved</span>
                  <span>{formatCurrency(goal.targetAmount)} target</span>
                </div>
              </div>

              <div className="goal-details-stats">
                <div className="goal-details-stat">
                  <div className="goal-details-stat-icon">
                    <Wallet size={18} />
                  </div>

                  <span>Total saved</span>
                  <strong>{formatCurrency(goal.savedAmount)}</strong>
                </div>

                <div className="goal-details-stat">
                  <div className="goal-details-stat-icon">
                    <Target size={18} />
                  </div>

                  <span>Target amount</span>
                  <strong>{formatCurrency(goal.targetAmount)}</strong>
                </div>

                <div className="goal-details-stat">
                  <div className="goal-details-stat-icon">
                    <TrendingUp size={18} />
                  </div>

                  <span>Remaining amount</span>
                  <strong>
                    {formatCurrency(goal.remainingAmount)}
                  </strong>
                </div>

                <div className="goal-details-stat">
                  <div className="goal-details-stat-icon">
                    <CalendarDays size={18} />
                  </div>

                  <span>Target date</span>
                  <strong>{formatDate(goal.targetDate)}</strong>
                </div>
              </div>

              {isCompleted && (
                <div className="goal-completed-message">
                  <CircleCheck size={18} />
                  Congratulations! You have achieved this financial goal.
                </div>
              )}

              {!isArchived && (
                <div className="goal-contribution-section">
                  <div className="goal-contribution-heading">
                    <div>
                      <h3>Manage your savings</h3>
                      <p>Record money saved towards this goal.</p>
                    </div>

                    <button
                      type="button"
                      className="goal-contribution-toggle"
                      onClick={() => {
                        setActionError("");
                        setShowContributionForm((previous) => !previous);
                      }}
                      disabled={
                        updatingGoal ||
                        archivingGoal ||
                        submittingContribution
                      }
                    >
                      <PlusCircle size={16} />
                      {showContributionForm
                        ? "Cancel"
                        : "Add Contribution"}
                    </button>
                  </div>

                  {showContributionForm && (
                    <ContributionForm
                      savedAmount={goal.savedAmount}
                      onSubmit={handleContributionSubmit}
                      onCancel={() => setShowContributionForm(false)}
                      loading={submittingContribution}
                    />
                  )}
                </div>
              )}

              <ContributionHistory
                goalId={goalId}
                refreshKey={historyRefreshKey}
              />

              {showArchiveConfirmation && (
                <div className="goal-archive-confirmation">
                  <div className="goal-archive-confirmation-icon">
                    <Archive size={20} />
                  </div>

                  <div className="goal-archive-confirmation-content">
                    <h3>Archive this goal?</h3>

                    <p>
                      This goal will be moved out of your active goals.
                      Its contribution history will remain preserved.
                    </p>
                  </div>

                  <div className="goal-archive-confirmation-actions">
                    <button
                      type="button"
                      className="goal-cancel-button"
                      onClick={() =>
                        setShowArchiveConfirmation(false)
                      }
                      disabled={archivingGoal}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="goal-archive-confirm-button"
                      onClick={handleArchiveGoal}
                      disabled={archivingGoal}
                    >
                      {archivingGoal ? "Archiving..." : "Yes, Archive"}
                    </button>
                  </div>
                </div>
              )}

              <footer className="goal-details-footer">
                {!isArchived && (
                  <div className="goal-details-management-actions">
                    <button
                      type="button"
                      className="goal-details-edit-button"
                      onClick={() => {
                        setActionError("");
                        setIsEditModalOpen(true);
                      }}
                      disabled={
                        updatingGoal ||
                        archivingGoal ||
                        submittingContribution
                      }
                    >
                      <Pencil size={15} />
                      Edit Goal
                    </button>

                    <button
                      type="button"
                      className="goal-details-archive-button"
                      onClick={() => {
                        setActionError("");
                        setShowArchiveConfirmation(true);
                      }}
                      disabled={
                        updatingGoal ||
                        archivingGoal ||
                        submittingContribution
                      }
                    >
                      <Archive size={15} />
                      Archive
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  className="goal-details-done-button"
                  onClick={onClose}
                  disabled={
                    updatingGoal ||
                    archivingGoal ||
                    submittingContribution
                  }
                >
                  Close
                </button>
              </footer>
            </div>
          ) : (
            <div className="goal-details-error">
              <AlertCircle size={25} />
              <p>Goal details could not be found.</p>
            </div>
          )}
        </section>
      </div>

      {goal && (
        <GoalModal
          isOpen={isEditModalOpen}
          mode="edit"
          initialGoal={goal}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateGoal}
          loading={updatingGoal}
        />
      )}
    </>
  );
};

export default GoalDetails;
