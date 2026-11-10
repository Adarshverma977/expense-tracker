
import {
  Target,
  Wallet,
  TrendingUp,
  CircleCheck,
} from "lucide-react";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
};

const GoalStats = ({ stats }) => {
  const statItems = [
    {
      label: "Total Goals",
      value: stats.totalGoals,
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
      value: stats.activeGoals,
      description: "Goals you're working towards",
      icon: TrendingUp,
      color: "orange",
    },
    {
      label: "Completed Goals",
      value: stats.completedGoals,
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
              <Icon size={20} />
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
