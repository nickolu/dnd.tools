"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useState,
} from "react";

import type { Position } from "@/lib/domain/encounter/encounter.schema";
import type { TokenKind } from "@/lib/store/useEncounterLibraryStore";

import { isInsideGrid, pixelToCell } from "../utils/cell-coords";

type SvgPoint = { px: number; py: number };

export type TokenDragState = {
  kind: TokenKind;
  id: string;
  startCell: Position;
  startPointer: SvgPoint;
  currentPointer: SvgPoint;
};

export type TokenPointerHandlers = {
  onPointerDown: (e: ReactPointerEvent<SVGGElement>) => void;
  onPointerMove: (e: ReactPointerEvent<SVGGElement>) => void;
  onPointerUp: (e: ReactPointerEvent<SVGGElement>) => void;
  onPointerCancel: (e: ReactPointerEvent<SVGGElement>) => void;
};

type Options = {
  cellSize: number;
  cols: number;
  rows: number;
  svgRef: RefObject<SVGSVGElement | null>;
  /** Drag-end commit. Pass null to revert (released outside grid). */
  onCommit: (kind: TokenKind, id: string, pos: Position | null) => void;
};

export function useTokenDrag(options: Options): {
  dragState: TokenDragState | null;
  getTokenHandlers: (
    kind: TokenKind,
    id: string,
    cell: Position
  ) => TokenPointerHandlers;
} {
  const [drag, setDrag] = useState<TokenDragState | null>(null);

  function pointerToSvg(clientX: number, clientY: number): SvgPoint | null {
    const svg = options.svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const transformed = pt.matrixTransform(ctm.inverse());
    return { px: transformed.x, py: transformed.y };
  }

  function getTokenHandlers(
    kind: TokenKind,
    id: string,
    cell: Position
  ): TokenPointerHandlers {
    return {
      onPointerDown: (e) => {
        // Left mouse only (or any pointer for touch/pen); ignore right-click.
        if (e.pointerType === "mouse" && e.button !== 0) return;
        const p = pointerToSvg(e.clientX, e.clientY);
        if (!p) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag({
          kind,
          id,
          startCell: cell,
          startPointer: p,
          currentPointer: p,
        });
      },
      onPointerMove: (e) => {
        if (!drag || drag.id !== id || drag.kind !== kind) return;
        const p = pointerToSvg(e.clientX, e.clientY);
        if (!p) return;
        setDrag({ ...drag, currentPointer: p });
      },
      onPointerUp: (e) => {
        if (!drag || drag.id !== id || drag.kind !== kind) return;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // releasePointerCapture can throw if capture was lost; ignore.
        }
        const p = pointerToSvg(e.clientX, e.clientY);
        if (!p) {
          setDrag(null);
          return;
        }
        if (
          !isInsideGrid(
            p.px,
            p.py,
            options.cellSize,
            options.cols,
            options.rows
          )
        ) {
          // Released outside the grid — revert (caller passes null).
          options.onCommit(kind, id, null);
          setDrag(null);
          return;
        }
        const nextCell = pixelToCell(
          p.px,
          p.py,
          options.cellSize,
          options.cols,
          options.rows
        );
        options.onCommit(kind, id, nextCell);
        setDrag(null);
      },
      onPointerCancel: () => {
        if (!drag || drag.id !== id || drag.kind !== kind) return;
        setDrag(null);
      },
    };
  }

  return { dragState: drag, getTokenHandlers };
}
