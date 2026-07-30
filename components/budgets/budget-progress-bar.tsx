type BudgetProgressBarProps = {
  percent: number;
};

export function BudgetProgressBar({ percent }: BudgetProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="budget-progress" aria-label={`${clamped.toFixed(0)}% used`}>
      <div className="budget-progress-track">
        <div className="budget-progress-fill" style={{ width: `${clamped}%` }} />
      </div>
      <span className="budget-progress-label">{clamped.toFixed(0)}%</span>
    </div>
  );
}
