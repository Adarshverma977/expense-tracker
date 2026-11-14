
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useTheme } from "../../app/ThemeContext";
import "./CategoryBreakdownChart.css";

const formatCurrency = (value) => {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const DEFAULT_COLORS = [
  "#147D5A",
  "#5185C5",
  "#D99A32",
  "#E16A5B",
  "#8B72C7",
  "#48A982",
  "#D17AAB",
  "#6C91A8",
];

function CategoryBreakdownChart({ data = [] }) {
  const { isDark } = useTheme();

  const safeData = Array.isArray(data) ? data : [];

  const chartData = safeData
    .map((category, index) => ({
      ...category,
      name: category.name || "Uncategorized",
      totalAmount: Number(category.totalAmount),
      transactionCount: Number(category.transactionCount) || 0,
      color:
        category.color ||
        DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    }))
    .filter(
      (category) =>
        Number.isFinite(category.totalAmount) &&
        category.totalAmount > 0
    );

  const totalExpenses = chartData.reduce(
    (total, category) => total + category.totalAmount,
    0
  );

  const tooltipStyle = {
    backgroundColor: isDark ? "#17221C" : "#FFFFFF",
    border: `1px solid ${isDark ? "#2A3930" : "#E5EAE4"}`,
    borderRadius: "12px",
    color: isDark ? "#F1F5F2" : "#18231D",
    boxShadow: isDark
      ? "0 8px 24px rgba(0, 0, 0, 0.25)"
      : "0 8px 24px rgba(20, 45, 30, 0.08)",
    padding: "10px 14px",
    fontSize: "12px",
  };

  if (!chartData.length) {
    return (
      <div className="category-chart-empty">
        <div className="category-chart-empty-icon">◌</div>
        <h3>No expense data yet</h3>
        <p>
          Your category breakdown will appear here once you add expenses.
        </p>
      </div>
    );
  }

  return (
    <div className="category-chart">
      <div
        className="category-chart-visual"
        role="img"
        aria-label={`Expense breakdown across ${chartData.length} categories. Total expenses ${formatCurrency(totalExpenses)}.`}
      >
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="totalAmount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={100}
              paddingAngle={3}
              stroke="none"
              animationBegin={0}
              animationDuration={900}
              animationEasing="ease-out"
            >
              {chartData.map((category, index) => (
                <Cell
                  key={category.categoryId || `${category.name}-${index}`}
                  fill={category.color}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value, name) => [
                formatCurrency(value),
                name || "Expenses",
              ]}
              contentStyle={tooltipStyle}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="category-chart-center">
          <span>Total Spent</span>
          <strong>{formatCurrency(totalExpenses)}</strong>
        </div>
      </div>

      <div className="category-chart-legend">
        {chartData.map((category, index) => {
          const percentage =
            totalExpenses > 0
              ? (category.totalAmount / totalExpenses) * 100
              : 0;

          return (
            <div
              className="category-legend-item"
              key={category.categoryId || `${category.name}-${index}`}
            >
              <div className="category-legend-info">
                <span
                  className="category-legend-dot"
                  style={{ backgroundColor: category.color }}
                />

                <div className="category-legend-details">
                  <span className="category-legend-name">
                    {category.name}
                  </span>

                  <span className="category-legend-count">
                    {category.transactionCount} transactions
                  </span>
                </div>
              </div>

              <div className="category-legend-values">
                <strong>{formatCurrency(category.totalAmount)}</strong>
                <span>{percentage.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryBreakdownChart;
