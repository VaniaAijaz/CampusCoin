import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, maxWidth = 480, footer }) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--color-border)",
        }}>
          <h2 id="modal-title" style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--color-dark)" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="cc-btn-ghost"
            style={{ width: 32, height: 32, padding: 0, borderRadius: 7 }}
            aria-label="Close modal"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: "0 24px 20px",
            display: "flex", justifyContent: "flex-end", gap: 8,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
