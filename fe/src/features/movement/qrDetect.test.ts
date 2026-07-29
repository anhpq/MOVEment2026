import {afterEach, describe, expect, it, vi} from "vitest";
import {createQrFrameDetector} from "./qrDetect";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("createQrFrameDetector", () => {
  it("falls back when an exposed BarcodeDetector cannot initialize QR", () => {
    class BrokenBarcodeDetector {
      constructor() {
        throw new DOMException("unsupported format", "NotSupportedError");
      }
    }
    vi.stubGlobal("BarcodeDetector", BrokenBarcodeDetector);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(null);

    const detector = createQrFrameDetector();

    expect(detector).toMatchObject({
      detect: expect.any(Function),
      dispose: expect.any(Function),
    });
    expect(() => detector.dispose()).not.toThrow();
  });
});
