"use client";

import { useEffect, useState } from "react";

const SHORTCUTS = [
  {
    section: "Initiative Tracker",
    shortcuts: [
      { keys: "→ / Space", description: "Next turn" },
      { keys: "←", description: "Previous turn" },
    ],
  },
  {
    section: "Map",
    shortcuts: [
      { keys: "Escape", description: "Cancel token placement / deselect" },
      {
        keys: "Delete / Backspace",
        description: "Remove selected token from map",
      },
      { keys: "Scroll", description: "Zoom in/out" },
      { keys: "Drag background", description: "Pan the map" },
    ],
  },
  {
    section: "Encounter Editor",
    shortcuts: [
      { keys: "Ctrl+Z", description: "Undo last action" },
      { keys: "Ctrl+Shift+Z", description: "Redo" },
    ],
  },
  {
    section: "General",
    shortcuts: [
      { keys: "?", description: "Show this help" },
      { keys: "Escape", description: "Close overlay / exit map view" },
    ],
  },
];

type Props = {
  showTrigger?: boolean;
};

export function KeyboardShortcutsHelp({ showTrigger = false }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger when typing in inputs
      const target = e.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!open) {
    return showTrigger ? (
      <button
        type="button"
        className="admin-button-secondary typography-body-sm"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "2rem",
          height: "2rem",
          padding: 0,
          borderRadius: "var(--radius-sm)",
        }}
        onClick={() => setOpen(true)}
        title="Keyboard shortcuts (?)"
        aria-label="Show keyboard shortcuts"
      >
        ?
      </button>
    ) : null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
      }}
      onClick={() => setOpen(false)}
    >
      <div
        className="surface-card"
        style={{
          padding: "1.5rem",
          borderRadius: "0.5rem",
          maxWidth: "28rem",
          width: "100%",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: "1rem" }}
        >
          <h2 className="typography-h2">Keyboard Shortcuts</h2>
          <button
            type="button"
            className="admin-button-secondary typography-body-sm px-2 py-1"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {SHORTCUTS.map((section) => (
            <div key={section.section} className="flex flex-col gap-1.5">
              <span className="typography-kicker text-muted">
                {section.section}
              </span>
              {section.shortcuts.map((s) => (
                <div
                  key={s.keys}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="typography-body-sm">{s.description}</span>
                  <kbd
                    className="typography-body-sm"
                    style={{
                      background: "var(--color-border-subtle)",
                      padding: "0.1rem 0.4rem",
                      borderRadius: "0.25rem",
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
