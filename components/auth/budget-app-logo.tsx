type BudgetAppLogoProps = {
  className?: string;
};

export function BudgetAppLogo({ className = "" }: BudgetAppLogoProps) {
  return (
    <div className={`login-logo ${className}`.trim()}>
      <span aria-hidden="true" className="login-logo-mark">
        <svg fill="none" height="32" viewBox="0 0 32 32" width="32" xmlns="http://www.w3.org/2000/svg">
          <rect fill="#7c3aed" height="32" rx="8" width="32" />
          <path
            d="M9 12.5C9 11.1193 10.1193 10 11.5 10H20.5C21.8807 10 23 11.1193 23 12.5V19.5C23 20.8807 21.8807 22 20.5 22H11.5C10.1193 22 9 20.8807 9 19.5V12.5Z"
            fill="white"
            fillOpacity="0.92"
          />
          <path
            d="M12 15.5H20M12 18H17"
            stroke="#7c3aed"
            strokeLinecap="round"
            strokeWidth="1.75"
          />
        </svg>
      </span>
      <span className="login-logo-text">BudgetApp</span>
    </div>
  );
}
