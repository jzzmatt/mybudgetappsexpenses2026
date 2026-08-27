import OpenAI from "openai";
import { paymentProofExtractionSchema } from "@/lib/expenses/schema";
import type { ExpenseDraftFromProof } from "@/lib/expenses/types";
import type { Project } from "@/lib/projects/types";

function getOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

function getModel() {
  return process.env.OPENAI_MODEL ?? "gpt-4o";
}

/**
 * Extracts structured financial proof details from a PDF document (passed as base64 or text)
 * and formats it into an editable Expense Draft conforming to the active Project workspace context.
 */
export async function extractPaymentProofData(params: {
  project: Project;
  pdfBase64: string;
  storagePath: string;
  filename: string;
  signedUrl?: string | null;
}): Promise<ExpenseDraftFromProof> {
  const { project, pdfBase64, storagePath, filename, signedUrl } = params;
  const client = getOpenAiClient();
  const model = getModel();

  const systemPrompt = `
You are a precise, CFO-grade payment proof & receipt extraction engine.
Your task is to analyze an uploaded payment proof PDF document (bank transfer receipt, invoice payment, voucher, or POS receipt) and extract verifiable financial data.

Strict rules:
1. Extract the actual payment date evidenced by the document in YYYY-MM-DD format.
2. Extract the recipient, vendor, or beneficiary as "vendor_person".
3. Extract the exact paid amount evidenced in the document as "paid_amount" (number).
4. Identify the currency symbol/code on the document as "currency_detected" (e.g. Kz, AOA, USD, EUR).
5. Identify the payment method if stated: "bank_transfer", "card", "cash", "check", or "other".
6. Extract transaction / operation / reference number as "payment_reference".
7. Formulate a clear, concise "description" (e.g. "Payment to [Recipient] - [Operation/Reference]").
8. Set "suggested_expense_budget" to equal "paid_amount" as a starting suggestion.
9. Set "suggested_status" to "paid" (or "partial" if partial payment evidenced).
10. If any field cannot be verified from the document, leave it null. NEVER invent or fabricate missing data.
11. Add clear, helpful warnings in "extraction_warnings" (e.g., if currency in document differs from project currency ${project.currency}, or if details are blurry/ambiguous).

Return JSON matching this exact schema:
{
  "date": "YYYY-MM-DD" or null,
  "description": "string",
  "vendor_person": "string" or null,
  "paid_amount": number,
  "currency_detected": "string" or null,
  "payment_method": "bank_transfer" | "card" | "cash" | "check" | "other" | null,
  "payment_reference": "string" or null,
  "suggested_expense_budget": number,
  "suggested_status": "pending" | "partial" | "paid",
  "notes": "string" or null,
  "extraction_warnings": ["string"]
}
`.trim();

  // PDFs must use Responses API input_file — image_url only accepts image MIME types.
  const dataUrl = `data:application/pdf;base64,${pdfBase64}`;

  const response = await client.responses.create({
    model,
    temperature: 0.1,
    instructions: systemPrompt,
    text: {
      format: { type: "json_object" },
    },
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_file",
            filename,
            file_data: dataUrl,
            detail: "high",
          },
          {
            type: "input_text",
            text: `Please analyze this payment proof PDF for Project workspace: "${project.name}" (Project Currency: ${project.currency}, Project Budget: ${project.budget_amount}). Original filename: ${filename}. Return your extraction as a valid JSON object matching the schema in the instructions.`,
          },
        ],
      },
    ],
  });

  const rawContent = response.output_text;
  if (!rawContent) {
    throw new Error("AI extraction returned an empty response.");
  }

  const parsedJson = JSON.parse(rawContent);
  const validated = paymentProofExtractionSchema.parse(parsedJson);

  // Currency discrepancy warning check
  const warnings = [...validated.extraction_warnings];
  if (
    validated.currency_detected &&
    project.currency &&
    !validated.currency_detected.toUpperCase().includes(project.currency.toUpperCase()) &&
    !(project.currency === "KZ" && validated.currency_detected.toUpperCase().includes("AOA")) &&
    !(project.currency === "AOA" && validated.currency_detected.toUpperCase().includes("KZ"))
  ) {
    warnings.push(
      `Detected document currency (${validated.currency_detected}) differs from Project workspace currency (${project.currency}). Expense will inherit Project currency (${project.currency}).`,
    );
  }

  return {
    date: validated.date,
    description: validated.description || `Payment proof: ${filename}`,
    vendor_person: validated.vendor_person,
    paid_amount: validated.paid_amount,
    currency_detected: validated.currency_detected,
    payment_method: validated.payment_method || "bank_transfer",
    payment_reference: validated.payment_reference,
    suggested_expense_budget: validated.suggested_expense_budget || validated.paid_amount,
    suggested_status: validated.suggested_status,
    notes: validated.notes,
    extraction_warnings: warnings,
    payment_proof_path: storagePath,
    payment_proof_filename: filename,
    proof_signed_url: signedUrl ?? null,
  };
}
