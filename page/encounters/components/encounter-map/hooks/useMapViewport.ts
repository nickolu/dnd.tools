"use client";

import { type RefObject, useCallback, useRef, useState } from "react";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const WHEEL_ZOOM_STEP = 0.06;
const BUTTON_ZOOM_STEP = 0.15;

type UseMapViewportOptions = {
  totalWidth: number;
  totalHeight: number;
  svgRef: RefObject<SVGSVGElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  disabled?: boolean;
};

type PanState = {
  startX: number;
  startY: number;
  startOffsetX: number;
  startOffsetY: number;
};

function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function useMapViewport({
  totalWidth,
  totalHeight,
  svgRef,
}: UseMapViewportOptions) {
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStateRef = useRef<PanState | null>(null);

  // Compute viewBox: pan values are clamped so the view stays within the grid (with margin).
  const viewW = totalWidth / zoom;
  const viewH = totalHeight / zoom;
  const margin = 50;
  const minPanX = -margin;
  const minPanY = -margin;
  const maxPanX = totalWidth - viewW + margin;
  const maxPanY = totalHeight - viewH + margin;

  const clampedX = Math.min(maxPanX, Math.max(minPanX, panOffset.x));
  const clampedY = Math.min(maxPanY, Math.max(minPanY, panOffset.y));

  const viewBox = `${clampedX} ${clampedY} ${viewW} ${viewH}`;

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;

      // Convert pointer position to SVG coordinates before zoom
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgPoint = pt.matrixTransform(ctm.inverse());

      setZoom((prevZoom) => {
        const normalizedDelta =
          Math.sign(-e.deltaY) * Math.min(1, Math.abs(e.deltaY) / 100);
        const factor = 1 + WHEEL_ZOOM_STEP * normalizedDelta;
        const newZoom = clampZoom(prevZoom * factor);
        const zoomRatio = newZoom / prevZoom;

        // Adjust pan so the cursor stays at the same SVG point after zoom
        setPanOffset((prevOffset) => {
          const newX = svgPoint.x - (svgPoint.x - prevOffset.x) / zoomRatio;
          const newY = svgPoint.y - (svgPoint.y - prevOffset.y) / zoomRatio;
          return { x: newX, y: newY };
        });

        return newZoom;
      });
    },
    [svgRef]
  );

  const handlePanStart = useCallback(
    (e: React.PointerEvent) => {
      // Only pan on left mouse button or touch
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const svg = svgRef.current;
      if (!svg) return;

      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgPoint = pt.matrixTransform(ctm.inverse());

      panStateRef.current = {
        startX: svgPoint.x,
        startY: svgPoint.y,
        startOffsetX: 0,
        startOffsetY: 0,
      };

      // We use a ref to capture current panOffset at the time of pan start
      setPanOffset((current) => {
        if (panStateRef.current) {
          panStateRef.current.startOffsetX = current.x;
          panStateRef.current.startOffsetY = current.y;
        }
        return current;
      });

      setIsPanning(true);
      svg.setPointerCapture(e.pointerId);
    },
    [svgRef]
  );

  const handlePanMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning || !panStateRef.current) return;
      const svg = svgRef.current;
      if (!svg) return;

      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgPoint = pt.matrixTransform(ctm.inverse());

      const dx = panStateRef.current.startX - svgPoint.x;
      const dy = panStateRef.current.startY - svgPoint.y;

      setPanOffset({
        x: panStateRef.current.startOffsetX + dx,
        y: panStateRef.current.startOffsetY + dy,
      });
    },
    [isPanning, svgRef]
  );

  const handlePanEnd = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return;
      const svg = svgRef.current;
      if (svg) {
        try {
          svg.releasePointerCapture(e.pointerId);
        } catch {
          // ignore if capture already released
        }
      }
      panStateRef.current = null;
      setIsPanning(false);
    },
    [isPanning, svgRef]
  );

  const zoomIn = useCallback(() => {
    setZoom((prev) => clampZoom(prev * (1 + BUTTON_ZOOM_STEP)));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => clampZoom(prev * (1 - BUTTON_ZOOM_STEP)));
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  return {
    zoom,
    panOffset: { x: clampedX, y: clampedY },
    isPanning,
    viewBox,
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    zoomIn,
    zoomOut,
    resetView,
  };
}
