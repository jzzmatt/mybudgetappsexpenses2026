import { formatExpensePercentage } from "@/lib/expenses/format";

type ExpensePercentageBarProps = {
  percent: number;
};

export function ExpensePercentageBar({ percent }: ExpensePercentageBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const isHigh = percent > 50;

  return (
    <div
      aria-label={`${formatExpensePercentage(percent)} of total budget`}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={clamped}
      className="expense-percentage-bar"
      role="progressbar"
    >
      <div className="expense-percentage-track">
        <div
          className={`expense-percentage-fill${isHigh ? " expense-percentage-fill-high" : ""}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="expense-percentage-label">{formatExpensePercentage(percent)}</span>
    </div>
  );
}
