# Figma extracted data

Source: `ChatGPTBudgetApp`, page `0:1`. This file lists copy and data observed through the Figma metadata/design-context calls; it intentionally does not infer unreturned content.

## Dashboard — desktop (`10:4`)

- Brand: `MY Expense Tracker`
- Navigation: `Dashboard`, `Expenses`, `Budget`, `Categories`, `Projects`, `Vendors`, `Reports`, `Settings`
- User: `Junior Mateus` — `Administrator`
- Header: `Dashboard`; period selector `July 2026`
- KPI data:
  - `Total Budget` — `Kz 62,765,175.00` — `+12.5%`
  - `Total Paid` — `Kz 17,637,651.00` — `-3.2%`
  - `Remaining Budget` — `Kz 16,162,484.00` — `+8.1%`
  - `Pending Expenses` — `48` — `+5 this month`
- Charts: `Budget vs Paid by Category`, `Budget Allocation by Category`, `Monthly Expenses`
  - Categories: `Infrastructure`, `Marketing`, `Operations`, `HR`, `Technology`
  - Months: `Jan`, `Feb`, `Mar`, `Apr`, `May`, `Jun`, `Jul`, `Aug`, `Sep`, `Oct`, `Nov`, `Dec`
- Recent Expenses columns: `Date`, `Description`, `Category`, `Amount`, `Status`
  - `07/15/2026` | `Cloud Infrastructure` | `Technology` | `Kz 45,000.00` | `Paid`
  - `07/12/2026` | `Marketing Campaign` | `Marketing` | `Kz 28,500.00` | `Partial`
  - `07/10/2026` | `Office Supplies` | `Operations` | `Kz 3,200.00` | `Paid`
  - `07/08/2026` | `Team Building` | `HR` | `Kz 12,000.00` | `Pending`
  - `07/05/2026` | `Software License` | `Technology` | `Kz 8,750.00` | `Paid`
- Budget by Project columns: `Project`, `Budget`, `Paid`, `Progress`
  - `Alpha Platform` | `Kz 250,000` | `Kz 180,000` | 72%
  - `Beta Launch` | `Kz 150,000` | `Kz 95,000` | 63%
  - `Gamma System` | `Kz 320,000` | `Kz 210,000` | 66%
  - `Delta Portal` | `Kz 180,000` | `Kz 45,000` | 25%

## Reports — mobile (`10:1192`)

- Header/controls: `MY Expense Tracker`, `Reports`, `July 2026`, `Generate`
- Metrics: `Total Budget` / `Kz 62.7M`; `Total Paid` / `Kz 17.6M`; `Remaining` / `Kz 45.1M`; `Utilization` / `28.1%`
- Chart: `Budget vs Paid` with `Infra`, `Mkt`, `Ops`, `HR`, `Tech`
- `Budget Consumption`: `Infrastructure` 68%, `Marketing` 73%, `Operations` 65%, `Technology` 85%
- Bottom navigation: `Home`, `Expenses`, `Budget`, `Reports`, `More`

## Sign in

Desktop (`31:4`) and mobile (`37:2`) use the same content:

- Product: `BudgetApp`
- Heading: `Sign in to your account`
- Supporting text: `Welcome back! Please enter your details.`
- Fields: `Email` / `Enter your email`; `Password` / `••••••••`
- Options and actions: `Remember me`, `Forgot password?`, `Sign in`, `or`, `Continue with Google`, `Don't have an account?`, `Sign up`
- Desktop-only visual copy: `Total Balance`, `$52,765.00`, `+12.5% from last month`, `Take control of your finances. Track, plan, and grow your wealth.`

## Assets

The Figma design context returned temporary remote avatar, chart-point, and chart-line image URLs. They are intentionally not persisted because the links expire; no durable local asset paths were provided by the design.

## Visual QA

`Dashboard - Desktop` was rendered at its natural 1440 × 1024 size and visually checked. The screenshot confirms the 260px dark sidebar, 72px white header, four KPI cards, two-card chart row, full-width monthly chart, and the two lower tables recorded in the manifest.
