import {act, renderHook} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";
import {useVisibleOnlinePolling} from "./useVisibleOnlinePolling";

function setRuntimeState(visibility: DocumentVisibilityState, online: boolean) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: visibility,
  });
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: online,
  });
}

afterEach(() => {
  vi.useRealTimers();
  setRuntimeState("visible", true);
});

describe("useVisibleOnlinePolling", () => {
  it("does not poll while hidden or offline and refreshes when active again", async () => {
    vi.useFakeTimers();
    setRuntimeState("hidden", true);
    const callback = vi.fn().mockResolvedValue(undefined);

    renderHook(() => useVisibleOnlinePolling(callback, {intervalMs: 1_000}));
    await act(async () => vi.advanceTimersByTime(3_000));
    expect(callback).not.toHaveBeenCalled();

    setRuntimeState("visible", true);
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    expect(callback).toHaveBeenCalledTimes(1);

    setRuntimeState("visible", false);
    await act(async () => vi.advanceTimersByTime(3_000));
    expect(callback).toHaveBeenCalledTimes(1);

    setRuntimeState("visible", true);
    await act(async () => window.dispatchEvent(new Event("online")));
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("never overlaps a slow poll", async () => {
    vi.useFakeTimers();
    setRuntimeState("visible", true);
    let resolveRequest: (() => void) | undefined;
    const callback = vi.fn(() => new Promise<void>((resolve) => {
      resolveRequest = resolve;
    }));

    renderHook(() => useVisibleOnlinePolling(callback, {intervalMs: 1_000}));
    expect(callback).toHaveBeenCalledTimes(1);

    await act(async () => vi.advanceTimersByTime(3_000));
    expect(callback).toHaveBeenCalledTimes(1);

    await act(async () => resolveRequest?.());
    await act(async () => vi.advanceTimersByTime(1_000));
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
