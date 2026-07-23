import {CameraOutlined} from "@ant-design/icons";
import {Alert, Button, Flex, Input, Typography} from "antd";
import {useCallback, useEffect, useRef, useState} from "react";
import {
  createQrFrameDetector,
  normalizeDecodedQrValue,
  openQrCameraStream,
  supportsCameraQrScan,
} from "../qrDetect";
import type {QrFrameDetector} from "../qrDetect";

type QrTokenInputProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}>;

type ScannerState =
  | "idle"
  | "requestingPermission"
  | "active"
  | "decoding"
  | "success"
  | "error";

type CameraFailureCategory =
  | "Camera permission was denied"
  | "No camera is available"
  | "Camera is being used by another application"
  | "Browser cannot start the requested camera"
  | "Camera stream started but video playback failed"
  | "QR scanner initialization failed";

const cameraErrorMessages: Record<CameraFailureCategory, string> = {
  "Camera permission was denied":
    "Bạn đã từ chối quyền camera. Hãy bật quyền camera cho trình duyệt rồi thử lại.",
  "No camera is available":
    "Thiết bị không có camera khả dụng. Vui lòng nhập mã QR thủ công.",
  "Camera is being used by another application":
    "Camera đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại.",
  "Browser cannot start the requested camera":
    "Trình duyệt không thể mở camera yêu cầu. Hãy thử lại hoặc nhập mã thủ công.",
  "Camera stream started but video playback failed":
    "Camera đã mở nhưng trình duyệt không phát được hình ảnh xem trước.",
  "QR scanner initialization failed":
    "Không thể khởi động bộ quét QR. Vui lòng nhập mã QR thủ công.",
};

function getCameraFailureCategory(
  error: unknown,
  fallback: CameraFailureCategory,
): CameraFailureCategory {
  if (!(error instanceof DOMException)) {
    return fallback;
  }

  switch (error.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera permission was denied";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No camera is available";
    case "NotReadableError":
    case "TrackStartError":
      return "Camera is being used by another application";
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
    case "AbortError":
      return "Browser cannot start the requested camera";
    default:
      return fallback;
  }
}

function logCameraDiagnostic(reason: string, details: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.info("[qr-camera]", reason, details);
  }
}

function waitForVideoMetadata(
  video: HTMLVideoElement,
  setCancelListener: (cancelListener: (() => void) | null) => void,
): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    setCancelListener(null);
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = (error?: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("error", handleError);
      setCancelListener(null);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };
    const handleLoadedMetadata = () => {
      cleanup();
    };
    const handleError = () => {
      cleanup(new Error("Video metadata failed to load"));
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata, {
      once: true,
    });
    video.addEventListener("error", handleError, {once: true});
    setCancelListener(() =>
      cleanup(new Error("Video metadata wait was cancelled")),
    );
  });
}

