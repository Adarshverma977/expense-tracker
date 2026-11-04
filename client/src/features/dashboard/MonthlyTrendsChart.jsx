
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

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const MonthlyTrendsChart = ({ data = [] }) => {
  const { isDark } = useTheme();

  const chartData = data.map((item) => ({
    month: new Date(item.year, item.month - 1).toLocaleDateString(
      "en-IN",
      { month: "short" }
    ),
    income: Number(item.income),
    expenses: Number(item.expenses),
  }));

  const hasData = chartData.some(
    (item) => item.income > 0 || item.expenses > 0
  );

  const textColor = isDark ? "#A1B0A5" : "#66746B";
  const gridColor = isDark ? "#2B3A30" : "#E5EAE3";

  return (
    <div className="monthly-trends-chart">
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
            barGap={8}
            barCategoryGap="28%"
          >
            <CartesianGrid
              stroke={gridColor}
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tick={{ fill: textColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />

            <YAxis
              tickFormatter={(value) =>
                value >= 1000
                  ? `₹${(value / 1000).toFixed(0)}k`
                  : `₹${value}`
              }
              tick={{ fill: textColor, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={55}
            />

            <Tooltip
              formatter={(value, name) => [
                formatCurrency(value),
                name === "income" ? "Income" : "Expenses",
              ]}
              contentStyle={{
                background: isDark ? "#18231C" : "#FFFFFF",
                border: `1px solid ${gridColor}`,
                borderRadius: "12px",
                color: isDark ? "#EDF5EF" : "#17251E",
                fontSize: "12px",
              }}
              cursor={{
                fill: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(23,107,69,0.04)",
              }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{
                fontSize: "11px",
                paddingBottom: "20px",
              }}
              formatter={(value) =>
                value === "income" ? "Income" : "Expenses"
              }
            />

            <Bar
              dataKey="income"
              fill="#36A875"
              radius={[5, 5, 0, 0]}
              maxBarSize={32}
            />

            <Bar
              dataKey="expenses"
              fill="#E47C70"
              radius={[5, 5, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-empty-state">
          <p>No financial activity yet.</p>
          <span>Your monthly trends will appear here.</span>
        </div>
      )}
    </div>
  );
};

export default MonthlyTrendsChart;
