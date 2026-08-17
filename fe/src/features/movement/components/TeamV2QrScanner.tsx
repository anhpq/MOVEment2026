import {CameraOutlined, CopyOutlined, ReloadOutlined} from "@ant-design/icons";
import {Alert, Button, Flex, Input} from "antd";
import {useCallback, useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {
  createQrFrameDetector,
  getVideoMediaStream,
  normalizeDecodedQrValue,
  openQrCameraStream,
  supportsCameraQrScan,
  type QrFrameDetector,
} from "../qrDetect";
import "./TeamV2QrScanner.css";

const REARM_EMPTY_MS = 600;

type ScannerState = "idle" | "requesting" | "active" | "submitting" | "error";
type ScannerTab = "camera" | "paste";

export type TeamV2QrSubmitResult =
  | Readonly<{status: "accepted"}>
  | Readonly<{status: "rejected"; message: string}>;

type TeamV2QrScannerProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
  onSubmitToken: (token: string) => Promise<TeamV2QrSubmitResult>;
  placeholder: string;
}>;

type CameraErrorKey =
  | "qrScanner.permissionDenied"
  | "qrScanner.noCamera"
  | "qrScanner.cameraInUse"
  | "qrScanner.cannotStart"
  | "qrScanner.playbackFailed"
  | "qrScanner.initFailed"
  | "qrScanner.secureContext";

function getCameraErrorKey(error: unknown, fallback: CameraErrorKey): CameraErrorKey {
  if (!(error instanceof DOMException)) {
    return fallback;
  }

  switch (error.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "qrScanner.permissionDenied";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "qrScanner.noCamera";
    case "NotReadableError":
    case "TrackStartError":
      return "qrScanner.cameraInUse";
    default:
      return "qrScanner.cannotStart";
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

    video.addEventListener("loadedmetadata", handleLoadedMetadata, {once: true});
    video.addEventListener("error", handleError, {once: true});
    setCancelListener(() =>
      cleanup(new Error("Video metadata wait was cancelled")),
    );
  });
}

