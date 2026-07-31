import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { buildReportExcel } from "@/lib/reports/export-excel";
import { parseReportFilters } from "@/lib/reports/params";
import { getReportData } from "@/lib/reports/queries";

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const filters = parseReportFilters(Object.fromEntries(url.searchParams.entries()));
    const report = await getReportData(filters);
    const buffer = buildReportExcel(report);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${report.type}-report.xlsx"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate Excel report.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
