
import { useEffect } from "react";
import { X, Target } from "lucide-react";

import GoalForm from "./GoalForm";

const GoalModal = ({ isOpen, onClose, onSubmit, loading }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="goal-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
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
        <div className="goal-modal-header">
          <div className="goal-modal-title-group">
            <div className="goal-modal-icon">
              <Target size={21} />
            </div>

            <div>
              <h2 id="goal-modal-title">Create a financial goal</h2>
              <p>Give your next milestone a clear target.</p>
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

        <GoalForm
          onSubmit={onSubmit}
          onCancel={onClose}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default GoalModal;
