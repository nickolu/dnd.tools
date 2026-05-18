"use client";

import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  Combatant,
  PartyMember,
  Position,
} from "@/lib/domain/encounter/encounter.schema";
import { selectEncounterById } from "@/lib/store/encounterSelectors";
import {
  type TokenKind,
  useEncounterLibraryStore,
} from "@/lib/store/useEncounterLibraryStore";

import { MapGrid } from "./components/map-grid";
import { MapToolbar } from "./components/map-toolbar";
import { Token } from "./components/token";
import { TokenTray } from "./components/token-tray";
import { MAP_DEFAULTS } from "./constants";
import { useMapViewport } from "./hooks/useMapViewport";
import { useTokenDrag } from "./hooks/useTokenDrag";
import { useMapPlacementStore } from "./stores/useMapPlacementStore";
import type { TokenRef, TokenViewModel } from "./types";
import { pixelToCell } from "./utils/cell-coords";

type Props = {
  encounterId: string;
};

function isSameRef(a: TokenRef | null, b: TokenRef | null): boolean {
  if (!a || !b) return a === b;
  return a.kind === b.kind && a.id === b.id;
}

function buildTokenViewModels(
  partyMembers: PartyMember[],
  combatants: Combatant[]
): {
  placed: Array<TokenViewModel & { position: Position }>;
  tray: TokenViewModel[];
} {
  const placed: Array<TokenViewModel & { position: Position }> = [];
  const tray: TokenViewModel[] = [];

  for (const p of partyMembers) {
    const vm: TokenViewModel = {
      kind: "pc",
      id: p.id,
      name: p.name,
      side: "pc",
      currentHp: null,
      maxHp: null,
    };
    if (p.position) {
      placed.push({ ...vm, position: p.position });
    } else {
      tray.push(vm);
    }
  }
  for (const c of combatants) {
    const vm: TokenViewModel = {
      kind: "combatant",
      id: c.id,
      name: c.nameOverride ?? c.monsterName,
      side: c.side,
      currentHp: c.currentHp,
      maxHp: c.maxHp,
    };
    if (c.position) {
      placed.push({ ...vm, position: c.position });
    } else {
      tray.push(vm);
    }
  }
  return { placed, tray };
}

