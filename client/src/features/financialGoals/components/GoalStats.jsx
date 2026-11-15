
import {
  Target,
  Wallet,
  TrendingUp,
  CircleCheck,
} from "lucide-react";

const numberFormatter = new Intl.NumberFormat("en-IN");

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const getSafeNumber = (value) => {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const formatCurrency = (amount) => {
  return currencyFormatter.format(getSafeNumber(amount));
};

const formatNumber = (value) => {
  return numberFormatter.format(getSafeNumber(value));
};

const GoalStats = ({ stats = {} }) => {
  const statItems = [
    {
      label: "Total Goals",
      value: formatNumber(stats.totalGoals),
      description: "Your financial milestones",
      icon: Target,
      color: "green",
    },
    {
      label: "Total Saved",
      value: formatCurrency(stats.totalSaved),
      description: "Across all your goals",
      icon: Wallet,
      color: "blue",
    },
    {
      label: "Active Goals",
      value: formatNumber(stats.activeGoals),
      description: "Goals you're working towards",
      icon: TrendingUp,
      color: "orange",
    },
    {
      label: "Completed Goals",
      value: formatNumber(stats.completedGoals),
      description: "Milestones achieved",
      icon: CircleCheck,
      color: "purple",
    },
  ];

  return (
    <div className="goal-stats-grid">
      {statItems.map((item) => {
        const Icon = item.icon;

        return (
          <div className="goal-stat-card" key={item.label}>
            <div className={`goal-stat-icon ${item.color}`}>
              <Icon size={20} strokeWidth={2} />
            </div>

            <span>{item.label}</span>

            <strong>{item.value}</strong>

            <small>{item.description}</small>
          </div>
        );
      })}
    </div>
  );
};

export default GoalStats;
