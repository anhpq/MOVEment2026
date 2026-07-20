import {CameraOutlined} from "@ant-design/icons";
import {Alert, Button, Flex, Input, Typography} from "antd";
import {useEffect, useRef, useState} from "react";

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{rawValue?: string}>>;
};

type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorLike;

type QrTokenInputProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}>;

function getBarcodeDetector(): BarcodeDetectorConstructor | null {
  const candidate = (globalThis as typeof globalThis & {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }).BarcodeDetector;

  return candidate ?? null;
}

export function QrTokenInput({value, onChange, placeholder}: QrTokenInputProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const canUseBarcodeDetector = Boolean(getBarcodeDetector());

  useEffect(() => {
    if (!isCameraOpen || !canUseBarcodeDetector) {
      return;
    }

    let cancelled = false;
    let animationFrame = 0;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {facingMode: "environment"},
        });
        streamRef.current = stream;

        if (!videoRef.current) {
          return;
        }

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const Detector = getBarcodeDetector();
        if (!Detector) {
          return;
        }

        const detector = new Detector({formats: ["qr_code"]});
        const scan = async () => {
          if (cancelled || !videoRef.current) {
            return;
          }

          const [result] = await detector.detect(videoRef.current);
          if (result?.rawValue) {
            onChange(result.rawValue);
            setIsCameraOpen(false);
            return;
          }

          animationFrame = requestAnimationFrame(() => {
            void scan();
          });
        };

        void scan();
      } catch (error) {
        setCameraError(
          error instanceof Error ? error.message : "Cannot open camera",
        );
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [canUseBarcodeDetector, isCameraOpen, onChange]);

  return (
    <Flex vertical gap={12}>
      <Input
        autoFocus
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <Button
        icon={<CameraOutlined />}
        disabled={!canUseBarcodeDetector}
        onClick={() => {
          setCameraError(null);
          setIsCameraOpen((current) => !current);
        }}>
        {isCameraOpen ? "Stop Camera" : "Scan with Camera"}
      </Button>
      {!canUseBarcodeDetector && (
        <Alert
          type="warning"
          showIcon
          description="This browser does not expose QR camera scanning, so enter the decoded token manually."
        />
      )}
      {cameraError && <Alert type="error" showIcon description={cameraError} />}
      {isCameraOpen && (
        <Flex vertical gap={8}>
          <video
            ref={videoRef}
            muted
            playsInline
            style={{width: "100%", borderRadius: 8, background: "#000"}}
          />
          <Typography.Text type="secondary">
            Point the camera at the station QR code.
          </Typography.Text>
        </Flex>
      )}
    </Flex>
  );
}
