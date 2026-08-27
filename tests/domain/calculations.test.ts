import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateExpenseMetrics,
  calculateProjectFinancialSummary,
  enrichExpenseWithMetrics,
  willCauseProjectOverspending,
} from "@/lib/projects/calculations";
import { projectSchema } from "@/lib/projects/schema";
import { paymentProofExtractionSchema, projectScopedExpenseSchema } from "@/lib/expenses/schema";
import { categorySchema } from "@/lib/categories/schema";
import { vendorSchema } from "@/lib/vendors/schema";
import { generateProjectReportPdf } from "@/lib/projects/export-pdf";
import { buildAiReportPdf } from "@/lib/ai-report/export-pdf";
import type { ProjectReportData } from "@/lib/projects/types";
import type { AiReportResult } from "@/lib/ai-report/types";

describe("Project Domain Calculations & Financial Formulas", () => {
  it("calculates individual expense derived metrics correctly", () => {
    const expense = {
      budget_amount: 1000,
      paid_amount: 250,
    };
    const projectBudget = 5000;

    const metrics = calculateExpenseMetrics(expense, projectBudget);

    assert.equal(metrics.remaining, 750);
    assert.equal(metrics.expensePaidPercent, 25); // 250 / 1000 * 100
    assert.equal(metrics.projectBudgetImpactPercent, 5); // 250 / 5000 * 100
  });

  it("handles zero budgets without dividing by zero", () => {
    const expense = {
      budget_amount: 0,
      paid_amount: 0,
    };

    const metrics = calculateExpenseMetrics(expense, 0);

    assert.equal(metrics.remaining, 0);
    assert.equal(metrics.expensePaidPercent, 0);
    assert.equal(metrics.projectBudgetImpactPercent, 0);
  });

  it("enriches expense objects with derived metrics", () => {
    const expense = {
      id: "exp-1",
      user_id: "user-1",
      date: "2026-08-01",
      month: 8,
      year: 2026,
      project_id: "proj-1",
      category_id: null,
      vendor_id: null,
      description: "Test Expense",
      currency: "KZ" as const,
      budget_amount: 500,
      paid_amount: 200,
      balance: 300,
      payment_method: null,
      payment_reference: null,
      payment_proof_path: null,
      payment_proof_filename: null,
      priority: null,
      status: "partial",
      notes: null,
      created_at: "",
      updated_at: "",
    };

    const enriched = enrichExpenseWithMetrics(expense, 2000);

    assert.equal(enriched.derived.remaining, 300);
    assert.equal(enriched.derived.expensePaidPercent, 40);
    assert.equal(enriched.derived.projectBudgetImpactPercent, 10);
  });

  it("calculates comprehensive project financial summary matching PRODUCT_MODEL.md", () => {
    const project = {
      budget_amount: 10000,
      currency: "KZ" as const,
    };

    const expenses = [
      { budget_amount: 2000, paid_amount: 1500 },
      { budget_amount: 3000, paid_amount: 1000 },
      { budget_amount: 1000, paid_amount: 500 },
    ];

    const summary = calculateProjectFinancialSummary(project, expenses);

    assert.equal(summary.projectBudget, 10000);
    assert.equal(summary.totalExpenseBudget, 6000);
    assert.equal(summary.totalPaid, 3000);
    assert.equal(summary.totalExpenseRemaining, 3000);
    assert.equal(summary.availableBudget, 4000); // 10000 - 6000
    assert.equal(summary.projectPaidPercent, 30); // 3000 / 10000 * 100
    assert.equal(summary.allocatedPercent, 60); // 6000 / 10000 * 100
    assert.equal(summary.isOverspent, false);
    assert.equal(summary.expenseCount, 3);
    assert.equal(summary.currency, "KZ");
  });

  it("handles empty expenses array gracefully in calculateProjectFinancialSummary", () => {
    const project = {
      budget_amount: 5000,
      currency: "AOA" as const,
    };

    const summary = calculateProjectFinancialSummary(project, []);

    assert.equal(summary.projectBudget, 5000);
    assert.equal(summary.totalExpenseBudget, 0);
    assert.equal(summary.totalPaid, 0);
    assert.equal(summary.totalExpenseRemaining, 0);
    assert.equal(summary.availableBudget, 5000);
    assert.equal(summary.projectPaidPercent, 0);
    assert.equal(summary.allocatedPercent, 0);
    assert.equal(summary.isOverspent, false);
    assert.equal(summary.expenseCount, 0);
    assert.equal(summary.currency, "AOA");
  });

  it("detects overspending when total expense budget exceeds project budget", () => {
    const project = {
      budget_amount: 5000,
      currency: "KZ" as const,
    };

    const expenses = [
      { budget_amount: 3000, paid_amount: 2000 },
      { budget_amount: 3000, paid_amount: 1000 },
    ];

    const summary = calculateProjectFinancialSummary(project, expenses);

    assert.equal(summary.totalExpenseBudget, 6000);
    assert.equal(summary.availableBudget, -1000);
    assert.equal(summary.allocatedPercent, 120);
    assert.equal(summary.isOverspent, true);
  });

  it("handles boundary exact budget allocation (100% allocation, not overspent)", () => {
    const project = {
      budget_amount: 10000,
      currency: "KZ" as const,
    };

    const expenses = [
      { budget_amount: 6000, paid_amount: 6000 },
      { budget_amount: 4000, paid_amount: 2000 },
    ];

    const summary = calculateProjectFinancialSummary(project, expenses);

    assert.equal(summary.totalExpenseBudget, 10000);
    assert.equal(summary.availableBudget, 0);
    assert.equal(summary.allocatedPercent, 100);
    assert.equal(summary.projectPaidPercent, 80);
    assert.equal(summary.isOverspent, false);
  });

  it("evaluates willCauseProjectOverspending warning logic", () => {
    const projectBudget = 10000;
    const currentTotalExpenseBudget = 8000;

    // Adding 1500: total 9500 (not overspent)
    const result1 = willCauseProjectOverspending(projectBudget, currentTotalExpenseBudget, 1500);
    assert.equal(result1.isOverspent, false);
    assert.equal(result1.excessAmount, 0);
    assert.equal(result1.newTotalExpenseBudget, 9500);

    // Adding 3000: total 11000 (overspent by 1000)
    const result2 = willCauseProjectOverspending(projectBudget, currentTotalExpenseBudget, 3000);
    assert.equal(result2.isOverspent, true);
    assert.equal(result2.excessAmount, 1000);
    assert.equal(result2.newTotalExpenseBudget, 11000);

    // Updating existing expense of 2000 with 5000 (net change +3000): total 11000
    const result3 = willCauseProjectOverspending(projectBudget, currentTotalExpenseBudget, 5000, 2000);
    assert.equal(result3.isOverspent, true);
    assert.equal(result3.excessAmount, 1000);
    assert.equal(result3.newTotalExpenseBudget, 11000);
  });
});

