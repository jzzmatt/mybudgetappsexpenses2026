"use client";

import { formatExpensePercentage } from "@/lib/expenses/format";
import { useTranslations } from "@/lib/i18n/client";

type ExpensePercentageBarProps = {
  percent: number;
  labelSuffix?: string;
  ariaLabel?: string;
};

export function ExpensePercentageBar({ percent, labelSuffix = "", ariaLabel }: ExpensePercentageBarProps) {
  const { t } = useTranslations();
  const clamped = Math.min(100, Math.max(0, percent));
  const isHigh = percent > 50;
  const formatted = formatExpensePercentage(percent);
  const displayLabel = labelSuffix ? `${formatted}${labelSuffix}` : formatted;
  const defaultAriaLabel = labelSuffix
    ? t("expenses.paidPercentAria", { percent: formatted })
    : `${formatted} ${t("expenses.percentage")}`;

  return (
    <div
      aria-label={ariaLabel ?? defaultAriaLabel}
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
      <span className="expense-percentage-label">{displayLabel}</span>
    </div>
  );
}
