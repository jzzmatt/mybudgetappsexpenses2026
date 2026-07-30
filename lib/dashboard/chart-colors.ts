export const DASHBOARD_CHART_COLORS = [
  "#0063b1",
  "#107c10",
  "#ffb900",
  "#d13438",
  "#7c3aed",
  "#0891b2",
  "#ea580c",
  "#4b5563",
];

export function getChartColor(index: number) {
  return DASHBOARD_CHART_COLORS[index % DASHBOARD_CHART_COLORS.length];
}
