import {lazy, type ComponentType} from "react";

const CHUNK_RELOAD_KEY_PREFIX = "movement-route-chunk-reload:";
const CHUNK_LOAD_ERROR_PATTERN =
  /ChunkLoadError|CSS_CHUNK_LOAD_FAILED|Loading chunk .+ failed|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i;

// React.lazy itself constrains components with ComponentType<any>.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyRouteComponent = ComponentType<any>;

function isChunkLoadError(error: unknown) {
  const message = error instanceof Error
    ? `${error.name}: ${error.message}`
    : String(error);

  return CHUNK_LOAD_ERROR_PATTERN.test(message);
}

type ChunkReloadStorage = Pick<
  Storage,
  "getItem" | "key" | "length" | "removeItem" | "setItem"
>;

export function claimChunkReloadAttempt(
  error: unknown,
  storage: ChunkReloadStorage,
  buildMarker: string,
) {
  if (!isChunkLoadError(error)) {
    return false;
  }

  const currentKey = `${CHUNK_RELOAD_KEY_PREFIX}${buildMarker}`;

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (key?.startsWith(CHUNK_RELOAD_KEY_PREFIX) && key !== currentKey) {
      storage.removeItem(key);
    }
  }

  if (storage.getItem(currentKey)) {
    return false;
  }

  storage.setItem(currentKey, "1");
  return true;
}

function reloadForChunkErrorOnce(error: unknown) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    if (!claimChunkReloadAttempt(
      error,
      window.sessionStorage,
      __APP_BUILD_TIMESTAMP__,
    )) {
      return false;
    }

    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

export function lazyRoute<TComponent extends LazyRouteComponent>(
  importer: () => Promise<{default: TComponent}>,
) {
  return lazy<TComponent>(async (): Promise<{default: TComponent}> => {
    try {
      return await importer();
    } catch (error) {
      if (reloadForChunkErrorOnce(error)) {
        return await new Promise<{default: TComponent}>((_, reject) => {
          window.setTimeout(() => reject(error), 1500);
        });
      }

      throw error;
    }
  });
}
