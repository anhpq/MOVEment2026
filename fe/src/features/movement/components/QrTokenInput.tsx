import {CameraOutlined} from "@ant-design/icons";
import {Alert, Button, Flex, Input, Typography} from "antd";
import {useEffect, useRef, useState} from "react";
import {
  createQrFrameDetector,
  openQrCameraStream,
  supportsCameraQrScan,
} from "../qrDetect";

type QrTokenInputProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}>;

export function QrTokenInput({value, onChange, placeholder}: QrTokenInputProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const canUseCamera = supportsCameraQrScan();

  useEffect(() => {
    if (!isCameraOpen || !canUseCamera) {
      return;
    }

    let cancelled = false;
    let animationFrame = 0;
    let videoElement: HTMLVideoElement | null = null;

    const startCamera = async () => {
      try {
        const stream = await openQrCameraStream();
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;

        videoElement = videoRef.current;
        if (!videoElement) {
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          return;
        }

        videoElement.srcObject = stream;
        await videoElement.play();

        const detector = createQrFrameDetector();
        const scan = async () => {
          if (cancelled || !videoElement) {
            return;
          }

          try {
            const result = await detector.detect(videoElement);
            if (result) {
              cancelled = true;
              onChange(result);
              setIsCameraOpen(false);
              return;
            }
          } catch (error) {
            if (!cancelled) {
              setCameraError(
                error instanceof Error ? error.message : "Cannot scan QR code",
              );
              setIsCameraOpen(false);
            }
            return;
          }

          animationFrame = requestAnimationFrame(() => {
            void scan();
          });
        };

        void scan();
      } catch (error) {
        if (!cancelled) {
          setCameraError(
            error instanceof Error ? error.message : "Cannot open camera",
          );
          setIsCameraOpen(false);
        }
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      if (videoElement) {
        videoElement.pause();
        videoElement.srcObject = null;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [canUseCamera, isCameraOpen, onChange]);

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
        disabled={!canUseCamera}
        onClick={() => {
          setCameraError(null);
          setIsCameraOpen((current) => !current);
        }}>
        {isCameraOpen ? "Stop Camera" : "Scan with Camera"}
      </Button>
      {!canUseCamera && (
        <Alert
          type="warning"
          showIcon
          description="Camera scanning requires browser camera access, usually HTTPS or localhost. Enter the decoded token manually if camera access is unavailable."
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