export function QrTokenInput({
  value,
  onChange,
  placeholder,
}: QrTokenInputProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const metadataCancelRef = useRef<(() => void) | null>(null);
  const detectorRef = useRef<QrFrameDetector | null>(null);
  const startPromiseRef = useRef<Promise<void> | null>(null);
  const scannerActiveRef = useRef(false);
  const scannerRunRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const [scannerState, setScannerState] = useState<ScannerState>("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const canUseCamera = supportsCameraQrScan();
  const isCameraRunning =
    scannerState === "requestingPermission" ||
    scannerState === "active" ||
    scannerState === "decoding";

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const stopScanner = useCallback((reason: string) => {
    scannerRunRef.current += 1;
    scannerActiveRef.current = false;

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (metadataCancelRef.current) {
      metadataCancelRef.current();
      metadataCancelRef.current = null;
    }

    detectorRef.current?.dispose();
    detectorRef.current = null;

    const video = videoRef.current;
    const stream =
      streamRef.current ??
      (video?.srcObject instanceof MediaStream ? video.srcObject : null);

    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }

    const wasActive = Boolean(stream);
    streamRef.current = null;
    startPromiseRef.current = null;

    if (video) {
      video.pause();
      video.srcObject = null;
      video.removeAttribute("src");
      video.load();
    }

    logCameraDiagnostic("stop", {
      reason,
      wasActive,
      secureContext: window.isSecureContext,
    });
  }, []);

  const failCamera = useCallback(
    (
      error: unknown,
      fallbackCategory: CameraFailureCategory,
      scannerRun: number,
    ) => {
      if (scannerRunRef.current !== scannerRun) {
        return;
      }

      const category = getCameraFailureCategory(error, fallbackCategory);
      stopScanner(category);
      setCameraError(cameraErrorMessages[category]);
      setScannerState("error");

      logCameraDiagnostic("error", {
        category,
        errorName: error instanceof Error ? error.name : null,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    },
    [stopScanner],
  );

  function scheduleDecode(
    video: HTMLVideoElement,
    detector: ReturnType<typeof createQrFrameDetector>,
    scannerRun: number,
  ) {
    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;

      if (scannerRunRef.current !== scannerRun) {
        return;
      }

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        scheduleDecode(video, detector, scannerRun);
        return;
      }

      setScannerState("decoding");
      void detector
        .detect(video)
        .then((result) => {
          if (scannerRunRef.current !== scannerRun) {
            return;
          }

          if (result) {
            const normalized = normalizeDecodedQrValue(result);
            setScannerState("success");
            stopScanner("decode-success");
            onChangeRef.current(normalized);
            return;
          }

          setScannerState("active");
          scheduleDecode(video, detector, scannerRun);
        })
        .catch((error: unknown) => {
          failCamera(error, "QR scanner initialization failed", scannerRun);
        });
    });
  }

  const startCamera = () => {
    if (startPromiseRef.current || isCameraRunning) {
      return;
    }

    if (!canUseCamera) {
      setCameraError(
        window.isSecureContext ?
          cameraErrorMessages["Browser cannot start the requested camera"]
        : "Camera chỉ hoạt động trên HTTPS hoặc localhost. Vui lòng nhập mã QR thủ công.",
      );
      setScannerState("error");
      return;
    }

    const scannerRun = scannerRunRef.current + 1;
    scannerRunRef.current = scannerRun;
    scannerActiveRef.current = true;
    setCameraError(null);
    setScannerState("requestingPermission");

    const startPromise = (async () => {
      logCameraDiagnostic("start-request", {
        secureContext: window.isSecureContext,
        hasMediaDevices: Boolean(navigator.mediaDevices?.getUserMedia),
      });

      let stream: MediaStream;
      try {
        stream = await openQrCameraStream();
      } catch (error) {
        failCamera(
          error,
          "Browser cannot start the requested camera",
          scannerRun,
        );
        return;
      }

      if (
        scannerRunRef.current !== scannerRun ||
        !scannerActiveRef.current
      ) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        failCamera(
          new Error("Video element is not mounted"),
          "Camera stream started but video playback failed",
          scannerRun,
        );
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;

      logCameraDiagnostic("stream-attached", {
        selectedCameraLabel: stream.getVideoTracks()[0]?.label ?? null,
        streamActive: stream.active,
        readyState: video.readyState,
      });

      try {
        await waitForVideoMetadata(video, (cancelListener) => {
          metadataCancelRef.current = cancelListener;
        });
        await video.play();
      } catch (error) {
        failCamera(
          error,
          "Camera stream started but video playback failed",
          scannerRun,
        );
        return;
      }

      if (scannerRunRef.current !== scannerRun) {
        return;
      }

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        failCamera(
          new Error("Video dimensions are zero after playback started"),
          "Camera stream started but video playback failed",
          scannerRun,
        );
        return;
      }

      let detector: ReturnType<typeof createQrFrameDetector>;
      try {
        detector = createQrFrameDetector();
        detectorRef.current = detector;
      } catch (error) {
        failCamera(error, "QR scanner initialization failed", scannerRun);
        return;
      }

      startPromiseRef.current = null;
      setScannerState("active");
      logCameraDiagnostic("play-success", {
        selectedCameraLabel: stream.getVideoTracks()[0]?.label ?? null,
        streamActive: stream.active,
        readyState: video.readyState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
      });
      scheduleDecode(video, detector, scannerRun);
    })();

    startPromiseRef.current = startPromise;
  };

  useEffect(() => {
    return () => {
      stopScanner("component-unmount");
    };
  }, [stopScanner]);

  return (
    <Flex vertical gap={12}>
      {isCameraRunning && (
        <Flex vertical gap={8}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: "100%",
              minHeight: 220,
              aspectRatio: "4 / 3",
              borderRadius: 8,
              background: "#000",
              objectFit: "cover",
            }}
          />
          <Typography.Text type="secondary">
            Đưa camera vào mã QR của trạm.
          </Typography.Text>
        </Flex>
      )}
      <Input
        autoFocus
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <Button
        icon={<CameraOutlined />}
        disabled={!canUseCamera && scannerState !== "error"}
        loading={scannerState === "requestingPermission"}
        onClick={() => {
          if (isCameraRunning) {
            stopScanner("user-stop");
            setScannerState("idle");
            return;
          }

          startCamera();
        }}>
        {isCameraRunning ? "Stop Camera" : "Scan with Camera"}
      </Button>
      {!canUseCamera && (
        <Alert
          type="warning"
          showIcon
          description="Camera chỉ hoạt động khi trình duyệt cho phép getUserMedia, thường là HTTPS hoặc localhost. Bạn vẫn có thể nhập mã QR thủ công."
        />
      )}
      {cameraError && <Alert type="error" showIcon description={cameraError} />}
    </Flex>
  );
}
