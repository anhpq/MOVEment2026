type WebkitFullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
};

type WebkitFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type StandaloneNavigator = Navigator & {
  standalone?: boolean;
};

export const TEAM_V2_FULLSCREEN_CHANGE_EVENTS = [
  "fullscreenchange",
  "webkitfullscreenchange",
] as const;

export type FullscreenToggleResult = "entered" | "exited" | "unsupported";

export function getActiveFullscreenElement(targetDocument: Document = document) {
  const webkitDocument = targetDocument as WebkitFullscreenDocument;
  return targetDocument.fullscreenElement ?? webkitDocument.webkitFullscreenElement ?? null;
}

export function isFullscreenSupported(
  targetDocument: Document = document,
  targetElement: HTMLElement = targetDocument.documentElement,
) {
  const webkitDocument = targetDocument as WebkitFullscreenDocument;
  const webkitElement = targetElement as WebkitFullscreenElement;
  const supportsStandard =
    typeof targetElement.requestFullscreen === "function" &&
    targetDocument.fullscreenEnabled !== false;
  const supportsWebkit =
    typeof webkitElement.webkitRequestFullscreen === "function" &&
    webkitDocument.webkitFullscreenEnabled !== false;

  return supportsStandard || supportsWebkit;
}

export function isStandaloneDisplayMode(
  targetWindow: Pick<Window, "matchMedia"> | undefined =
    typeof window === "undefined" ? undefined : window,
  targetNavigator: Navigator | undefined =
    typeof navigator === "undefined" ? undefined : navigator,
) {
  if ((targetNavigator as StandaloneNavigator | undefined)?.standalone === true) {
    return true;
  }

  return Boolean(
    targetWindow?.matchMedia?.("(display-mode: fullscreen)").matches ||
      targetWindow?.matchMedia?.("(display-mode: standalone)").matches,
  );
}

export async function toggleBrowserFullscreen(
  targetDocument: Document = document,
  targetElement: HTMLElement = targetDocument.documentElement,
): Promise<FullscreenToggleResult> {
  const webkitDocument = targetDocument as WebkitFullscreenDocument;
  const webkitElement = targetElement as WebkitFullscreenElement;

  if (getActiveFullscreenElement(targetDocument)) {
    if (typeof targetDocument.exitFullscreen === "function") {
      await targetDocument.exitFullscreen();
      return "exited";
    }
    if (typeof webkitDocument.webkitExitFullscreen === "function") {
      await webkitDocument.webkitExitFullscreen.call(webkitDocument);
      return "exited";
    }
    return "unsupported";
  }

  if (
    typeof targetElement.requestFullscreen === "function" &&
    targetDocument.fullscreenEnabled !== false
  ) {
    await targetElement.requestFullscreen({navigationUI: "hide"});
    return "entered";
  }
  if (
    typeof webkitElement.webkitRequestFullscreen === "function" &&
    webkitDocument.webkitFullscreenEnabled !== false
  ) {
    await webkitElement.webkitRequestFullscreen.call(webkitElement);
    return "entered";
  }

  return "unsupported";
}
