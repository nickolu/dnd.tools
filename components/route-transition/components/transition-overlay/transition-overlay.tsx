"use client";

import { motion } from "framer-motion";

import type { TransitionOverlayProps } from "@/components/route-transition/components/transition-overlay/types";
import { TRANSITION_DURATION_SECONDS } from "@/components/route-transition/constants";
import { getTargetRect } from "@/components/route-transition/utils/getTargetRect";

export function TransitionOverlay({ fromRect, title }: TransitionOverlayProps) {
  const targetRect = getTargetRect();

  return (
    <motion.div
      animate={{
        borderRadius: 20,
        height: targetRect.height,
        opacity: 0,
        width: targetRect.width,
        x: targetRect.x,
        y: targetRect.y,
      }}
      className="surface-card pointer-events-none fixed left-0 top-0 z-[100] overflow-hidden"
      initial={{
        borderRadius: 20,
        height: fromRect.height,
        opacity: 1,
        width: fromRect.width,
        x: fromRect.x,
        y: fromRect.y,
      }}
      transition={{
        duration: TRANSITION_DURATION_SECONDS,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div className="flex h-full items-center justify-center p-8">
        <h2 className="typography-h1">{title}</h2>
      </div>
    </motion.div>
  );
}
