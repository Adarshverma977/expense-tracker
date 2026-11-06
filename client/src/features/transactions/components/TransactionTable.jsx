
import {
  ArrowDownLeft,
  ArrowUpRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Wallet,
} from "lucide-react";
import { useState } from "react";

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

function TransactionTable({
  transactions,
  onEdit,
  onDelete,
}) {
  const [activeMenu, setActiveMenu] = useState(null);

  if (!transactions.length) {
    return (
      <div className="transaction-empty-state">
        <div className="transaction-empty-icon">
          <Wallet size={28} />
        </div>
        <h3>No transactions found</h3>
        <p>Try changing your filters or add a new transaction.</p>
      </div>
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
          {transactions.map((transaction) => {
            const isIncome = transaction.type === "income";
            const category =
              typeof transaction.category === "object"
                ? transaction.category
                : null;

            return (
              <tr key={transaction._id || transaction.id}>
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
                    <button
                      type="button"
                      className="transaction-menu-trigger"
                      aria-label="Transaction actions"
                      onClick={() =>
                        setActiveMenu(
                          activeMenu === transaction._id
                            ? null
                            : transaction._id
                        )
                      }
                    >
                      <MoreHorizontal size={19} />
                    </button>

                    {activeMenu === transaction._id && (
                      <div className="transaction-action-menu">
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
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionTable;
