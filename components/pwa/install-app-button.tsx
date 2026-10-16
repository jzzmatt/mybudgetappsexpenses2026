"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createBrowserInstallEnvironment } from "@/lib/pwa/browser-environment";
import { createInstallController, type InstallSnapshot } from "@/lib/pwa/install-controller";
import { useTranslations } from "@/lib/i18n/client";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function InstallIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
      <path d="M9 2.75v8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      <path d="M5.75 8.25 9 11.5l3.25-3.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M3.75 14.75h10.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

export function InstallAppButton() {
  const { t } = useTranslations();
  const [snapshot, setSnapshot] = useState<InstallSnapshot | null>(null);
  const controllerRef = useRef<ReturnType<typeof createInstallController> | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const dialogId = useId();

  useEffect(() => {
    const controller = createInstallController(createBrowserInstallEnvironment());
    controllerRef.current = controller;
    const unsubscribe = controller.subscribe(setSnapshot);
    controller.start();

    return () => {
      unsubscribe();
      controller.stop();
      controllerRef.current = null;
    };
  }, []);

  const dialogOpen = snapshot?.dialog === "manual" || snapshot?.dialog === "dismissed";

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusable = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => !element.hasAttribute("disabled"));

    const initial = focusable()[0] ?? dialog;
    initial.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        controllerRef.current?.closeDialog();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const nodes = focusable();
      if (nodes.length === 0) {
        event.preventDefault();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [dialogOpen]);

  if (!snapshot) {
    return null;
  }

  if (!snapshot.showButton) {
    return snapshot.installed ? (
      <p className="sr-only" role="status">
        {t("pwa.installed")}
      </p>
    ) : null;
  }

  const dialog =
    dialogOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="install-app-backdrop"
            onClick={() => controllerRef.current?.closeDialog()}
          >
            <div
              aria-describedby={descriptionId}
              aria-labelledby={titleId}
              aria-modal="true"
              className="install-app-dialog"
              id={dialogId}
              onClick={(event) => event.stopPropagation()}
              ref={dialogRef}
              role="dialog"
              tabIndex={-1}
            >
              <div className="install-app-dialog-header">
                <h2 id={titleId}>{t("pwa.dialogTitle")}</h2>
                <button
                  className="button button-outline install-app-dialog-close"
                  onClick={() => controllerRef.current?.closeDialog()}
                  type="button"
                >
                  {t("common.close")}
                </button>
              </div>
              <p id={descriptionId}>{t("pwa.dialogDescription")}</p>
              {snapshot.lastChoice === "dismissed" ? (
                <p className="install-app-dismissed" role="status">
                  {t("pwa.dismissedNote")}
                </p>
              ) : null}
              <ol aria-label={t("pwa.stepsLabel")} className="install-app-steps">
                {snapshot.guidance.stepKeys.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ol>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        aria-controls={dialogOpen ? dialogId : undefined}
        aria-expanded={dialogOpen}
        aria-haspopup="dialog"
        aria-label={t("pwa.installAria")}
        className="button button-outline install-app-button"
        disabled={snapshot.busy}
        onClick={() => {
          void controllerRef.current?.requestInstall();
        }}
        type="button"
      >
        <InstallIcon />
        <span>{t("pwa.install")}</span>
      </button>
      {dialog}
    </>
  );
}
