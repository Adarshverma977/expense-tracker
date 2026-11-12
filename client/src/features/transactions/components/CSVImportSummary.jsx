
import "./CSVImportSummary.css";
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

function CSVImportSummary({ result, onClose }) {
  if (!result) return null;

  // Handle API response and nested backend summary
  const responseData = result.data ?? result;
  const summary = responseData.summary ?? responseData;
  const errors = responseData.errors ?? summary.errors ?? [];

  const {
    totalRows = 0,
    imported = 0,
    skipped = 0,
    duplicates = 0,
    failed = 0,
    databaseFailures = 0,
  } = summary;

  const hasErrors = failed > 0 || databaseFailures > 0;

  return (
    <motion.div
      className="transaction-modal-overlay csv-summary-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.section
        className="transaction-modal csv-summary-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="csv-summary-title"
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

            <p>
              Here's the summary of your CSV import.
            </p>
          </div>

          <button
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
            <strong>{imported} transactions imported</strong>

            <span>{totalRows} total rows processed</span>
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

                <strong>{Number(summary[item.key] || 0)}</strong>

                <small>{item.description}</small>
              </article>
            );
          })}
        </div>

        {databaseFailures > 0 && (
          <div className="csv-summary-database-warning">
            <AlertCircle size={17} />
            <span>
              {databaseFailures} database operation(s) failed.
            </span>
          </div>
        )}

        {Array.isArray(errors) && errors.length > 0 && (
          <div className="csv-summary-errors">
            <h3>Import details</h3>

            <div className="csv-summary-error-list">
              {errors.map((error, index) => (
                <div
                  className="csv-summary-error-item"
                  key={`${error.row ?? "row"}-${index}`}
                >
                  <span>Row {error.row ?? "—"}</span>

                  <p>
                    {error.message ||
                      error.error ||
                      "Unable to process this row."}
                  </p>
                </div>
              ))}
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
