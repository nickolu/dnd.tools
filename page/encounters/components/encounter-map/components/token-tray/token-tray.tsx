"use client";

import type { TokenViewModel } from "../../types";

type Props = {
  tokens: TokenViewModel[];
  pendingTokenId: string | null;
  onSelectPending: (token: TokenViewModel | null) => void;
};

const SIDE_LABEL: Record<TokenViewModel["side"], string> = {
  pc: "PC",
  ally: "Ally",
  enemy: "Enemy",
};

export function TokenTray({ tokens, pendingTokenId, onSelectPending }: Props) {
  if (tokens.length === 0) {
    return (
      <p className="typography-body-sm text-muted">
        All combatants are placed on the map.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="typography-kicker text-muted">Unplaced tokens</span>
      <div className="flex flex-wrap gap-1.5">
        {tokens.map((token) => {
          const isPending = pendingTokenId === token.id;
          return (
            <button
              key={`${token.kind}:${token.id}`}
              type="button"
              className="filter-chip"
              data-active={isPending}
              aria-pressed={isPending}
              onClick={() => onSelectPending(isPending ? null : token)}
            >
              {token.name}{" "}
              <span className="text-muted">({SIDE_LABEL[token.side]})</span>
            </button>
          );
        })}
      </div>
      {pendingTokenId ? (
        <p className="typography-body-sm text-muted">
          Click a cell to place the selected token. Press Esc to cancel.
        </p>
      ) : null}
    </div>
  );
}
