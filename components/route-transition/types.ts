export type TransitionRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type RouteTransitionSnapshot = {
  fromRect: TransitionRect;
  route: string;
  title: string;
};

export type RouteTransitionContextValue = {
  beginTransition: (snapshot: RouteTransitionSnapshot) => void;
};
