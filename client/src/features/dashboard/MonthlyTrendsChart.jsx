
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTheme } from "../../app/ThemeContext";
import "./MonthlyTrendsChart.css";

const formatCurrency = (value) => {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const formatAxisCurrency = (value) => {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "₹0";
  }

  if (Math.abs(amount) >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }

  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }

  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}k`;
  }

  return `₹${amount}`;
};

const formatMonth = (year, month) => {
  const numericYear = Number(year);
  const numericMonth = Number(month);

  if (
    !Number.isInteger(numericYear) ||
    !Number.isInteger(numericMonth) ||
    numericMonth < 1 ||
    numericMonth > 12
  ) {
    return "Unknown";
  }

  return new Date(numericYear, numericMonth - 1).toLocaleDateString(
    "en-IN",
    {
      month: "short",
      year: "2-digit",
    }
  );
};

const MonthlyTrendsChart = ({ data = [] }) => {
  const { isDark } = useTheme();

  const safeData = Array.isArray(data) ? data : [];

  const chartData = safeData.map((item) => ({
    month: formatMonth(item.year, item.month),
    income: Number.isFinite(Number(item.income))
      ? Number(item.income)
      : 0,
    expenses: Number.isFinite(Number(item.expenses))
      ? Number(item.expenses)
      : 0,
  }));

  const hasData = chartData.some(
    (item) => item.income > 0 || item.expenses > 0
  );

  const textColor = isDark ? "#A0ADA4" : "#68766D";
  const gridColor = isDark ? "#2A3930" : "#E5EAE4";
  const incomeColor = isDark ? "#48C99A" : "#159A70";
  const expenseColor = isDark ? "#F07870" : "#E16A5B";

  const tooltipStyle = {
    backgroundColor: isDark ? "#17221C" : "#FFFFFF",
    border: `1px solid ${gridColor}`,
    borderRadius: "12px",
    color: isDark ? "#F1F5F2" : "#18231D",
    boxShadow: isDark
      ? "0 8px 24px rgba(0, 0, 0, 0.25)"
      : "0 8px 24px rgba(20, 45, 30, 0.08)",
    fontSize: "12px",
    padding: "10px 13px",
  };

  if (!hasData) {
    return (
      <div className="chart-empty-state">
        <p>No financial activity yet.</p>
        <span>Your monthly trends will appear here.</span>
      </div>
    );
  }

  return (
    <div
      className="monthly-trends-chart"
      role="img"
      aria-label="Bar chart comparing monthly income and expenses"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
          barGap={8}
          barCategoryGap="25%"
        >
          <CartesianGrid
            stroke={gridColor}
            strokeDasharray="4 4"
            vertical={false}
          />

          <XAxis
            dataKey="month"
            tick={{
              fill: textColor,
              fontSize: 10,
              fontWeight: 500,
            }}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            minTickGap={12}
          />

          <YAxis
            tickFormatter={formatAxisCurrency}
            tick={{
              fill: textColor,
              fontSize: 10,
              fontWeight: 500,
            }}
            axisLine={false}
            tickLine={false}
            width={58}
            tickMargin={8}
          />

          <Tooltip
            formatter={(value, name) => [
              formatCurrency(value),
              name === "income" ? "Income" : "Expenses",
            ]}
            contentStyle={tooltipStyle}
            cursor={{
              fill: isDark
                ? "rgba(255,255,255,0.045)"
                : "rgba(20,125,90,0.045)",
            }}
          />

          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontSize: "11px",
              paddingBottom: "20px",
              color: textColor,
            }}
            formatter={(value) => (
              <span style={{ color: textColor }}>
                {value === "income" ? "Income" : "Expenses"}
              </span>
            )}
          />

          <Bar
            dataKey="income"
            name="income"
            fill={incomeColor}
            radius={[5, 5, 0, 0]}
            maxBarSize={32}
            animationDuration={900}
            animationEasing="ease-out"
          />

          <Bar
            dataKey="expenses"
            name="expenses"
            fill={expenseColor}
            radius={[5, 5, 0, 0]}
            maxBarSize={32}
            animationDuration={1100}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyTrendsChart;
