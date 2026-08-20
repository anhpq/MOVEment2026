import {describe, expect, it, vi} from "vitest";
import {
  applyTeamV2MarkerAnimationFrame,
  getTeamV2CanvasPixelRatio,
  resetTeamV2MarkerAnimation,
  type TeamV2AnimatedMarkerNode,
} from "./teamV2MarkerAnimation";

function createNode(): TeamV2AnimatedMarkerNode {
  return {
    opacity: vi.fn(),
    scale: vi.fn(),
  };
}

describe("Team V2 marker animation", () => {
  it("updates every animated marker from one shared frame time", () => {
    const active = createNode();
    const gathering = createNode();

    applyTeamV2MarkerAnimationFrame(181.25, {active, gathering});

    expect(active.scale).toHaveBeenCalledOnce();
    expect(active.opacity).toHaveBeenCalledOnce();
    expect(gathering.scale).toHaveBeenCalledOnce();
    expect(gathering.opacity).toHaveBeenCalledOnce();
  });

  it("resets animated nodes during pause and cleanup", () => {
    const active = createNode();
    const gathering = createNode();

    resetTeamV2MarkerAnimation({active, gathering});

    expect(active.scale).toHaveBeenLastCalledWith({x: 1, y: 1});
    expect(active.opacity).toHaveBeenLastCalledWith(1);
    expect(gathering.scale).toHaveBeenLastCalledWith({x: 1, y: 1});
    expect(gathering.opacity).toHaveBeenLastCalledWith(1);
  });

  it.each([
    {input: Number.NaN, expected: 1},
    {input: 0, expected: 1},
    {input: 1, expected: 1},
    {input: 1.5, expected: 1.5},
    {input: 3, expected: 2},
  ])("uses a sharp but bounded canvas ratio for $input", ({input, expected}) => {
    expect(getTeamV2CanvasPixelRatio(input)).toBe(expected);
  });
});
