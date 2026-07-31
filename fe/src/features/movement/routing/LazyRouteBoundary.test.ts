import {describe, expect, it} from "vitest";
import {claimChunkReloadAttempt} from "./lazyRoute";

describe("claimChunkReloadAttempt", () => {
  it("claims only one reload for a chunk failure in the same build", () => {
    const error = new TypeError("Failed to fetch dynamically imported module");

    expect(
      claimChunkReloadAttempt(error, sessionStorage, "build-a"),
    ).toBe(true);
    expect(
      claimChunkReloadAttempt(error, sessionStorage, "build-a"),
    ).toBe(false);
    const markerKey = sessionStorage.key(0);
    expect(markerKey).not.toBeNull();
    expect(sessionStorage.getItem(markerKey ?? "")).toBe("1");
  });

  it("allows one new reload and removes the old marker after a build changes", () => {
    const error = new Error("ChunkLoadError: Loading chunk 12 failed");

    claimChunkReloadAttempt(error, sessionStorage, "build-a");

    expect(
      claimChunkReloadAttempt(error, sessionStorage, "build-b"),
    ).toBe(true);
    expect(sessionStorage.length).toBe(1);
    expect(sessionStorage.key(0)).toContain("build-b");
  });

  it("does not claim a reload for a non-chunk error", () => {
    expect(
      claimChunkReloadAttempt(
        new Error("Route render failed"),
        sessionStorage,
        "build-a",
      ),
    ).toBe(false);
    expect(sessionStorage.length).toBe(0);
  });

  it("recognizes a Vite CSS preload failure as a chunk failure", () => {
    expect(
      claimChunkReloadAttempt(
        new Error("Unable to preload CSS for /assets/route.css"),
        sessionStorage,
        "build-a",
      ),
    ).toBe(true);
  });
});
