import {afterEach, describe, expect, it, vi} from "vitest";
import {
  clearRuntimeRequestCoordinator,
  runSingleFlight,
} from "./runtimeCoordinator";

afterEach(() => {
  clearRuntimeRequestCoordinator();
});

describe("runSingleFlight", () => {
  it("shares one in-flight request for the same runtime key", async () => {
    let resolveRequest: ((value: number) => void) | undefined;
    const request = vi.fn(() => new Promise<number>((resolve) => {
      resolveRequest = resolve;
    }));

    const first = runSingleFlight("player-state:team-a", request);
    const second = runSingleFlight("player-state:team-a", request);

    expect(first).toBe(second);
    expect(request).toHaveBeenCalledTimes(1);

    resolveRequest?.(17);
    await expect(first).resolves.toBe(17);
  });

  it("releases the key after settlement", async () => {
    const request = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    await expect(runSingleFlight("leaderboard:team-a", request)).resolves.toBe(1);
    await expect(runSingleFlight("leaderboard:team-a", request)).resolves.toBe(2);

    expect(request).toHaveBeenCalledTimes(2);
  });
});
