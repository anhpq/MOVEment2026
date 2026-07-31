export type LatestFrameScheduler<T> = {
  cancel: () => void;
  peek: () => T | null;
  schedule: (value: T) => void;
};

export function createLatestFrameScheduler<T>({
  cancelFrame,
  commit,
  requestFrame,
}: {
  cancelFrame: (frameId: number) => void;
  commit: (value: T) => void;
  requestFrame: (callback: FrameRequestCallback) => number;
}): LatestFrameScheduler<T> {
  let frameId: number | null = null;
  let queuedValue: T | null = null;

  return {
    schedule(value) {
      queuedValue = value;
      if (frameId !== null) {
        return;
      }
      frameId = requestFrame(() => {
        frameId = null;
        const valueToCommit = queuedValue;
        queuedValue = null;
        if (valueToCommit !== null) {
          commit(valueToCommit);
        }
      });
    },
    peek() {
      return queuedValue;
    },
    cancel() {
      queuedValue = null;
      if (frameId !== null) {
        cancelFrame(frameId);
        frameId = null;
      }
    },
  };
}
