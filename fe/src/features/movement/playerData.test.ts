import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {ApiError} from "./apiClient";
import {
  executePlayerMutation,
  fetchPlayerDatabase,
  loadPlayerMapImage,
  reconcileTeamV2Runtime,
  resetPlayerRuntimeCachesForTests,
  selectPlayerMapImageVariant,
} from "./playerData";
import {useMovementStore} from "./store";

const apiMocks = vi.hoisted(() => ({
  getPlayerCatalog: vi.fn(),
  getPlayerDashboard: vi.fn(),
  getPlayerFinal: vi.fn(),
  getPlayerProgress: vi.fn(),
  getPlayerState: vi.fn(),
  getPlayerV2Runtime: vi.fn(),
  getPlayerStationImages: vi.fn(),
  getPlayerStations: vi.fn(),
}));

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  ...apiMocks,
}));

function loginTeam() {
  useMovementStore.getState().login({
    username: "team01",
    role: "user",
    teamId: "1",
    accessToken: "player-data-test-token",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  });
}

function setNetworkConnection(connection?: {
  saveData?: boolean;
  effectiveType?: string;
}) {
  Object.defineProperty(navigator, "connection", {
    configurable: true,
    value: connection,
  });
}

function mockLeanResponses() {
  apiMocks.getPlayerState.mockResolvedValue({
    catalogVersion: "catalog-v1",
    serverNow: "2026-07-29T02:00:00.000Z",
    team: {
      id: 1,
      name: "Team 01",
      username: "team01",
      captainName: "Captain",
      totalPoints: 110,
      maxPossiblePoints: 300,
      totalPlaySeconds: 7200,
      status: "ACTIVE",
      rank: 2,
      teamColor: "#112233",
      color: "#112233",
    },
    completedStations: 1,
    progress: [{
      id: 9,
      teamId: 1,
      stationId: "ST001",
      status: "COMPLETED",
      checkedInAt: "2026-07-29T01:00:00.000Z",
      checkedOutAt: "2026-07-29T01:01:00.000Z",
      completedAt: "2026-07-29T01:01:00.000Z",
      cancelledAt: null,
      nextCheckInAllowedAt: null,
      scoreAchieved: 30,
      attemptNo: 1,
    }],
    final: {
      isOpen: true,
      canSubmit: true,
      blockedByActiveStation: false,
      activeStationId: null,
      finalStartsAt: "2026-07-29T03:00:00.000Z",
      eventEndTime: "2026-07-29T04:00:00.000Z",
    },
  });
  apiMocks.getPlayerCatalog.mockResolvedValue({
    catalogVersion: "catalog-v1",
    stations: [{
      id: "ST001",
      name: "Trạm 01",
      description: "Mô tả",
      mapX: 10,
      mapY: 20,
      trackingMode: "BOTH",
      imageCount: 2,
      game: {
        id: "1",
        title: "Game",
        type: "STANDARD",
        difficulty: 1,
        maxPoints: 30,
        clueText: null,
        mediaUrl: null,
      },
    }],
  });
}

