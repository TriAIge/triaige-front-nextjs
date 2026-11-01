"use client";

import { Loader2, X } from "lucide-react";

type ConfirmDialogProps = {
  title: string;
  description: string;
  /** When omitted, the dialog is alert-only (single dismiss button). */
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const alertOnly = !onConfirm;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 id="confirm-dialog-title" className="font-display text-xl">
            {title}
          </h2>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        <div className="flex items-center justify-end gap-2 mt-6">
          {alertOnly ? (
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg bg-brand text-brand-foreground font-semibold text-sm hover:opacity-95 transition"
            >
              Entendi
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="h-10 px-4 rounded-lg border border-border text-sm hover:bg-secondary transition disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onConfirm}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-rose-500/40 bg-rose-500/15 text-rose-300 text-sm font-semibold hover:bg-rose-500/25 transition disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {confirmLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
