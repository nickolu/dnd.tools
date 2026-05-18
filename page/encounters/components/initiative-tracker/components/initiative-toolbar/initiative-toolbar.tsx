"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onRollAll: () => void;
  onRollEnemies: () => void;
  onRollAllies: () => void;
  onReset: () => void;
  onEnd: () => void;
};

export function InitiativeToolbar({
  onRollAll,
  onRollEnemies,
  onRollAllies,
  onReset,
  onEnd,
}: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const confirmResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  function clearConfirmResetTimer() {
    if (confirmResetTimerRef.current !== null) {
      clearTimeout(confirmResetTimerRef.current);
      confirmResetTimerRef.current = null;
    }
  }

  useEffect(() => {
    return () => clearConfirmResetTimer();
  }, []);

  function handleResetEncounter() {
    if (confirmReset) {
      clearConfirmResetTimer();
      setConfirmReset(false);
      onEnd();
    } else {
      setConfirmReset(true);
      confirmResetTimerRef.current = setTimeout(() => {
        setConfirmReset(false);
      }, 3000);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        className="admin-button typography-body-sm px-2 py-1"
        onClick={onRollAll}
      >
        Roll all
      </button>
      <button
        type="button"
        className="admin-button-secondary typography-body-sm px-2 py-1"
        onClick={onRollEnemies}
      >
        Roll enemies
      </button>
      <button
        type="button"
        className="admin-button-secondary typography-body-sm px-2 py-1"
        onClick={onRollAllies}
      >
        Roll allies
      </button>
      <button
        type="button"
        className="admin-button-secondary typography-body-sm px-2 py-1"
        onClick={onReset}
      >
        Reset initiative
      </button>
      <button
        type="button"
        className="admin-button-danger typography-body-sm px-2 py-1"
        onClick={handleResetEncounter}
      >
        {confirmReset ? "Confirm reset?" : "Reset encounter"}
      </button>
    </div>
  );
}