export function TeamV2QrScanner({
  value,
  onChange,
  onSubmitToken,
  placeholder,
}: TeamV2QrScannerProps) {
  const {t} = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<QrFrameDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const metadataCancelRef = useRef<(() => void) | null>(null);
  const scannerRunRef = useRef(0);
  const mountedRef = useRef(false);
  const submittingRef = useRef(false);
  const blockedTokenRef = useRef<string | null>(null);
  const emptyFrameStartedAtRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  const onSubmitTokenRef = useRef(onSubmitToken);
  const scheduleDecodeRef = useRef<(
    video: HTMLVideoElement,
    detector: QrFrameDetector,
    scannerRun: number,
  ) => void>(() => undefined);
  const [scannerState, setScannerState] = useState<ScannerState>("idle");
  const [cameraErrorKey, setCameraErrorKey] = useState<CameraErrorKey | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ScannerTab>("camera");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onSubmitTokenRef.current = onSubmitToken;
  }, [onSubmitToken]);

  const stopScanner = useCallback(() => {
    scannerRunRef.current += 1;
    submittingRef.current = false;
    blockedTokenRef.current = null;
    emptyFrameStartedAtRef.current = null;

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    metadataCancelRef.current?.();
    metadataCancelRef.current = null;

    detectorRef.current?.dispose();
    detectorRef.current = null;

    const video = videoRef.current;
    const stream =
      streamRef.current ??
      getVideoMediaStream(video);
    stream?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (video) {
      video.pause();
      video.srcObject = null;
      video.removeAttribute("src");
      video.load();
    }
  }, []);

  const failCamera = useCallback((
    errorKey: CameraErrorKey,
    scannerRun: number,
  ) => {
    if (scannerRunRef.current !== scannerRun) {
      return;
    }
    stopScanner();
    if (!mountedRef.current) {
      return;
    }
    setCameraErrorKey(errorKey);
    setScannerState("error");
  }, [stopScanner]);

  const submitToken = useCallback(async (
    rawToken: string,
    scannerRun: number,
    source: "camera" | "manual",
  ) => {
    const token = normalizeDecodedQrValue(rawToken);
    if (!token) {
      setSubmissionError(t("teamV2.qrRequired"));
      return;
    }
    if (token === blockedTokenRef.current) {
      return;
    }
    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setSubmissionError(null);
    setScannerState("submitting");
    onChangeRef.current(token);

    let result: TeamV2QrSubmitResult;
    try {
      result = await onSubmitTokenRef.current(token);
    } catch {
      result = {
        status: "rejected",
        message: t("teamV2.qrErrors.generic"),
      };
    }

    submittingRef.current = false;
    if (!mountedRef.current || scannerRunRef.current !== scannerRun) {
      return;
    }

    if (result.status === "accepted") {
      stopScanner();
      return;
    }

    blockedTokenRef.current = token;
    emptyFrameStartedAtRef.current = null;
    setSubmissionError(result.message);

    if (streamRef.current?.active && detectorRef.current && videoRef.current) {
      setScannerState("active");
      scheduleDecodeRef.current(videoRef.current, detectorRef.current, scannerRun);
    } else {
      setScannerState(source === "manual" ? "idle" : "error");
    }
  }, [stopScanner, t]);

  const scheduleDecode = useCallback((
    video: HTMLVideoElement,
    detector: QrFrameDetector,
    scannerRun: number,
  ) => {
    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      if (
        scannerRunRef.current !== scannerRun ||
        !streamRef.current?.active ||
        submittingRef.current
      ) {
        return;
      }

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        scheduleDecodeRef.current(video, detector, scannerRun);
        return;
      }

      void detector.detect(video)
        .then((rawValue) => {
          if (scannerRunRef.current !== scannerRun) {
            return;
          }

          const token = rawValue ? normalizeDecodedQrValue(rawValue) : "";
          if (!token) {
            if (blockedTokenRef.current) {
              const now = performance.now();
              emptyFrameStartedAtRef.current ??= now;
              if (now - emptyFrameStartedAtRef.current >= REARM_EMPTY_MS) {
                blockedTokenRef.current = null;
                emptyFrameStartedAtRef.current = null;
              }
            }
            scheduleDecodeRef.current(video, detector, scannerRun);
            return;
          }

          emptyFrameStartedAtRef.current = null;
          if (token === blockedTokenRef.current) {
            scheduleDecodeRef.current(video, detector, scannerRun);
            return;
          }

          void submitToken(token, scannerRun, "camera");
        })
        .catch(() => {
          failCamera("qrScanner.initFailed", scannerRun);
        });
    });
  }, [failCamera, submitToken]);

  useEffect(() => {
    scheduleDecodeRef.current = scheduleDecode;
  }, [scheduleDecode]);

  const startCamera = useCallback(async () => {
    stopScanner();
    const scannerRun = scannerRunRef.current;
    setCameraErrorKey(null);
    setSubmissionError(null);

    if (!window.isSecureContext) {
      failCamera("qrScanner.secureContext", scannerRun);
      return;
    }
    if (!supportsCameraQrScan()) {
      failCamera("qrScanner.cannotStart", scannerRun);
      return;
    }

    setScannerState("requesting");
    let stream: MediaStream;
    try {
      stream = await openQrCameraStream();
    } catch (error) {
      failCamera(getCameraErrorKey(error, "qrScanner.cannotStart"), scannerRun);
      return;
    }

    if (!mountedRef.current || scannerRunRef.current !== scannerRun) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    const video = videoRef.current;
    if (!video) {
      stream.getTracks().forEach((track) => track.stop());
      failCamera("qrScanner.playbackFailed", scannerRun);
      return;
    }

    streamRef.current = stream;
    video.srcObject = stream;
    try {
      await waitForVideoMetadata(video, (cancelListener) => {
        metadataCancelRef.current = cancelListener;
      });
      await video.play();
    } catch {
      failCamera("qrScanner.playbackFailed", scannerRun);
      return;
    }

    if (!mountedRef.current || scannerRunRef.current !== scannerRun) {
      return;
    }

    try {
      detectorRef.current = createQrFrameDetector();
    } catch {
      failCamera("qrScanner.initFailed", scannerRun);
      return;
    }

    setScannerState("active");
    scheduleDecodeRef.current(video, detectorRef.current, scannerRun);
  }, [failCamera, stopScanner]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, [stopScanner]);

  useEffect(() => {
    if (activeTab !== "camera") {
      stopScanner();
      return;
    }

    const startFrame = window.requestAnimationFrame(() => {
      void startCamera();
    });
    return () => {
      window.cancelAnimationFrame(startFrame);
      stopScanner();
    };
  }, [activeTab, startCamera, stopScanner]);

  const isCameraRunning =
    scannerState === "requesting" ||
    scannerState === "active" ||
    scannerState === "submitting";

  const selectTab = (tab: ScannerTab) => {
    if (tab === activeTab) {
      return;
    }
    setCameraErrorKey(null);
    setSubmissionError(null);
    if (tab === "paste") {
      stopScanner();
      setScannerState("idle");
    }
    setActiveTab(tab);
  };

  return (
    <div className="team-v2-qr-scanner" data-active-tab={activeTab}>
      <div className="team-v2-qr-scanner__tabs" role="tablist" aria-label={t("teamV2.scanTitle")}>
        <button
          type="button"
          role="tab"
          aria-label={t("teamV2.scanQrTab")}
          aria-selected={activeTab === "camera"}
          className={activeTab === "camera" ? "is-active" : undefined}
          onClick={() => selectTab("camera")}>
          <CameraOutlined />
          <span>{t("teamV2.scanQrTab")}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-label={t("teamV2.pasteQrTab")}
          aria-selected={activeTab === "paste"}
          className={activeTab === "paste" ? "is-active" : undefined}
          onClick={() => selectTab("paste")}>
          <CopyOutlined />
          <span>{t("teamV2.pasteQrTab")}</span>
        </button>
      </div>

      {activeTab === "camera" && <div className="team-v2-qr-scanner__viewport" data-state={scannerState} role="tabpanel">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="team-v2-qr-scanner__video"
        />
        <div className="team-v2-qr-scanner__frame" aria-hidden="true" />
        {(scannerState === "requesting" || scannerState === "submitting") && (
          <span className="team-v2-qr-scanner__status">
            {scannerState === "submitting" ? t("common.loading") : t("teamV2.cameraStarting")}
          </span>
        )}
        {isCameraRunning && scannerState !== "submitting" && (
          <span className="team-v2-qr-scanner__instruction">{t("qrScanner.instruction")}</span>
        )}
        {(cameraErrorKey || submissionError) && (
          <div className="team-v2-qr-scanner__camera-error">
            <Alert
              type="error"
              showIcon
              description={cameraErrorKey ? t(cameraErrorKey) : submissionError}
            />
            {cameraErrorKey && (
              <Button icon={<ReloadOutlined />} onClick={() => void startCamera()}>
                {t("teamV2.retryCamera")}
              </Button>
            )}
          </div>
        )}
      </div>}

      {activeTab === "paste" && (
        <Flex vertical gap={12} className="team-v2-qr-scanner__manual" role="tabpanel">
          <strong>{t("teamV2.manualQrLabel")}</strong>
          {submissionError && <Alert type="error" showIcon description={submissionError} />}
          <Input
            value={value}
            placeholder={placeholder}
            aria-label={t("teamV2.manualQrLabel")}
            onChange={(event) => onChange(event.target.value)}
            onPressEnter={() => {
              void submitToken(value, scannerRunRef.current, "manual");
            }}
          />
          <Button
            type="primary"
            block
            loading={scannerState === "submitting"}
            disabled={scannerState === "submitting"}
            onClick={() => {
              void submitToken(value, scannerRunRef.current, "manual");
            }}>
            {t("teamV2.submitQr")}
          </Button>
        </Flex>
      )}
    </div>
  );
}
