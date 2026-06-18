"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useState,
} from "react";

import type { Position } from "@/lib/domain/encounter/encounter.schema";

import { isInsideGrid, pixelToCell } from "../utils/cell-coords";

type SvgPoint = { px: number; py: number };

export type ShapeDragState = {
  shapeId: string;
  startCell: Position;
  startPointer: SvgPoint;
  currentPointer: SvgPoint;
};

export type ShapePointerHandlers = {
  onPointerDown: (e: ReactPointerEvent<SVGElement>) => void;
  onPointerMove: (e: ReactPointerEvent<SVGElement>) => void;
  onPointerUp: (e: ReactPointerEvent<SVGElement>) => void;
  onPointerCancel: (e: ReactPointerEvent<SVGElement>) => void;
};

type Options = {
  cellSize: number;
  cols: number;
  rows: number;
  svgRef: RefObject<SVGSVGElement | null>;
  onCommit: (shapeId: string, pos: Position | null) => void;
};

export function useShapeDrag(options: Options): {
  shapeDragState: ShapeDragState | null;
  getShapeHandlers: (shapeId: string, cell: Position) => ShapePointerHandlers;
} {
  const [drag, setDrag] = useState<ShapeDragState | null>(null);

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

  function getShapeHandlers(
    shapeId: string,
    cell: Position
  ): ShapePointerHandlers {
    return {
      onPointerDown: (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        const p = pointerToSvg(e.clientX, e.clientY);
        if (!p) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag({
          shapeId,
          startCell: cell,
          startPointer: p,
          currentPointer: p,
        });
      },
      onPointerMove: (e) => {
        if (!drag || drag.shapeId !== shapeId) return;
        const p = pointerToSvg(e.clientX, e.clientY);
        if (!p) return;
        setDrag({ ...drag, currentPointer: p });
      },
      onPointerUp: (e) => {
        if (!drag || drag.shapeId !== shapeId) return;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
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
          options.onCommit(shapeId, null);
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
        options.onCommit(shapeId, nextCell);
        setDrag(null);
      },
      onPointerCancel: () => {
        if (!drag || drag.shapeId !== shapeId) return;
        setDrag(null);
      },
    };
  }

  return { shapeDragState: drag, getShapeHandlers };
}