export function EncounterMap({ encounterId }: Props) {
  const encounter = useEncounterLibraryStore(selectEncounterById(encounterId));
  const setMap = useEncounterLibraryStore((s) => s.setMap);
  const clearMap = useEncounterLibraryStore((s) => s.clearMap);
  const placeToken = useEncounterLibraryStore((s) => s.placeToken);
  const moveToken = useEncounterLibraryStore((s) => s.moveToken);
  const removeToken = useEncounterLibraryStore((s) => s.removeToken);

  const pendingPlace = useMapPlacementStore((s) => s.pendingPlace);
  const setPendingPlace = useMapPlacementStore((s) => s.setPendingPlace);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<TokenRef | null>(null);
  // Track whether the last pointer-down started a meaningful pan (to suppress click)
  const wasPanningRef = useRef(false);

  const map = encounter?.map ?? MAP_DEFAULTS;

  const totalWidth = map.cols * map.cellSize;
  const totalHeight = map.rows * map.cellSize;

  const {
    zoom,
    isPanning,
    viewBox,
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    zoomIn,
    zoomOut,
    resetView,
  } = useMapViewport({
    totalWidth,
    totalHeight,
    svgRef,
    containerRef,
    disabled: !!pendingPlace,
  });

  // Attach wheel handler with non-passive option so we can preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent) => handleWheel(e);
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [handleWheel]);

  const handleCommit = useCallback(
    (kind: TokenKind, id: string, pos: Position | null) => {
      if (pos === null) return; // revert (released outside grid)
      moveToken(encounterId, kind, id, pos);
    },
    [encounterId, moveToken]
  );

  const { dragState, getTokenHandlers } = useTokenDrag({
    cellSize: map.cellSize,
    cols: map.cols,
    rows: map.rows,
    svgRef,
    onCommit: handleCommit,
  });

  const { placed, tray } = useMemo(
    () =>
      buildTokenViewModels(
        encounter?.partyMembers ?? [],
        encounter?.combatants ?? []
      ),
    [encounter?.partyMembers, encounter?.combatants]
  );

  if (!encounter) return null;

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    // Suppress click if it ended a pan drag
    if (wasPanningRef.current) {
      wasPanningRef.current = false;
      return;
    }
    if (!pendingPlace) {
      // Clicking empty space deselects.
      setSelected(null);
      return;
    }
    const svg = svgRef.current;
    if (!svg) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const transformed = pt.matrixTransform(ctm.inverse());
    const cell = pixelToCell(
      transformed.x,
      transformed.y,
      map.cellSize,
      map.cols,
      map.rows
    );
    placeToken(encounterId, pendingPlace.kind, pendingPlace.id, cell);
    setSelected(pendingPlace);
    setPendingPlace(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      setPendingPlace(null);
      setSelected(null);
      return;
    }
    if (selected && (e.key === "Delete" || e.key === "Backspace")) {
      e.preventDefault();
      removeToken(encounterId, selected.kind, selected.id);
      setSelected(null);
    }
  }

  return (
    <section className="surface-card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="typography-h2">Map</h2>
        {encounter.map ? (
          <button
            type="button"
            className="admin-button-secondary typography-body-sm px-2 py-1"
            onClick={() => clearMap(encounterId)}
          >
            Reset map
          </button>
        ) : (
          <button
            type="button"
            className="admin-button typography-body-sm px-2 py-1"
            onClick={() => setMap(encounterId, {})}
          >
            Enable map
          </button>
        )}
      </div>

      {encounter.map ? (
        <>
          <MapToolbar
            map={encounter.map}
            onChange={(partial) => setMap(encounterId, partial)}
            onClearPositions={() => clearMap(encounterId)}
            zoom={zoom}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onResetView={resetView}
          />
          <TokenTray
            tokens={tray}
            pendingTokenId={pendingPlace?.id ?? null}
            onSelectPending={(token) =>
              setPendingPlace(token ? { kind: token.kind, id: token.id } : null)
            }
          />
          <div
            ref={containerRef}
            className="min-h-[300px] overflow-hidden rounded-md"
            style={{
              border: "1px solid var(--color-border-subtle)",
              height: "600px",
            }}
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            <svg
              ref={svgRef}
              viewBox={viewBox}
              width="100%"
              height="100%"
              role="application"
              aria-label="Encounter battle map"
              onClick={handleSvgClick}
              onPointerDown={(e) => {
                // Only pan when not placing tokens and the target is the SVG/grid background
                if (pendingPlace) return;
                if (!(e.target instanceof Element)) return;
                const target = e.target;
                const isBackground =
                  target === svgRef.current ||
                  target.tagName === "rect" ||
                  target.tagName === "line";
                if (!isBackground) return;
                wasPanningRef.current = false;
                handlePanStart(e);
              }}
              onPointerMove={(e) => {
                if (isPanning) {
                  wasPanningRef.current = true;
                  handlePanMove(e);
                }
              }}
              onPointerUp={(e) => {
                handlePanEnd(e);
              }}
              style={{
                display: "block",
                cursor: pendingPlace
                  ? "crosshair"
                  : isPanning
                    ? "grabbing"
                    : "grab",
              }}
            >
              <MapGrid
                cols={map.cols}
                rows={map.rows}
                cellSize={map.cellSize}
              />
              {placed.map((tok) => {
                const isDragging =
                  dragState !== null &&
                  dragState.kind === tok.kind &&
                  dragState.id === tok.id;
                const offsetCell: Position = isDragging
                  ? offsetCellFromDrag(
                      tok.position,
                      dragState.currentPointer.px - dragState.startPointer.px,
                      dragState.currentPointer.py - dragState.startPointer.py,
                      map.cellSize
                    )
                  : tok.position;
                const handlers = getTokenHandlers(
                  tok.kind,
                  tok.id,
                  tok.position
                );
                return (
                  <g
                    key={`${tok.kind}:${tok.id}`}
                    {...handlers}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected({ kind: tok.kind, id: tok.id });
                    }}
                  >
                    <Token
                      token={tok}
                      cell={offsetCell}
                      cellSize={map.cellSize}
                      isSelected={isSameRef(selected, {
                        kind: tok.kind,
                        id: tok.id,
                      })}
                      isDragging={isDragging}
                      onPointerDown={handlers.onPointerDown}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="typography-body-sm text-muted">
            Drag tokens to move. Click a tray chip then a cell to place. Select
            a token and press Delete to remove from the map. Scroll to zoom,
            drag the background to pan.
          </p>
        </>
      ) : (
        <p className="typography-body-sm text-muted">
          Click &quot;Enable map&quot; to start placing tokens for this
          encounter.
        </p>
      )}
    </section>
  );
}

function offsetCellFromDrag(
  startCell: Position,
  dxPixels: number,
  dyPixels: number,
  cellSize: number
): Position {
  return {
    x: startCell.x + dxPixels / cellSize,
    y: startCell.y + dyPixels / cellSize,
  };
}
