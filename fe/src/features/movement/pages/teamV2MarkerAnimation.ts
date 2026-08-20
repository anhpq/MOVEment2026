export type TeamV2AnimatedMarkerNode = {
  opacity: (value: number) => unknown;
  scale: (value: {x: number; y: number}) => unknown;
};

export type TeamV2AnimatedMarkerNodes = {
  active: TeamV2AnimatedMarkerNode | null;
  gathering: TeamV2AnimatedMarkerNode | null;
};

export function applyTeamV2MarkerAnimationFrame(
  elapsedMs: number,
  nodes: TeamV2AnimatedMarkerNodes,
) {
  if (nodes.active) {
    const beat = Math.max(0, Math.sin((elapsedMs / 1450) * Math.PI * 4));
    const scale = 1 + beat * 0.08;
    nodes.active.scale({x: scale, y: scale});
    nodes.active.opacity(0.84 + beat * 0.16);
  }

  if (nodes.gathering) {
    const firstBeat = Math.max(0, Math.sin((elapsedMs / 1500) * Math.PI * 4));
    const secondBeat = Math.max(
      0,
      Math.sin(((elapsedMs + 210) / 1500) * Math.PI * 4),
    );
    const beat = Math.max(firstBeat, secondBeat * 0.72);
    const scale = 1 + beat * 0.09;
    nodes.gathering.scale({x: scale, y: scale});
    nodes.gathering.opacity(0.88 + beat * 0.12);
  }
}

export function resetTeamV2MarkerAnimation(nodes: TeamV2AnimatedMarkerNodes) {
  for (const node of [nodes.active, nodes.gathering]) {
    node?.scale({x: 1, y: 1});
    node?.opacity(1);
  }
}

export function getTeamV2CanvasPixelRatio(devicePixelRatio: number) {
  if (!Number.isFinite(devicePixelRatio) || devicePixelRatio <= 0) {
    return 1;
  }
  return Math.min(devicePixelRatio, 2);
}
