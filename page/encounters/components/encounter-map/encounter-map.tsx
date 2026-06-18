"use client";

import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  Combatant,
  MapShape,
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
import { useShapeDrag } from "./hooks/useShapeDrag";
import { useTokenDrag } from "./hooks/useTokenDrag";
import { useMapPlacementStore } from "./stores/useMapPlacementStore";
import type { TokenRef, TokenViewModel } from "./types";
import { cellToPixel, pixelToCell } from "./utils/cell-coords";

const SHAPE_COLORS = ["#d4a041", "#4a90d9", "#d94a4a", "#4ad94a", "#9b59b6"];
const DRAWING_COLORS = ["#e8e2d9", "#d4a041", "#4a90d9", "#d94a4a", "#4ad94a"];
const MIN_DRAWING_DISTANCE = 3;

function pointsToPathData(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  const first = points[0];
  const rest = points.slice(1);
  if (!first) return "";
  return `M ${first.x} ${first.y} ${rest.map((p) => `L ${p.x} ${p.y}`).join(" ")}`;
}

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
  const addMapShape = useEncounterLibraryStore((s) => s.addMapShape);
  const removeMapShape = useEncounterLibraryStore((s) => s.removeMapShape);
  const moveMapShape = useEncounterLibraryStore((s) => s.moveMapShape);
  const resizeMapShape = useEncounterLibraryStore((s) => s.resizeMapShape);
  const addMapDrawing = useEncounterLibraryStore((s) => s.addMapDrawing);
  const clearMapDrawings = useEncounterLibraryStore((s) => s.clearMapDrawings);

  const pendingPlace = useMapPlacementStore((s) => s.pendingPlace);
  const setPendingPlace = useMapPlacementStore((s) => s.setPendingPlace);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<TokenRef | null>(null);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [pendingShapeKind, setPendingShapeKind] = useState<
    MapShape["kind"] | null
  >(null);
  // Drawing mode state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>(
    []
  );
  const [drawingColorIndex, setDrawingColorIndex] = useState(0);
  const isDrawingActiveRef = useRef(false);

  // Resize drag state for shapes
  const [resizeDrag, setResizeDrag] = useState<{
    shapeId: string;
    startSize: number;
    startPointerX: number;
    startPointerY: number;
    currentPointerX: number;
    currentPointerY: number;
  } | null>(null);

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
    disabled: !!pendingPlace || !!pendingShapeKind || isDrawingMode,
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

  const handleShapeCommit = useCallback(
    (shapeId: string, pos: Position | null) => {
      if (pos === null) return; // revert
      moveMapShape(encounterId, shapeId, pos);
    },
    [encounterId, moveMapShape]
  );

  const { shapeDragState, getShapeHandlers } = useShapeDrag({
    cellSize: map.cellSize,
    cols: map.cols,
    rows: map.rows,
    svgRef,
    onCommit: handleShapeCommit,
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

  const shapes = encounter.map?.shapes ?? [];
  const shapeColorIndex = shapes.length % SHAPE_COLORS.length;
  const drawings = encounter.map?.drawings ?? [];
  const hasDrawings = drawings.length > 0;

  function getSvgPoint(
    e: React.PointerEvent<SVGElement>
  ): { x: number; y: number } | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const transformed = pt.matrixTransform(ctm.inverse());
    return { x: transformed.x, y: transformed.y };
  }

  function getSvgCell(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const transformed = pt.matrixTransform(ctm.inverse());
    return pixelToCell(
      transformed.x,
      transformed.y,
      map.cellSize,
      map.cols,
      map.rows
    );
  }

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    // Suppress click in drawing mode — pointer events handle drawing
    if (isDrawingMode) return;
    // Suppress click if it ended a pan drag
    if (wasPanningRef.current) {
      wasPanningRef.current = false;
      return;
    }

    if (pendingShapeKind) {
      const cell = getSvgCell(e);
      if (!cell) return;
      addMapShape(encounterId, {
        kind: pendingShapeKind,
        position: cell,
        size: 1,
        color: SHAPE_COLORS[shapeColorIndex] ?? "#d4a041",
      });
      setPendingShapeKind(null);
      return;
    }

    if (!pendingPlace) {
      // Clicking empty space deselects.
      setSelected(null);
      setSelectedShapeId(null);
      return;
    }
    const cell = getSvgCell(e);
    if (!cell) return;
    placeToken(encounterId, pendingPlace.kind, pendingPlace.id, cell);
    setSelected(pendingPlace);
    setPendingPlace(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      setPendingPlace(null);
      setPendingShapeKind(null);
      setSelected(null);
      setSelectedShapeId(null);
      if (isDrawingMode) {
        isDrawingActiveRef.current = false;
        setCurrentPath([]);
        setIsDrawingMode(false);
      }
      return;
    }
    if (selectedShapeId && (e.key === "Delete" || e.key === "Backspace")) {
      e.preventDefault();
      removeMapShape(encounterId, selectedShapeId);
      setSelectedShapeId(null);
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
            className="admin-button-danger typography-body-sm px-2 py-1"
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
            pendingShapeKind={pendingShapeKind}
            onPendingShapeKind={setPendingShapeKind}
            isDrawing={isDrawingMode}
            onDrawingToggle={() => {
              setIsDrawingMode((prev) => !prev);
              setCurrentPath([]);
              isDrawingActiveRef.current = false;
            }}
            hasDrawings={hasDrawings}
            onClearDrawings={() => clearMapDrawings(encounterId)}
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
                if (isDrawingMode) {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  isDrawingActiveRef.current = true;
                  const pt = getSvgPoint(e);
                  if (pt) {
                    setCurrentPath([pt]);
                  }
                  return;
                }
                // Only pan when not placing tokens/shapes and the target is the SVG/grid background
                if (pendingPlace || pendingShapeKind) return;
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
                if (isDrawingMode && isDrawingActiveRef.current) {
                  const pt = getSvgPoint(e);
                  if (!pt) return;
                  setCurrentPath((prev) => {
                    if (prev.length === 0) return [pt];
                    const last = prev[prev.length - 1];
                    if (!last) return prev;
                    const dx = pt.x - last.x;
                    const dy = pt.y - last.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < MIN_DRAWING_DISTANCE) return prev;
                    return [...prev, pt];
                  });
                  return;
                }
                if (isPanning) {
                  wasPanningRef.current = true;
                  handlePanMove(e);
                }
              }}
              onPointerUp={(e) => {
                if (isDrawingMode && isDrawingActiveRef.current) {
                  isDrawingActiveRef.current = false;
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  setCurrentPath((prev) => {
                    if (prev.length < 2) {
                      return [];
                    }
                    const pathData = pointsToPathData(prev);
                    if (pathData) {
                      setDrawingColorIndex((ci) => {
                        const colorIndex = ci % DRAWING_COLORS.length;
                        addMapDrawing(encounterId, {
                          path: pathData,
                          color: DRAWING_COLORS[colorIndex] ?? "#e8e2d9",
                          strokeWidth: 2,
                        });
                        return ci + 1;
                      });
                    }
                    return [];
                  });
                  return;
                }
                handlePanEnd(e);
              }}
              style={{
                display: "block",
                cursor: isDrawingMode
                  ? "crosshair"
                  : pendingPlace || pendingShapeKind
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
              {/* Drawings layer — rendered behind shapes and tokens */}
              {drawings.map((drawing) => (
                <path
                  key={drawing.id}
                  d={drawing.path}
                  fill="none"
                  stroke={drawing.color}
                  strokeWidth={drawing.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.8}
                  pointerEvents="none"
                />
              ))}
              {/* Current drawing in progress */}
              {currentPath.length > 1 && (
                <path
                  d={pointsToPathData(currentPath)}
                  fill="none"
                  stroke={
                    DRAWING_COLORS[drawingColorIndex % DRAWING_COLORS.length] ??
                    "#e8e2d9"
                  }
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.6}
                  pointerEvents="none"
                />
              )}
              {shapes.map((shape) => {
                const isSelected = selectedShapeId === shape.id;
                const isDraggingShape =
                  shapeDragState !== null &&
                  shapeDragState.shapeId === shape.id;
                const isResizing =
                  resizeDrag !== null && resizeDrag.shapeId === shape.id;
                const previewSize = isResizing
                  ? Math.max(
                      1,
                      Math.min(
                        10,
                        Math.round(
                          resizeDrag.startSize +
                            Math.max(
                              resizeDrag.currentPointerX -
                                resizeDrag.startPointerX,
                              resizeDrag.currentPointerY -
                                resizeDrag.startPointerY
                            ) /
                              map.cellSize
                        )
                      )
                    )
                  : shape.size;
                const displayPos = isDraggingShape
                  ? {
                      x:
                        shape.position.x +
                        (shapeDragState.currentPointer.px -
                          shapeDragState.startPointer.px) /
                          map.cellSize,
                      y:
                        shape.position.y +
                        (shapeDragState.currentPointer.py -
                          shapeDragState.startPointer.py) /
                          map.cellSize,
                    }
                  : shape.position;
                const px = displayPos.x * map.cellSize;
                const py = displayPos.y * map.cellSize;
                const sizePx = previewSize * map.cellSize;
                const { cx, cy } = cellToPixel(displayPos, map.cellSize);
                const strokeDash = isSelected ? "6,3" : undefined;
                const shapeHandlers = getShapeHandlers(
                  shape.id,
                  shape.position
                );
                const commonProps = {
                  fill: shape.color,
                  fillOpacity: 0.3,
                  stroke: shape.color,
                  strokeWidth: 2,
                  strokeDasharray: strokeDash,
                  style: {
                    pointerEvents: "all" as const,
                    cursor: isDraggingShape ? "grabbing" : "grab",
                  },
                  onClick: (e: React.MouseEvent) => {
                    if (isDraggingShape) return;
                    e.stopPropagation();
                    setSelectedShapeId(shape.id);
                    setSelected(null);
                  },
                };
                const resizeHandle = isSelected ? (
                  <rect
                    x={px + sizePx - 8}
                    y={py + sizePx - 8}
                    width={12}
                    height={12}
                    fill="white"
                    stroke={shape.color}
                    strokeWidth={2}
                    style={{ cursor: "nwse-resize", pointerEvents: "all" }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      const pt = getSvgPoint(e);
                      if (!pt) return;
                      setResizeDrag({
                        shapeId: shape.id,
                        startSize: shape.size,
                        startPointerX: pt.x,
                        startPointerY: pt.y,
                        currentPointerX: pt.x,
                        currentPointerY: pt.y,
                      });
                    }}
                    onPointerMove={(e) => {
                      if (!resizeDrag || resizeDrag.shapeId !== shape.id)
                        return;
                      const pt = getSvgPoint(e);
                      if (!pt) return;
                      setResizeDrag((prev) =>
                        prev
                          ? {
                              ...prev,
                              currentPointerX: pt.x,
                              currentPointerY: pt.y,
                            }
                          : prev
                      );
                    }}
                    onPointerUp={(e) => {
                      if (!resizeDrag || resizeDrag.shapeId !== shape.id)
                        return;
                      e.currentTarget.releasePointerCapture(e.pointerId);
                      resizeMapShape(encounterId, shape.id, previewSize);
                      setResizeDrag(null);
                    }}
                  />
                ) : null;
                if (shape.kind === "square") {
                  return (
                    <g key={shape.id} {...shapeHandlers}>
                      <rect
                        x={px}
                        y={py}
                        width={sizePx}
                        height={sizePx}
                        {...commonProps}
                      />
                      {resizeHandle}
                    </g>
                  );
                }
                if (shape.kind === "circle") {
                  return (
                    <g key={shape.id} {...shapeHandlers}>
                      <circle cx={cx} cy={cy} r={sizePx / 2} {...commonProps} />
                      {resizeHandle}
                    </g>
                  );
                }
                // triangle
                const points = [
                  `${cx},${py}`,
                  `${px},${py + sizePx}`,
                  `${px + sizePx},${py + sizePx}`,
                ].join(" ");
                return (
                  <g key={shape.id} {...shapeHandlers}>
                    <polygon points={points} {...commonProps} />
                    {resizeHandle}
                  </g>
                );
              })}
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
          {selectedShapeId &&
            (() => {
              const shape = shapes.find((s) => s.id === selectedShapeId);
              if (!shape) return null;
              return (
                <div className="flex items-center gap-2 mt-2">
                  <span className="typography-body-sm text-muted">
                    {shape.kind.charAt(0).toUpperCase() + shape.kind.slice(1)} ·{" "}
                    {shape.size}×{shape.size}
                  </span>
                  <button
                    type="button"
                    className="admin-button-secondary typography-body-sm px-2 py-0.5"
                    disabled={shape.size <= 1}
                    onClick={() =>
                      resizeMapShape(encounterId, shape.id, shape.size - 1)
                    }
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className="admin-button-secondary typography-body-sm px-2 py-0.5"
                    disabled={shape.size >= 10}
                    onClick={() =>
                      resizeMapShape(encounterId, shape.id, shape.size + 1)
                    }
                  >
                    +
                  </button>
                </div>
              );
            })()}
          <p className="typography-body-sm text-muted">
            Drag tokens to move. Click a tray chip then a cell to place. Select
            a token or shape and press Delete to remove. Click a shape button
            then a cell to place a shape. Scroll to zoom, drag the background to
            pan. Toggle Draw mode to sketch freehand annotations; press Escape
            to exit drawing mode. Select a shape and use +/− or drag the handle
            to resize.
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
