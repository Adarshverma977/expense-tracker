
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

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
  const modalRef = useRef(null);
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousActiveElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      modalRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (!loading) {
          event.preventDefault();
          onClose?.();
        }

        return;
      }

      if (event.key !== "Tab") return;

      const modal = modalRef.current;

      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
      );

      const elements = Array.from(focusableElements).filter(
        (element) => element.getClientRects().length > 0,
      );

      if (!elements.length) {
        event.preventDefault();
        modal.focus();
        return;
      }

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];
      const activeElement = document.activeElement;

      if (!modal.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
        return;
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus?.();
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="goal-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onClose?.();
        }
      }}
    >
      <div
        ref={modalRef}
        className="goal-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-modal-title"
        aria-describedby="goal-modal-description"
        aria-busy={loading}
        tabIndex={-1}
      >
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

              <p id="goal-modal-description">
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

        <GoalForm
          key={`${mode}-${initialGoal?._id || "new"}`}
          mode={mode}
          initialGoal={initialGoal}
          onSubmit={onSubmit}
          onCancel={onClose}
          loading={loading}
        />
      </div>
    </div>,
    document.body,
  );
};

export default GoalModal;