describe("Project & Expense Domain Schemas", () => {
  it("validates project schema with mandatory budget and currency defaulting to KZ", () => {
    const valid = projectSchema.parse({
      name: "Alpha Workspace",
      budget_amount: "50000",
    });

    assert.equal(valid.name, "Alpha Workspace");
    assert.equal(valid.budget_amount, 50000);
    assert.equal(valid.currency, "KZ");
    assert.equal(valid.status, "active");
  });

  it("validates project-scoped expense schema with required project_id", () => {
    const valid = projectScopedExpenseSchema.parse({
      project_id: "550e8400-e29b-41d4-a716-446655440000",
      date: "2026-08-26",
      description: "Cloud Infrastructure",
      budget_amount: 1500,
    });

    assert.equal(valid.project_id, "550e8400-e29b-41d4-a716-446655440000");
    assert.equal(valid.budget_amount, 1500);
    assert.equal(valid.paid_amount, 0);
    assert.equal(valid.status, "pending");
  });

  it("rejects project-scoped expense schema without valid project_id", () => {
    assert.throws(() => {
      projectScopedExpenseSchema.parse({
        project_id: "not-a-uuid",
        date: "2026-08-26",
        description: "Invalid",
        budget_amount: 100,
      });
    });
  });

  it("validates shared category schema correctly", () => {
    const valid = categorySchema.parse({
      name: "Cloud Hosting",
      description: "Hosting and cloud servers across projects",
    });

    assert.equal(valid.name, "Cloud Hosting");
    assert.equal(valid.description, "Hosting and cloud servers across projects");
  });

  it("validates shared vendor schema correctly", () => {
    const valid = vendorSchema.parse({
      name: "AWS",
      contact_info: "billing@aws.amazon.com",
    });

    assert.equal(valid.name, "AWS");
    assert.equal(valid.contact_info, "billing@aws.amazon.com");
  });

  it("validates payment proof extraction schema output correctly", () => {
    const rawAiOutput = {
      date: "2026-07-27",
      description: "Payment to Adriano Eduardo",
      vendor_person: "ADRIANO UTALE CAMUTALI EDUARDO",
      paid_amount: 2083333,
      currency_detected: "Kz",
      payment_method: "bank_transfer",
      payment_reference: "32305151",
      suggested_expense_budget: 2083333,
      suggested_status: "paid",
      notes: "Extracted from bank transfer receipt",
      extraction_warnings: [],
    };

    const validated = paymentProofExtractionSchema.parse(rawAiOutput);
    assert.equal(validated.date, "2026-07-27");
    assert.equal(validated.vendor_person, "ADRIANO UTALE CAMUTALI EDUARDO");
    assert.equal(validated.paid_amount, 2083333);
    assert.equal(validated.payment_reference, "32305151");
    assert.equal(validated.payment_method, "bank_transfer");
    assert.equal(validated.suggested_status, "paid");
  });

  it("validates expense schema with optional payment proof fields", () => {
    const valid = projectScopedExpenseSchema.parse({
      project_id: "550e8400-e29b-41d4-a716-446655440000",
      date: "2026-08-27",
      description: "Hardware server procurement",
      budget_amount: 50000,
      paid_amount: 50000,
      payment_method: "bank_transfer",
      payment_reference: "TRX-998822",
      payment_proof_path: "user_1/proj_1/proof_123.pdf",
      payment_proof_filename: "receipt_server.pdf",
    });

    assert.equal(valid.payment_reference, "TRX-998822");
    assert.equal(valid.payment_proof_path, "user_1/proj_1/proof_123.pdf");
    assert.equal(valid.payment_proof_filename, "receipt_server.pdf");
  });

  it("generates a valid project PDF report buffer without throwing", () => {
    const mockReportData: ProjectReportData = {
      project: {
        id: "proj-1",
        user_id: "user-1",
        name: "Infrastructure Modernization",
        description: "Core cloud servers",
        budget_amount: 50000,
        currency: "KZ",
        status: "active",
        created_at: "",
        updated_at: "",
      },
      financials: {
        projectBudget: 50000,
        totalExpenseBudget: 35000,
        totalPaid: 20000,
        totalExpenseRemaining: 15000,
        availableBudget: 15000,
        projectPaidPercent: 40,
        allocatedPercent: 70,
        isOverspent: false,
        expenseCount: 2,
        currency: "KZ",
      },
      categoryAnalysis: [
        { category: "Hosting", expenseCount: 2, budget: 35000, paid: 20000, remaining: 15000, percentOfBudget: 100 },
      ],
      vendorAnalysis: [
        { vendor: "AWS", expenseCount: 2, budget: 35000, paid: 20000, remaining: 15000 },
      ],
      categoryChartData: [{ category: "Hosting", budget: 35000, paid: 20000 }],
      monthlyChartData: [{ month: "Aug", monthNumber: 8, budget: 35000, paid: 20000 }],
      expenses: [
        {
          id: "exp-1",
          user_id: "user-1",
          date: "2026-08-01",
          month: 8,
          year: 2026,
          project_id: "proj-1",
          category_id: null,
          vendor_id: null,
          description: "Production Cluster",
          currency: "KZ",
          budget_amount: 25000,
          paid_amount: 15000,
          balance: 10000,
          payment_method: "bank_transfer",
          payment_reference: "32305151",
          payment_proof_path: "user-1/proj-1/proof.pdf",
          payment_proof_filename: "receipt.pdf",
          priority: "high",
          status: "partial",
          notes: null,
          created_at: "",
          updated_at: "",
          category: { id: "cat-1", name: "Hosting" },
          project: { id: "proj-1", name: "Infrastructure Modernization" },
          vendor: { id: "v-1", name: "AWS" },
        },
      ],
      generatedAt: new Date().toISOString(),
    };

    const pdfBuffer = generateProjectReportPdf(mockReportData);
    assert.ok(pdfBuffer instanceof Uint8Array);
    assert.ok(pdfBuffer.length > 100);
  });

  it("generates a valid project AI report PDF buffer without throwing", () => {
    const mockAiReport: AiReportResult = {
      title: "AI Financial Report: Infrastructure Modernization",
      project_id: "proj-1",
      project_name: "Infrastructure Modernization",
      currency: "KZ",
      executive_summary: "The project is on track with 70% budget allocation and low risk.",
      spending_analysis: "Infrastructure is the primary cost center with AWS being the sole vendor.",
      key_findings: ["Allocated 35k of 50k budget", "Paid out 20k to date"],
      largest_items: ["Production Cluster (25,000 KZ)"],
      pending_items: ["Production Cluster has 10,000 KZ unpaid balance"],
      recommendations: ["Review reserved instance pricing on AWS to reduce monthly run rates"],
      risk_alerts: ["Overspending risk if cluster scaling exceeds 15,000 KZ available budget"],
      generated_at: new Date().toISOString(),
    };

    const pdfBuffer = buildAiReportPdf(mockAiReport);
    assert.ok(pdfBuffer instanceof Uint8Array);
    assert.ok(pdfBuffer.length > 100);
  });
});
