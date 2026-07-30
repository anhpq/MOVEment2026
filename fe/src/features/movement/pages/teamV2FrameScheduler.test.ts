import {describe, expect, it, vi} from "vitest";
import {createLatestFrameScheduler} from "./teamV2FrameScheduler";

describe("Team V2 map transform frame scheduler", () => {
  it("commits only the latest value once per animation frame", () => {
    let frameCallback: FrameRequestCallback = () => {
      throw new Error("Animation frame was not requested");
    };
    const commit = vi.fn();
    const scheduler = createLatestFrameScheduler<number>({
      requestFrame: (callback) => {
        frameCallback = callback;
        return 7;
      },
      cancelFrame: vi.fn(),
      commit,
    });

    scheduler.schedule(1);
    scheduler.schedule(2);

    expect(scheduler.peek()).toBe(2);
    expect(commit).not.toHaveBeenCalled();
    frameCallback(16);
    expect(commit).toHaveBeenCalledOnce();
    expect(commit).toHaveBeenCalledWith(2);
    expect(scheduler.peek()).toBeNull();
  });

  it("cancels pending work without committing it", () => {
    const cancelFrame = vi.fn();
    const commit = vi.fn();
    const scheduler = createLatestFrameScheduler<number>({
      requestFrame: () => 11,
      cancelFrame,
      commit,
    });

    scheduler.schedule(1);
    scheduler.cancel();

    expect(cancelFrame).toHaveBeenCalledWith(11);
    expect(commit).not.toHaveBeenCalled();
    expect(scheduler.peek()).toBeNull();
  });
});
