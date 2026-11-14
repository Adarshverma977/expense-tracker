
import "./CSVImportSummary.css";
import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  FileSpreadsheet,
  X,
  CircleAlert,
} from "lucide-react";

const summaryItems = [
  {
    key: "imported",
    label: "Imported",
    description: "Successfully added",
    icon: CheckCircle2,
    color: "success",
  },
  {
    key: "duplicates",
    label: "Duplicates",
    description: "Already existed or repeated",
    icon: Copy,
    color: "warning",
  },
  {
    key: "skipped",
    label: "Skipped",
    description: "Not imported",
    icon: CircleAlert,
    color: "neutral",
  },
  {
    key: "failed",
    label: "Failed",
    description: "Could not be processed",
    icon: AlertCircle,
    color: "danger",
  },
];

const getSafeNumber = (value) => {
  const number = Number(value ?? 0);

  return Number.isFinite(number) && number >= 0 ? number : 0;
};

const getErrorMessage = (error) => {
  if (typeof error === "string") return error;

  return (
    error?.message ||
    error?.error ||
    "Unable to process this row."
  );
};

function CSVImportSummary({ result, onClose }) {
  const closeButtonRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  const report = useMemo(() => {
    const responseData = result?.data ?? result ?? {};
    const nestedData = responseData?.data ?? responseData;
    const summary = nestedData?.summary ?? nestedData;

    const rawErrors =
      nestedData?.errors ??
      summary?.errors ??
      [];

    const errors = Array.isArray(rawErrors) ? rawErrors : [];

    return {
      totalRows: getSafeNumber(summary?.totalRows),
      imported: getSafeNumber(summary?.imported),
      skipped: getSafeNumber(summary?.skipped),
      duplicates: getSafeNumber(summary?.duplicates),
      failed: getSafeNumber(summary?.failed),
      databaseFailures: getSafeNumber(summary?.databaseFailures),
      errors,
    };
  }, [result]);

  const hasErrors =
    report.failed > 0 ||
    report.databaseFailures > 0 ||
    report.errors.length > 0;

  useEffect(() => {
    if (!result) return undefined;

    previousActiveElementRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== "Tab") return;

      const modal = document.querySelector(".csv-summary-modal");

      const focusableElements = modal?.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === firstElement
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElementRef.current?.focus?.();
    };
  }, [result, onClose]);

  if (!result) return null;

  return (
    <motion.div
      className="transaction-modal-overlay csv-summary-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <motion.section
        className="transaction-modal csv-summary-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="csv-summary-title"
        aria-describedby="csv-summary-description"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <header className="transaction-modal-header">
          <div>
            <span className="transaction-modal-eyebrow">
              IMPORT REPORT
            </span>

            <h2 id="csv-summary-title">
              Import completed
            </h2>

            <p id="csv-summary-description">
              Here's the summary of your CSV import.
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="transaction-modal-close"
            onClick={onClose}
            aria-label="Close import summary"
          >
            <X size={19} />
          </button>
        </header>

        <div className="csv-summary-overview">
          <div
            className={`csv-summary-status ${hasErrors ? "has-errors" : "success"
              }`}
          >
            {hasErrors ? (
              <AlertCircle size={23} />
            ) : (
              <CheckCircle2 size={23} />
            )}
          </div>

          <div>
            <strong>
              {report.imported} transactions imported
            </strong>

            <span>
              {report.totalRows} total rows processed
            </span>
          </div>
        </div>

        <div className="csv-summary-grid">
          {summaryItems.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.key}
                className={`csv-summary-card ${item.color}`}
              >
                <div className="csv-summary-card-top">
                  <span>{item.label}</span>
                  <Icon size={18} />
                </div>

                <strong>{report[item.key]}</strong>

                <small>{item.description}</small>
              </article>
            );
          })}
        </div>

        {report.databaseFailures > 0 && (
          <div className="csv-summary-database-warning" role="alert">
            <AlertCircle size={17} />
            <span>
              {report.databaseFailures} database operation(s) failed.
            </span>
          </div>
        )}

        {report.errors.length > 0 && (
          <div className="csv-summary-errors">
            <h3>Import details ({report.errors.length})</h3>

            <div className="csv-summary-error-list">
              {report.errors.map((error, index) => {
                const rowNumber =
                  error?.row ?? error?.rowNumber ?? "—";

                return (
                  <div
                    className="csv-summary-error-item"
                    key={`${rowNumber}-${index}`}
                  >
                    <span>Row {rowNumber}</span>

                    <p>{getErrorMessage(error)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="csv-summary-footer">
          <div className="csv-summary-file-info">
            <FileSpreadsheet size={17} />
            <span>CSV import report</span>
          </div>

          <button
            type="button"
            className="transaction-primary-button"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}

export default CSVImportSummary;
