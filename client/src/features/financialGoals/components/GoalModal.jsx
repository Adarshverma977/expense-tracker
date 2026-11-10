
import { useEffect } from "react";

import {
  X,
  Target,
  Pencil,
} from "lucide-react";

import GoalForm from "./GoalForm";

const GoalModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  initialGoal = null,
  mode = "create",
}) => {
  const isEditMode = mode === "edit";

  // ========================================
  // ESCAPE KEY HANDLING
  // ========================================

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  return (
    <div
      className="goal-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <div
        className="goal-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-modal-title"
      >
        {/* Modal Header */}

        <div className="goal-modal-header">
          <div className="goal-modal-title-group">

            <div className="goal-modal-icon">
              {isEditMode ? (
                <Pencil size={21} />
              ) : (
                <Target size={21} />
              )}
            </div>

            <div>
              <h2 id="goal-modal-title">
                {isEditMode
                  ? "Edit financial goal"
                  : "Create a financial goal"}
              </h2>

              <p>
                {isEditMode
                  ? "Update your financial milestone."
                  : "Give your next milestone a clear target."}
              </p>
            </div>

          </div>

          <button
            type="button"
            className="goal-modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
          >
            <X size={19} />
          </button>
        </div>

        {/* Reusable Goal Form */}

        <GoalForm
          key={`${mode}-${initialGoal?._id || "new"}`}
          mode={mode}
          initialGoal={initialGoal}
          onSubmit={onSubmit}
          onCancel={onClose}
          loading={loading}
        />

      </div>
    </div>
  );
};

export default GoalModal;
