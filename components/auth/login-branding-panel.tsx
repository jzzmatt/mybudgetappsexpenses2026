import { BudgetAppLogo } from "@/components/auth/budget-app-logo";

export function LoginBrandingPanel() {
  return (
    <aside aria-hidden="true" className="login-branding">
      <BudgetAppLogo className="login-branding-logo" />

      <div className="login-illustration">
        <div className="login-illustration-backdrop" />
        <div className="login-illustration-card login-illustration-card--secondary">
          <span className="login-illustration-label">Monthly Spending</span>
          <span className="login-illustration-value">$12,430</span>
          <div className="login-illustration-chart" />
        </div>
        <div className="login-illustration-card login-illustration-card--primary">
          <span className="login-illustration-label">Total Balance</span>
          <span className="login-illustration-balance">$52,765.00</span>
          <span className="login-illustration-change">+12.5% from last month</span>
        </div>
      </div>

      <p className="login-tagline">
        Take control of your finances. Track, plan, and grow your wealth.
      </p>
    </aside>
  );
}
