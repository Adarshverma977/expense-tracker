import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useTheme } from "../../app/ThemeContext";
import "./CategoryBreakdownChart.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function CategoryBreakdownChart({ data = [] }) {
  const { isDark } = useTheme();

  const chartData = data
    .map((category) => ({
      ...category,
      totalAmount: Number(category.totalAmount) || 0,
    }))
    .filter((category) => category.totalAmount > 0);

  const totalExpenses = chartData.reduce(
    (total, category) => total + category.totalAmount,
    0
  );

  const tooltipStyle = {
    backgroundColor: isDark ? "#1B2920" : "#FFFFFF",
    border: `1px solid ${isDark ? "#34483A" : "#E5EAE5"}`,
    borderRadius: "12px",
    color: isDark ? "#EDF5EF" : "#17251E",
    padding: "10px 14px",
  };

  if (!chartData.length) {
    return (
      <div className="category-chart-empty">
        <div className="category-chart-empty-icon">◌</div>
        <h3>No expense data yet</h3>
        <p>Your category breakdown will appear here once you add expenses.</p>
      </div>
    );
  }

  return (
    <div className="category-chart">
      <div className="category-chart-visual">
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
            >
              {chartData.map((category, index) => (
                <Cell
                  key={category.categoryId || index}
                  fill={category.color || "#176B45"}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value) => formatCurrency(value)}
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
        {chartData.map((category) => {
          const percentage =
            totalExpenses > 0
              ? (category.totalAmount / totalExpenses) * 100
              : 0;

          return (
            <div
              className="category-legend-item"
              key={category.categoryId}
            >
              <div className="category-legend-info">
                <span
                  className="category-legend-dot"
                  style={{
                    backgroundColor: category.color || "#176B45",
                  }}
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