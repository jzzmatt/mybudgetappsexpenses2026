"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/client";
import type { ExpenseDraftFromProof } from "@/lib/expenses/types";
import type { Project } from "@/lib/projects/types";

type ImportPaymentProofModalProps = {
  project?: Project;
  onDraftLoaded: (draft: ExpenseDraftFromProof) => void;
};

export function ImportPaymentProofModal({ project, onDraftLoaded }: ImportPaymentProofModalProps) {
  const { t } = useTranslations();
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
      setError(t("validation.pdfOnly"));
      setFile(null);
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError(t("validation.fileTooLarge"));
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleUploadAndAnalyze = () => {
    if (!file) {
      setError(t("validation.pdfRequired"));
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
          throw new Error(data.error || t("expenses.analyzeError"));
        }

        onDraftLoaded(data.draft as ExpenseDraftFromProof);
        setIsOpen(false);
        setFile(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("expenses.analyzeError"));
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
        {t("expenses.importPdf")}
      </button>

      {isOpen ? (
        <div className="import-proof-modal-overlay" role="dialog" aria-modal="true">
          <div className="import-proof-modal">
            <div className="import-proof-modal-header">
              <h3>{t("expenses.importPdfTitle")}</h3>
              <button
                aria-label={t("common.close")}
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
              {t("expenses.importPdfDescription", { project: project.name })}
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
                <span>{file ? file.name : t("expenses.selectPdf")}</span>
              </label>
            </div>

            <div className="import-proof-modal-actions">
              <Button
                disabled={!file || isAnalyzing}
                onClick={handleUploadAndAnalyze}
                type="button"
              >
                {isAnalyzing ? t("expenses.analyzingPdf") : t("expenses.analyzePdf")}
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
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
