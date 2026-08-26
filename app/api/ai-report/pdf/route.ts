import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildAiReportPdf } from "@/lib/ai-report/export-pdf";
import { EXPENSE_CURRENCIES } from "@/lib/currency/types";

const aiReportSchema = z.object({
  title: z.string(),
  project_id: z.string().optional(),
  project_name: z.string().optional(),
  currency: z.enum(EXPENSE_CURRENCIES),
  executive_summary: z.string(),
  spending_analysis: z.string().default(""),
  key_findings: z.array(z.string()),
  largest_items: z.array(z.string()).default([]),
  pending_items: z.array(z.string()).default([]),
  recommendations: z.array(z.string()),
  risk_alerts: z.array(z.string()).default([]),
  generated_at: z.string(),
});

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = aiReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid AI report payload." }, { status: 400 });
    }

    const buffer = buildAiReportPdf(parsed.data);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="executive-ai-report.pdf"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
