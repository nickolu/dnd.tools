import { TRANSITION_INSET } from "@/components/route-transition/constants";
import type { TransitionRect } from "@/components/route-transition/types";

export function getTargetRect(): TransitionRect {
  return {
    height: Math.max(window.innerHeight - TRANSITION_INSET * 2, 240),
    width: Math.max(window.innerWidth - TRANSITION_INSET * 2, 320),
    x: TRANSITION_INSET,
    y: TRANSITION_INSET,
  };
}
