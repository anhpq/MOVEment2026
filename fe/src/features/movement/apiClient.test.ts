import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {
  ApiError,
  apiGet,
  apiPost,
  getSafeApiErrorTranslationKey,
} from "./apiClient";
import {persistStoredSession} from "./sessionIdentity";

function jsonResponse(value: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {"content-type": "application/json", ...headers},
  });
}

beforeEach(() => {
  persistStoredSession({
    username: "team01",
    role: "user",
    teamId: "1",
    accessToken: "test-access-token",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("apiClient request policy", () => {
  it("retries a retryable GET at most twice and reuses its request id", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("network down"))
      .mockRejectedValueOnce(new TypeError("network down"))
      .mockResolvedValueOnce(jsonResponse({ok: true}));
    vi.stubGlobal("fetch", fetchMock);

    const request = apiGet<{ok: boolean}>("/api/player/state");
    await vi.runAllTimersAsync();

    await expect(request).resolves.toEqual({ok: true});
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const requestIds = fetchMock.mock.calls.map(([, options]) =>
      new Headers((options as RequestInit).headers).get("X-Request-ID"));
    expect(new Set(requestIds).size).toBe(1);
  });

  it("never automatically retries a mutation", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("network down"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiPost("/api/player/qr-action", {qrToken: "redacted"}))
      .rejects.toMatchObject({code: "NETWORK", retryable: true});
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps backend details internal while exposing a safe message and code", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({
      statusCode: 409,
      code: "PLAYER_ACTIVE_STATION_CONFLICT",
      message: "raw internal station detail",
    }, 409, {"x-request-id": "request-17"})));

    let caught: unknown;
    try {
      await apiPost("/api/player/qr-action", {qrToken: "redacted"});
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught).toMatchObject({
      backendCode: "PLAYER_ACTIVE_STATION_CONFLICT",
      reason: "raw internal station detail",
      requestId: "request-17",
    });
    expect((caught as ApiError).message).not.toContain("raw internal");
    expect(getSafeApiErrorTranslationKey(caught)).toBe("errors.generic");
  });
});
