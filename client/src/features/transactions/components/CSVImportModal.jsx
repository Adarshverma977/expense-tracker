
import "./CSVImportModal.css";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileSpreadsheet,
  FileUp,
  Upload,
  X,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function CSVImportModal({
  isOpen,
  onClose,
  onImport,
  isImporting = false,
  apiError = "",
}) {
  const fileInputRef = useRef(null);
  const browseButtonRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setError("");
      setIsDragging(false);
      return undefined;
    }

    previousActiveElementRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = requestAnimationFrame(() => {
      browseButtonRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();

        if (!isImporting) {
          onClose?.();
        }

        return;
      }

      if (event.key === "Tab") {
        const modal = document.querySelector(".csv-import-modal");

        const focusableElements = modal?.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0];
        const lastElement =
          focusableElements[focusableElements.length - 1];

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
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElementRef.current?.focus?.();
    };
  }, [isOpen, isImporting, onClose]);

  const validateFile = (file) => {
    if (!file) return false;

    const isCSV = file.name.toLowerCase().endsWith(".csv");

    if (!isCSV) {
      setError("Please select a valid CSV file.");
      return false;
    }

    if (file.size === 0) {
      setError("The selected file is empty.");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size must not exceed 2 MB.");
      return false;
    }

    setSelectedFile(file);
    setError("");
    return true;
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      validateFile(file);
    }

    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    if (isImporting) return;

    const file = event.dataTransfer.files?.[0];

    if (file) {
      validateFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || isImporting) return;

    setError("");

    try {
      await onImport(selectedFile);
    } catch (importError) {
      setError(
        importError?.response?.data?.message ||
        importError?.message ||
        "Unable to import CSV file. Please try again."
      );
    }
  };

  const handleClose = () => {
    if (isImporting) return;

    onClose?.();
  };

  const handleRemoveFile = () => {
    if (isImporting) return;

    setSelectedFile(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    browseButtonRef.current?.focus();
  };

  const displayedError = error || apiError;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="transaction-modal-overlay csv-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleClose();
            }
          }}
        >
          <motion.section
            className="transaction-modal csv-import-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="csv-import-title"
            aria-describedby="csv-import-description"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <header className="transaction-modal-header">
              <div>
                <span className="transaction-modal-eyebrow">
                  TRANSACTION MANAGEMENT
                </span>

                <h2 id="csv-import-title">
                  Import transactions
                </h2>

                <p id="csv-import-description">
                  Upload a CSV file to add transactions to Moneta.
                </p>
              </div>

              <button
                type="button"
                className="transaction-modal-close"
                onClick={handleClose}
                disabled={isImporting}
                aria-label="Close import modal"
              >
                <X size={19} />
              </button>
            </header>

            <div className="csv-import-content">
              <div
                className={`csv-upload-zone ${isDragging ? "dragging" : ""
                  } ${selectedFile ? "has-file" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault();

                  if (!isImporting) {
                    setIsDragging(true);
                  }
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIsDragging(false);
                  }
                }}
                onDrop={handleDrop}
                aria-label="CSV file upload area"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={handleFileChange}
                  disabled={isImporting}
                  aria-label="Choose CSV file"
                />

                {selectedFile ? (
                  <div className="csv-selected-file">
                    <div className="csv-file-icon">
                      <FileSpreadsheet size={25} />
                    </div>

                    <div className="csv-file-details">
                      <strong title={selectedFile.name}>
                        {selectedFile.name}
                      </strong>
                      <span>
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="csv-remove-file"
                      onClick={handleRemoveFile}
                      disabled={isImporting}
                      aria-label="Remove selected file"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="csv-upload-icon">
                      <FileUp size={28} />
                    </div>

                    <h3>Drop your CSV file here</h3>

                    <p>or choose a file from your device</p>

                    <button
                      ref={browseButtonRef}
                      type="button"
                      className="transaction-secondary-button csv-browse-button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                    >
                      <Upload size={16} />
                      Browse files
                    </button>
                  </>
                )}
              </div>

              <div className="csv-format-info">
                <div className="csv-info-heading">
                  <FileSpreadsheet size={17} />
                  <strong>CSV file requirements</strong>
                </div>

                <ul>
                  <li>Only .csv files are supported.</li>
                  <li>Maximum file size: 2 MB.</li>
                  <li>Maximum import limit: 1,000 rows.</li>
                  <li>
                    Required columns: title, amount, type, category and date.
                  </li>
                </ul>
              </div>

              <AnimatePresence mode="wait">
                {displayedError && (
                  <motion.div
                    key={displayedError}
                    className="csv-import-error"
                    role="alert"
                    initial={{ opacity: 0, y: 5, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -5, height: 0 }}
                  >
                    <AlertCircle size={17} />
                    <span>{displayedError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="csv-import-note">
                <CheckCircle2 size={16} />
                <span>
                  Existing duplicate transactions will be skipped by the
                  import service.
                </span>
              </div>
            </div>

            <footer className="transaction-form-actions csv-modal-actions">
              <button
                type="button"
                className="transaction-secondary-button"
                onClick={handleClose}
                disabled={isImporting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="transaction-primary-button"
                onClick={handleImport}
                disabled={!selectedFile || isImporting}
              >
                {isImporting ? (
                  <>
                    <span className="transaction-loading-spinner csv-button-spinner" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Import transactions
                  </>
                )}
              </button>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CSVImportModal;
