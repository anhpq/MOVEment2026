import {afterEach, describe, expect, it, vi} from "vitest";
import {
  clearRuntimeRequestCoordinator,
  getTeamRuntimePollIntervalMs,
  isReducedDataMode,
  runSingleFlight,
  shouldPollTeamRuntime,
  TEAM_RUNTIME_POLL_INTERVAL_MS,
  TEAM_RUNTIME_REDUCED_DATA_POLL_INTERVAL_MS,
} from "./runtimeCoordinator";

describe("Final runtime polling gate", () => {
  it.each(["NORMAL", "NOTICE", "STATIONS_CLOSED"] as const)(
    "keeps Team polling active during %s",
    (phase) => {
      expect(shouldPollTeamRuntime("user", phase)).toBe(true);
    },
  );

  it("stops Team polling after Final starts", () => {
    expect(shouldPollTeamRuntime("user", "FINAL_STARTED")).toBe(false);
    expect(shouldPollTeamRuntime("admin", "NOTICE")).toBe(false);
    expect(shouldPollTeamRuntime(undefined, undefined)).toBe(false);
  });
});

function setNetworkConnection(connection?: {
  saveData?: boolean;
  effectiveType?: string;
}) {
  Object.defineProperty(navigator, "connection", {
    configurable: true,
    value: connection,
  });
}

afterEach(() => {
  clearRuntimeRequestCoordinator();
  setNetworkConnection();
});

describe("reduced data mode", () => {
  it("locks the documented 15s/30s polling rollback baseline", () => {
    expect(TEAM_RUNTIME_POLL_INTERVAL_MS).toBe(15_000);
    expect(TEAM_RUNTIME_REDUCED_DATA_POLL_INTERVAL_MS).toBe(30_000);
  });

  it.each([
    [{saveData: true, effectiveType: "4g"}],
    [{saveData: false, effectiveType: "2g"}],
    [{saveData: false, effectiveType: "slow-2g"}],
  ])("uses the reduced request cadence for %o", (connection) => {
    setNetworkConnection(connection);

    expect(isReducedDataMode()).toBe(true);
    expect(getTeamRuntimePollIntervalMs()).toBe(
      TEAM_RUNTIME_REDUCED_DATA_POLL_INTERVAL_MS,
    );
  });

  it("keeps the normal request cadence on faster connections", () => {
    setNetworkConnection({saveData: false, effectiveType: "4g"});

    expect(isReducedDataMode()).toBe(false);
    expect(getTeamRuntimePollIntervalMs()).toBe(
      TEAM_RUNTIME_POLL_INTERVAL_MS,
    );
  });
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
