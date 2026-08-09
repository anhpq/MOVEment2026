import {describe, expect, it, vi} from "vitest";
import {
  getActiveFullscreenElement,
  isFullscreenSupported,
  isStandaloneDisplayMode,
  toggleBrowserFullscreen,
} from "./teamV2Fullscreen";

function createFullscreenFixture() {
  const targetDocument = document.implementation.createHTMLDocument();
  const targetElement = targetDocument.documentElement;
  return {targetDocument, targetElement};
}

function setReadonlyProperty(target: object, property: string, value: unknown) {
  Object.defineProperty(target, property, {
    configurable: true,
    value,
  });
}

describe("Team V2 fullscreen", () => {
  it("enters standard fullscreen while asking the browser to hide navigation UI", async () => {
    const {targetDocument, targetElement} = createFullscreenFixture();
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    setReadonlyProperty(targetDocument, "fullscreenEnabled", true);
    setReadonlyProperty(targetElement, "requestFullscreen", requestFullscreen);

    await expect(
      toggleBrowserFullscreen(targetDocument, targetElement),
    ).resolves.toBe("entered");
    expect(requestFullscreen).toHaveBeenCalledWith({navigationUI: "hide"});
    expect(isFullscreenSupported(targetDocument, targetElement)).toBe(true);
  });

  it("exits standard fullscreen when an element is already active", async () => {
    const {targetDocument, targetElement} = createFullscreenFixture();
    const exitFullscreen = vi.fn().mockResolvedValue(undefined);
    setReadonlyProperty(targetDocument, "fullscreenElement", targetElement);
    setReadonlyProperty(targetDocument, "exitFullscreen", exitFullscreen);

    await expect(
      toggleBrowserFullscreen(targetDocument, targetElement),
    ).resolves.toBe("exited");
    expect(exitFullscreen).toHaveBeenCalledOnce();
    expect(getActiveFullscreenElement(targetDocument)).toBe(targetElement);
  });

  it("uses the prefixed Safari API when the standard API is unavailable", async () => {
    const {targetDocument, targetElement} = createFullscreenFixture();
    const webkitRequestFullscreen = vi.fn();
    setReadonlyProperty(targetDocument, "webkitFullscreenEnabled", true);
    setReadonlyProperty(targetElement, "webkitRequestFullscreen", webkitRequestFullscreen);

    await expect(
      toggleBrowserFullscreen(targetDocument, targetElement),
    ).resolves.toBe("entered");
    expect(webkitRequestFullscreen).toHaveBeenCalledOnce();
    expect(isFullscreenSupported(targetDocument, targetElement)).toBe(true);
  });

  it("reports unsupported browsers without claiming fullscreen was entered", async () => {
    const {targetDocument, targetElement} = createFullscreenFixture();

    await expect(
      toggleBrowserFullscreen(targetDocument, targetElement),
    ).resolves.toBe("unsupported");
    expect(isFullscreenSupported(targetDocument, targetElement)).toBe(false);
  });

  it("recognizes iOS Home Screen and standard standalone display modes", () => {
    const matchMedia = vi.fn((query: string) => ({
      matches: query === "(display-mode: standalone)",
    })) as unknown as Window["matchMedia"];

    expect(
      isStandaloneDisplayMode(
        {matchMedia},
        {standalone: false} as unknown as Navigator,
      ),
    ).toBe(true);
    expect(
      isStandaloneDisplayMode(
        {matchMedia: vi.fn(() => ({matches: false})) as unknown as Window["matchMedia"]},
        {standalone: true} as unknown as Navigator,
      ),
    ).toBe(true);
  });

  it("does not treat browser fullscreen display mode as an installed standalone app", () => {
    const matchMedia = vi.fn((query: string) => ({
      matches: query === "(display-mode: fullscreen)",
    })) as unknown as Window["matchMedia"];

    expect(
      isStandaloneDisplayMode(
        {matchMedia},
        {standalone: false} as unknown as Navigator,
      ),
    ).toBe(false);
  });
});