function mockV2Runtime(runtimeVersion = "runtime-v1") {
  apiMocks.getPlayerV2Runtime.mockResolvedValue({
    runtimeVersion,
    catalogVersion: "catalog-v1",
    totalPoints: 140,
    rank: 1,
    completedStations: 1,
    progress: [{
      stationId: "ST001",
      status: "COMPLETED",
      checkedInAt: "2026-07-29T01:00:00.000Z",
      checkedOutAt: "2026-07-29T01:01:00.000Z",
      completedAt: "2026-07-29T01:01:00.000Z",
      scoreAchieved: 30,
      attemptNo: 1,
    }],
    final: {
      isOpen: false,
      canSubmit: false,
      blockedByActiveStation: false,
      activeStationId: null,
      finalStartsAt: "03:00",
      eventEndTime: "02:55",
      notifyBeforeMinutes: 15,
      secondsUntilFinal: 600,
      stationCheckInClosed: false,
      phase: "NOTICE",
      pendingScoreStationId: null,
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  resetPlayerRuntimeCachesForTests();
  loginTeam();
});

afterEach(() => {
  useMovementStore.getState().logout();
  resetPlayerRuntimeCachesForTests();
  setNetworkConnection();
  vi.unstubAllGlobals();
});

describe("lean player projection", () => {
  it("keeps backend aggregates authoritative and defers image URLs", async () => {
    mockLeanResponses();

    const seed = await fetchPlayerDatabase("vi");
    useMovementStore.getState().loadDatabase(seed);

    const state = useMovementStore.getState();
    expect(state.teams[0]).toMatchObject({
      score: 110,
      finish: 1,
      totalTimeMinutes: 120,
    });
    expect(state.teamStations["1"][0]).toMatchObject({
      score: 30,
      imageCount: 2,
      imageUrls: [],
    });
    expect(state.finalSummary).toEqual({
      isOpen: true,
      canSubmit: true,
      blockedByActiveStation: false,
      activeStationId: null,
      finalStartsAt: "2026-07-29T03:00:00.000Z",
      eventEndTime: "2026-07-29T04:00:00.000Z",
    });
    expect(apiMocks.getPlayerDashboard).not.toHaveBeenCalled();
  });

  it("uses legacy bootstrap only when a lean endpoint returns 404 or 405", async () => {
    apiMocks.getPlayerState.mockRejectedValue(
      new ApiError("safe", 404, "GET", "/api/player/state"),
    );
    apiMocks.getPlayerDashboard.mockResolvedValue({
      team: {
        id: 1,
        name: "Team 01",
        username: "team01",
        totalPoints: 12,
        totalPlaySeconds: 60,
        rank: null,
      },
      completedStations: 0,
      serverNow: "2026-07-29T02:00:00.000Z",
    });
    apiMocks.getPlayerStations.mockResolvedValue([]);
    apiMocks.getPlayerProgress.mockResolvedValue([]);
    apiMocks.getPlayerFinal.mockResolvedValue({
      isOpen: true,
      canSubmit: true,
      blockedByActiveStation: false,
      activeStationId: null,
      finalStartsAt: "2026-07-29T03:00:00.000Z",
      eventEndTime: "2026-07-29T04:00:00.000Z",
    });

    await expect(fetchPlayerDatabase("vi")).resolves.toMatchObject({
      activeTeamId: "1",
    });
    expect(apiMocks.getPlayerDashboard).toHaveBeenCalledTimes(1);
    expect(apiMocks.getPlayerStations).toHaveBeenCalledTimes(1);
    expect(apiMocks.getPlayerProgress).toHaveBeenCalledTimes(1);
    expect(apiMocks.getPlayerFinal).toHaveBeenCalledTimes(1);
  });

  it("does not hide a lean 5xx failure behind legacy endpoints", async () => {
    apiMocks.getPlayerState.mockRejectedValue(
      new ApiError("safe", 503, "GET", "/api/player/state"),
    );

    await expect(fetchPlayerDatabase("vi")).rejects.toMatchObject({status: 503});
    expect(apiMocks.getPlayerDashboard).not.toHaveBeenCalled();
    expect(apiMocks.getPlayerStations).not.toHaveBeenCalled();
  });
});

describe("player mutation reconciliation", () => {
  it("runs one fresh state reconciliation after a successful mutation", async () => {
    mockLeanResponses();
    const mutation = vi.fn().mockResolvedValue({action: "CHECK_IN"});

    await expect(executePlayerMutation(mutation, "vi")).resolves.toMatchObject({
      result: {action: "CHECK_IN"},
      reconciled: true,
    });

    expect(mutation).toHaveBeenCalledTimes(1);
    expect(apiMocks.getPlayerState).toHaveBeenCalledTimes(1);
    expect(apiMocks.getPlayerCatalog).toHaveBeenCalledTimes(1);
  });

  it("reconciles once before surfacing an unknown mutation outcome", async () => {
    mockLeanResponses();
    const error = new ApiError("safe", 0, "POST", "/api/player/qr-action", {
      code: "NETWORK",
      retryable: true,
    });
    const mutation = vi.fn().mockRejectedValue(error);

    await expect(executePlayerMutation(mutation, "vi")).rejects.toBe(error);

    expect(mutation).toHaveBeenCalledTimes(1);
    expect(apiMocks.getPlayerState).toHaveBeenCalledTimes(1);
    expect(apiMocks.getPlayerCatalog).toHaveBeenCalledTimes(1);
  });
});

describe("Team V2 compact runtime reconciliation", () => {
  it("merges dynamic runtime fields without reloading an unchanged catalog", async () => {
    mockLeanResponses();
    mockV2Runtime();
    useMovementStore.getState().loadDatabase(await fetchPlayerDatabase("vi"));

    await expect(reconcileTeamV2Runtime("vi")).resolves.toEqual({
      changed: true,
      catalogReloaded: false,
    });

    expect(useMovementStore.getState().teams[0]).toMatchObject({score: 140, rank: 1});
    expect(useMovementStore.getState().finalSummary).toMatchObject({phase: "NOTICE"});
    expect(apiMocks.getPlayerCatalog).toHaveBeenCalledTimes(1);
    expect(apiMocks.getPlayerState).toHaveBeenCalledTimes(1);
  });

  it("does not update the store twice for the same runtime version", async () => {
    mockLeanResponses();
    mockV2Runtime();
    useMovementStore.getState().loadDatabase(await fetchPlayerDatabase("vi"));
    await reconcileTeamV2Runtime("vi");
    const stateAfterFirstRuntime = useMovementStore.getState();

    await expect(reconcileTeamV2Runtime("vi")).resolves.toEqual({
      changed: false,
      catalogReloaded: false,
    });

    expect(useMovementStore.getState()).toBe(stateAfterFirstRuntime);
  });
});

describe("map image cache", () => {
  it.each([
    [{saveData: true, effectiveType: "4g"}],
    [{saveData: false, effectiveType: "2g"}],
  ])("caps the selected map asset at 1920px for %o", (connection) => {
    setNetworkConnection(connection);

    expect(selectPlayerMapImageVariant(2_000, 2, true)).toMatchObject({
      width: 1920,
    });
  });

  it("keeps the 2950px high-zoom asset on a normal connection", () => {
    setNetworkConnection({saveData: false, effectiveType: "4g"});

    expect(selectPlayerMapImageVariant(2_000, 2, true)).toMatchObject({
      width: 2950,
    });
  });

  it("evicts a rejected image promise and retries once", async () => {
    let createdImages = 0;
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        createdImages += 1;
        queueMicrotask(() => {
          if (createdImages === 1) {
            this.onerror?.();
          } else {
            this.onload?.();
          }
        });
      }
    }
    vi.stubGlobal("Image", FakeImage);

    await expect(loadPlayerMapImage("/map.webp")).resolves.toBeInstanceOf(FakeImage);
    expect(createdImages).toBe(2);
  });
});
