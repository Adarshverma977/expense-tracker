
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Wallet,
} from "lucide-react";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    x: -25,
    transition: { duration: 0.2 },
  },
};

function TransactionTable({ transactions, onEdit, onDelete }) {
  const [activeMenu, setActiveMenu] = useState(null);

  if (!transactions.length) {
    return (
      <motion.div
        className="transaction-empty-state"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <motion.div
          className="transaction-empty-icon"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <Wallet size={28} />
        </motion.div>
        <h3>No transactions found</h3>
        <p>Try changing your filters or add a new transaction.</p>
      </motion.div>
    );
  }

  return (
    <div className="transaction-table-wrapper">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Category</th>
            <th>Date</th>
            <th>Payment method</th>
            <th className="transaction-amount-heading">Amount</th>
            <th aria-label="Actions"></th>
          </tr>
        </thead>

        <tbody>
          <AnimatePresence initial={false}>
            {transactions.map((transaction, index) => {
              const id = transaction._id || transaction.id;
              const isIncome = transaction.type === "income";
              const category =
                typeof transaction.category === "object"
                  ? transaction.category
                  : null;

              return (
                <motion.tr
                  key={id}
                  layout
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{
                    layout: { duration: 0.25 },
                    delay: index * 0.035,
                  }}
                >
                  <td>
                    <div className="transaction-main-cell">
                      <span
                        className={`transaction-type-icon ${isIncome ? "income" : "expense"
                          }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft size={18} />
                        ) : (
                          <ArrowUpRight size={18} />
                        )}
                      </span>

                      <div>
                        <strong>{transaction.title}</strong>
                        <span>
                          {transaction.description || "No description"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="transaction-category-cell">
                      <span
                        className="transaction-category-dot"
                        style={{
                          backgroundColor:
                            category?.color || "var(--color-primary)",
                        }}
                      />
                      {category?.name || "Uncategorized"}
                    </div>
                  </td>

                  <td>{formatDate(transaction.date)}</td>

                  <td>
                    <span className="transaction-payment-method">
                      {(transaction.paymentMethod || "other")
                        .replaceAll("_", " ")
                        .replace(/\b\w/g, (letter) =>
                          letter.toUpperCase()
                        )}
                    </span>
                  </td>

                  <td
                    className={`transaction-amount ${isIncome ? "income" : "expense"
                      }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </td>

                  <td>
                    <div className="transaction-action-wrapper">
                      <motion.button
                        type="button"
                        className="transaction-menu-trigger"
                        aria-label="Transaction actions"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          setActiveMenu(activeMenu === id ? null : id)
                        }
                      >
                        <MoreHorizontal size={19} />
                      </motion.button>

                      <AnimatePresence>
                        {activeMenu === id && (
                          <motion.div
                            className="transaction-action-menu"
                            initial={{ opacity: 0, scale: 0.94, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: -5 }}
                            transition={{ duration: 0.16 }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenu(null);
                                onEdit(transaction);
                              }}
                            >
                              <Pencil size={15} />
                              Edit
                            </button>

                            <button
                              type="button"
                              className="delete-action"
                              onClick={() => {
                                setActiveMenu(null);
                                onDelete(transaction);
                              }}
                            >
                              <Trash2 size={15} />
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}

export default TransactionTable;
