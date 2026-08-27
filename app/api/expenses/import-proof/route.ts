import { safeAuth } from "@/lib/clerk/server";
import { NextResponse } from "next/server";
import { extractPaymentProofData } from "@/lib/ai/payment-proof";
import { getProjectById } from "@/lib/projects/queries";
import {
  getPaymentProofSignedUrl,
  uploadPaymentProofToStorage,
  validatePaymentProofFile,
} from "@/lib/storage/payment-proofs";

export async function POST(request: Request) {
  const authState = await safeAuth();
  const userId = authState?.userId;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const projectId = formData.get("projectId");
    const file = formData.get("file");

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "A valid projectId is required." }, { status: 400 });
    }

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "A PDF payment proof file is required." }, { status: 400 });
    }

    const filename = file instanceof File ? file.name : "payment-proof.pdf";
    const validation = validatePaymentProofFile(file, filename);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project workspace not found." }, { status: 404 });
    }

    // Convert file to buffer and base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfBase64 = buffer.toString("base64");

    // 1. Upload to private Supabase Storage
    const { path: storagePath } = await uploadPaymentProofToStorage(projectId, arrayBuffer, filename);

    // 2. Generate short-lived signed URL for preview/review
    const signedUrl = await getPaymentProofSignedUrl(storagePath, 3600);

    // 3. Extract structured draft with OpenAI
    const draft = await extractPaymentProofData({
      project,
      pdfBase64,
      storagePath,
      filename,
      signedUrl,
    });

    return NextResponse.json({
      success: true,
      draft,
    });
  } catch (err) {
    console.error("AI Payment Proof extraction route error:", err);
    const message = err instanceof Error ? err.message : "Failed to analyze payment proof PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
