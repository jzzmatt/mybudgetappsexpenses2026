"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { ExpenseDraftFromProof } from "@/lib/expenses/types";
import type { Project } from "@/lib/projects/types";

type ImportPaymentProofModalProps = {
  project?: Project;
  onDraftLoaded: (draft: ExpenseDraftFromProof) => void;
};

export function ImportPaymentProofModal({ project, onDraftLoaded }: ImportPaymentProofModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, startAnalyzing] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!project) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }

    if (!selected.name.toLowerCase().endsWith(".pdf") && selected.type !== "application/pdf") {
      setError("Please select a PDF file.");
      setFile(null);
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleUploadAndAnalyze = () => {
    if (!file) {
      setError("Please choose a PDF payment proof first.");
      return;
    }

    setError(null);
    startAnalyzing(async () => {
      try {
        const formData = new FormData();
        formData.append("projectId", project.id);
        formData.append("file", file);

        const res = await fetch("/api/expenses/import-proof", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to analyze document.");
        }

        onDraftLoaded(data.draft as ExpenseDraftFromProof);
        setIsOpen(false);
        setFile(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error analyzing PDF.");
      }
    });
  };

  return (
    <>
      <button
        className="button button-outline button-small import-proof-trigger"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        📄 Import Payment PDF
      </button>

      {isOpen ? (
        <div className="import-proof-modal-overlay" role="dialog" aria-modal="true">
          <div className="import-proof-modal">
            <div className="import-proof-modal-header">
              <h3>Import Payment Proof (PDF)</h3>
              <button
                aria-label="Close"
                className="import-proof-modal-close"
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                  setFile(null);
                }}
                type="button"
              >
                ✕
              </button>
            </div>

            <p className="import-proof-modal-desc">
              Upload a bank transfer receipt, invoice voucher, or POS proof. AI will extract the financial details into an editable expense draft for workspace <strong>{project.name}</strong>.
            </p>

            {error ? (
              <p className="form-error page-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="import-proof-dropzone">
              <input
                accept="application/pdf"
                className="sr-only"
                id="proof-pdf-file"
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
              />
              <label className="import-proof-file-label" htmlFor="proof-pdf-file">
                <span className="import-proof-icon">📁</span>
                <span>{file ? file.name : "Click to select a payment proof PDF (Max 10MB)"}</span>
              </label>
            </div>

            <div className="import-proof-modal-actions">
              <Button
                disabled={!file || isAnalyzing}
                onClick={handleUploadAndAnalyze}
                type="button"
              >
                {isAnalyzing ? "Analyzing PDF with AI…" : "Analyze & Create Draft"}
              </Button>
              <button
                className="button button-outline"
                disabled={isAnalyzing}
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                  setFile(null);
                }}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
