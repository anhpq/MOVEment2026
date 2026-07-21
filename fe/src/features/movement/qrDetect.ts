import jsQR from "jsqr";

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{rawValue?: string}>>;
};

type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorLike;

function getBarcodeDetector(): BarcodeDetectorConstructor | null {
  const candidate = (
    globalThis as typeof globalThis & {
      BarcodeDetector?: BarcodeDetectorConstructor;
    }
  ).BarcodeDetector;

  return candidate ?? null;
}

export function supportsCameraQrScan(): boolean {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

export function normalizeDecodedQrValue(rawValue: string): string {
  const value = rawValue.trim();
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    const token =
      url.searchParams.get("token") ??
      url.searchParams.get("qrToken") ??
      url.searchParams.get("stationToken");
    if (token?.trim()) {
      return token.trim();
    }
  } catch {
    // Non-URL payloads are handled below.
  }

  try {
    const parsed = JSON.parse(value) as {
      qrToken?: string;
      token?: string;
      stationToken?: string;
    };
    const token = parsed.qrToken ?? parsed.stationToken ?? parsed.token;
    if (token?.trim()) {
      return token.trim();
    }
  } catch {
    // Plain text station tokens are already valid input.
  }

  return value;
}

export function createQrFrameDetector() {
  const Detector = getBarcodeDetector();
  const barcodeDetector = Detector
    ? new Detector({formats: ["qr_code"]})
    : null;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", {willReadFrequently: true});

  return {
    async detect(video: HTMLVideoElement): Promise<string | null> {
      if (barcodeDetector) {
        try {
          const codes = await barcodeDetector.detect(video);
          const value = codes[0]?.rawValue?.trim();
          if (value) {
            return value;
          }
        } catch {
          // Some native detectors reject individual frames; jsQR can still try.
        }
      }

      if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
        return null;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      return result?.data?.trim() || null;
    },
  };
}

export async function openQrCameraStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: {ideal: "environment"},
    },
    audio: false,
  });
}
