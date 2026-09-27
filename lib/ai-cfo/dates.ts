export const AI_CFO_DEFAULT_TIMEZONE = "Africa/Luanda";

export const DATE_PRESETS = [
  "today",
  "yesterday",
  "this_week",
  "last_week",
  "this_month",
  "last_month",
  "this_year",
  "last_year",
  "last_3_months",
  "last_6_months",
] as const;

export type DatePreset = (typeof DATE_PRESETS)[number];

export type DateRangeInput = {
  preset?: DatePreset;
  year?: number;
  month?: number;
  quarter?: 1 | 2 | 3 | 4;
  startDate?: string;
  endDate?: string;
};

export type ResolvedDateRange =
  | { ok: true; unbounded: true }
  | { ok: true; unbounded: false; startDate: string; endDate: string; label: string }
  | { ok: false; reason: "year_required" | "invalid_range" };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function zonedCalendarParts(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  if (!year || !month || !day) {
    throw new Error("Unable to resolve the calendar date.");
  }

  return { year, month, day };
}

function addDays(year: number, month: number, day: number, delta: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + delta);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function addMonths(year: number, month: number, delta: number) {
  const index = year * 12 + (month - 1) + delta;
  return {
    year: Math.floor(index / 12),
    month: (index % 12) + 1,
  };
}

function weekday(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function bounded(start: { year: number; month: number; day: number }, end: { year: number; month: number; day: number }): ResolvedDateRange {
  const startDate = toIsoDate(start.year, start.month, start.day);
  const endDate = toIsoDate(end.year, end.month, end.day);

  if (startDate > endDate) {
    return { ok: false, reason: "invalid_range" };
  }

  return {
    ok: true,
    unbounded: false,
    startDate,
    endDate,
    label: `${startDate} to ${endDate}`,
  };
}

export function isIsoDateInRange(date: string, range: { startDate: string; endDate: string }) {
  return date >= range.startDate && date <= range.endDate;
}

export function resolveDateRange(input: DateRangeInput | undefined, now: Date, timeZone: string): ResolvedDateRange {
  if (!input || Object.values(input).every((value) => value === undefined)) {
    return { ok: true, unbounded: true };
  }

  if (input.startDate || input.endDate) {
    if (!input.startDate || !input.endDate || !ISO_DATE.test(input.startDate) || !ISO_DATE.test(input.endDate)) {
      return { ok: false, reason: "invalid_range" };
    }

    if (input.startDate > input.endDate) {
      return { ok: false, reason: "invalid_range" };
    }

    return {
      ok: true,
      unbounded: false,
      startDate: input.startDate,
      endDate: input.endDate,
      label: `${input.startDate} to ${input.endDate}`,
    };
  }

  if (input.month && !input.year) {
    return { ok: false, reason: "year_required" };
  }

  if (input.quarter && !input.year) {
    return { ok: false, reason: "year_required" };
  }

  if (input.year && input.month) {
    const lastDay = daysInMonth(input.year, input.month);
    return bounded(
      { year: input.year, month: input.month, day: 1 },
      { year: input.year, month: input.month, day: lastDay },
    );
  }

  if (input.year && input.quarter) {
    const startMonth = (input.quarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    return bounded(
      { year: input.year, month: startMonth, day: 1 },
      { year: input.year, month: endMonth, day: daysInMonth(input.year, endMonth) },
    );
  }

  if (input.year && !input.preset) {
    return bounded({ year: input.year, month: 1, day: 1 }, { year: input.year, month: 12, day: 31 });
  }

  const today = zonedCalendarParts(now, timeZone);

  switch (input.preset) {
    case "today":
      return bounded(today, today);
    case "yesterday": {
      const day = addDays(today.year, today.month, today.day, -1);
      return bounded(day, day);
    }
    case "this_week": {
      const offset = weekday(today.year, today.month, today.day);
      const mondayOffset = offset === 0 ? 6 : offset - 1;
      return bounded(addDays(today.year, today.month, today.day, -mondayOffset), today);
    }
    case "last_week": {
      const offset = weekday(today.year, today.month, today.day);
      const mondayOffset = offset === 0 ? 6 : offset - 1;
      const thisMonday = addDays(today.year, today.month, today.day, -mondayOffset);
      const start = addDays(thisMonday.year, thisMonday.month, thisMonday.day, -7);
      const end = addDays(thisMonday.year, thisMonday.month, thisMonday.day, -1);
      return bounded(start, end);
    }
    case "this_month":
      return bounded({ year: today.year, month: today.month, day: 1 }, today);
    case "last_month": {
      const previous = addMonths(today.year, today.month, -1);
      return bounded(
        { year: previous.year, month: previous.month, day: 1 },
        { year: previous.year, month: previous.month, day: daysInMonth(previous.year, previous.month) },
      );
    }
    case "this_year":
      return bounded({ year: today.year, month: 1, day: 1 }, today);
    case "last_year":
      return bounded({ year: today.year - 1, month: 1, day: 1 }, { year: today.year - 1, month: 12, day: 31 });
    case "last_3_months": {
      const start = addMonths(today.year, today.month, -2);
      return bounded({ year: start.year, month: start.month, day: 1 }, today);
    }
    case "last_6_months": {
      const start = addMonths(today.year, today.month, -5);
      return bounded({ year: start.year, month: start.month, day: 1 }, today);
    }
    default:
      return { ok: false, reason: "invalid_range" };
  }
}
