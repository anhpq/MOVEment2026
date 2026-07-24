import {
  CameraOutlined,
  LockOutlined,
  QrcodeOutlined,
  StopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App as AntdApp,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Typography,
  Divider,
} from "antd";
import {useCallback, useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useMovementStore} from "../store";
import {
  isAuthFailure,
  loginTeam,
  loginTeamWithQr,
  loginUser,
  loginWithQrToken,
} from "../api";
import {fetchPlayerDatabase, preloadPlayerMapImage} from "../playerData";
import {
  createQrFrameDetector,
  openQrCameraStream,
  supportsCameraQrScan,
} from "../qrDetect";
import {RunningPersonIcon} from "../components/RunningPersonIcon";
import type {QrFrameDetector} from "../qrDetect";

type LoginFormValues = {
  username: string;
  password: string;
};

function mapBackendRole(role: string) {
  return role === "ADMIN" ? "admin" : "user";
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

function parseQrLoginPayload(
  rawValue: string,
): {type: "url"; token: string} | {type: "legacy"; token: string} | null {
  const value = rawValue.trim();
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const token = url.searchParams.get("token")?.trim();
    if (url.pathname === "/qr-login" && token) {
      return {type: "url", token};
    }
  } catch {
    // Non-URL QR payloads are handled below.
  }

  try {
    const parsed = JSON.parse(value) as {
      qrToken?: string;
      token?: string;
      loginQrToken?: string;
    };
    const qrToken = parsed.qrToken ?? parsed.loginQrToken ?? parsed.token;
    if (qrToken) {
      return {type: "legacy", token: qrToken.trim()};
    }
  } catch {
    // Plain text QR payloads are handled below.
  }

  if (/^MV26-TEAM-\d{2}-LOGIN$/i.test(value)) {
    return {type: "legacy", token: value};
  }
  return null;
}

export function LoginPage() {
  const navigate = useNavigate();
  const login = useMovementStore((state) => state.login);
  const loadDatabase = useMovementStore((state) => state.loadDatabase);
  const session = useMovementStore((state) => state.session);
  const [form] = Form.useForm<LoginFormValues>();
  const {message} = AntdApp.useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanningQr, setIsScanningQr] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const scanFrameRef = useRef<number | null>(null);
  const scanFrameResolveRef = useRef<(() => void) | null>(null);
  const metadataCancelRef = useRef<(() => void) | null>(null);
  const detectorRef = useRef<QrFrameDetector | null>(null);
  const scannerActiveRef = useRef(false);
  const scanRunRef = useRef(0);
  const qrSubmittingRef = useRef(false);
  const isMountedRef = useRef(false);

  const stopQrScanner = useCallback((updateState = true) => {
    scanRunRef.current += 1;
    scannerActiveRef.current = false;
    if (scanTimerRef.current !== null) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (scanFrameRef.current !== null) {
      window.cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }
    if (scanFrameResolveRef.current) {
      scanFrameResolveRef.current();
      scanFrameResolveRef.current = null;
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

    streamRef.current = null;
    if (video) {
      video.pause();
      video.srcObject = null;
      video.removeAttribute("src");
      video.load();
    }

    if (updateState && isMountedRef.current) {
      setIsScanningQr(false);
    }
  }, []);

  const submitLogin = async (values: LoginFormValues) => {
    const username = values.username.trim();
    const password = values.password.trim();

    setIsSubmitting(true);
    try {
      try {
        const teamResponse = await loginTeam(username, password, "web");
        login({
          username: teamResponse.team.username,
          role: "user",
          teamId: String(teamResponse.team.id),
          accessToken: teamResponse.accessToken,
        });
        preloadPlayerMapImage();
        try {
          loadDatabase(await fetchPlayerDatabase());
        } catch {
          message.warning(
            "Login succeeded. Player data will retry on the next screen.",
          );
        }
        message.success("Login successful");
        navigate("/stations/map");
        return;
      } catch (error) {
        if (!isAuthFailure(error)) {
          throw error;
        }
        // Fall back to admin/user login if team login fails.
      }

      const userResponse = await loginUser(username, password);
      login({
        username: userResponse.user.username,
        role: mapBackendRole(userResponse.user.role),
        teamId: null,
        accessToken: userResponse.accessToken,
      });
      message.success("Login successful");
      navigate("/stations");
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Invalid username or password";
      message.error(messageText || "Invalid username or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitQrPayload = async (rawValue: string) => {
    if (qrSubmittingRef.current) {
      return;
    }

    const qrPayload = parseQrLoginPayload(rawValue);
    if (!qrPayload) {
      message.error("QR code must contain a valid login URL or team QR token");
      return;
    }

    qrSubmittingRef.current = true;
    stopQrScanner();
    setIsSubmitting(true);
    try {
      const teamResponse =
        qrPayload.type === "url" ?
          await loginWithQrToken(qrPayload.token, "web-qr")
        : await loginTeamWithQr(qrPayload.token, "web-qr");
      login({
        username: teamResponse.team.username,
        role: "user",
        teamId: String(teamResponse.team.id),
        accessToken: teamResponse.accessToken,
      });
      preloadPlayerMapImage();
      try {
        loadDatabase(await fetchPlayerDatabase());
      } catch {
        message.warning(
          "Login succeeded. Player data will retry on the next screen.",
        );
      }
      message.success("QR login successful");
      navigate("/stations/map");
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Invalid team QR token";
      message.error(messageText || "Invalid team QR token");
    } finally {
      qrSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const startQrScanner = async () => {
    if (!supportsCameraQrScan()) {
      message.error(
        "This browser does not support camera QR scanning. Use Paste QR or open the site over HTTPS.",
      );
      return;
    }

    const scanRun = scanRunRef.current + 1;
    scanRunRef.current = scanRun;
    scannerActiveRef.current = true;
    setIsScanningQr(true);
    await new Promise<void>((resolve) => {
      scanFrameResolveRef.current = resolve;
      scanFrameRef.current = window.requestAnimationFrame(() => {
        scanFrameRef.current = null;
        scanFrameResolveRef.current = null;
        resolve();
      });
    });

    if (scanRunRef.current !== scanRun || !scannerActiveRef.current) {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      stopQrScanner();
      return;
    }

    try {
      const stream = await openQrCameraStream();
      if (scanRunRef.current !== scanRun || !scannerActiveRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      video.srcObject = stream;
      await waitForVideoMetadata(video, (cancelListener) => {
        metadataCancelRef.current = cancelListener;
      });
      await video.play();
      if (scanRunRef.current !== scanRun || !scannerActiveRef.current) {
        return;
      }

      const detector = createQrFrameDetector();
      detectorRef.current = detector;
      let isDetecting = false;
      scanTimerRef.current = window.setInterval(() => {
        if (
          isDetecting ||
          qrSubmittingRef.current ||
          scanRunRef.current !== scanRun ||
          !scannerActiveRef.current
        ) {
          return;
        }

        isDetecting = true;
        void detector
          .detect(video)
          .then((firstCode) => {
            if (
              firstCode &&
              !qrSubmittingRef.current &&
              scanRunRef.current === scanRun &&
              scannerActiveRef.current
            ) {
              void submitQrPayload(firstCode);
            }
          })
          .catch((error: unknown) => {
            if (scanRunRef.current === scanRun) {
              stopQrScanner();
              const messageText =
                error instanceof Error ?
                  error.message
                : "Unable to scan QR code";
              message.error(messageText);
            }
          })
          .finally(() => {
            isDetecting = false;
          });
      }, 500);
    } catch (error) {
      if (scanRunRef.current !== scanRun || !scannerActiveRef.current) {
        return;
      }
      stopQrScanner();
      const messageText =
        error instanceof Error ? error.message : "Unable to start camera";
      message.error(messageText);
    }
  };

  useEffect(() => {
    if (session && !isSubmitting) {
      navigate(session.role === "user" ? "/stations/map" : "/stations", {
        replace: true,
      });
    }
  }, [isSubmitting, navigate, session]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopQrScanner(false);
    };
  }, [stopQrScanner]);

  return (
    <div className="login-screen">
      <Card className="surface-card login-card">
        <Flex vertical gap={18} className="full-width">
          <div className="login-header">
            <div className="login-runner-mark" aria-hidden="true">
              <RunningPersonIcon />
            </div>
            <Typography.Title level={2} className="brand-title login-title">
              MOVEment 2026
            </Typography.Title>
          </div>

          {!isScanningQr && (
            <Form form={form} layout="vertical" onFinish={submitLogin}>
              <Form.Item
                label="Username"
                name="username"
                rules={[
                  {required: true, message: "Please enter your username"},
                  {min: 3, message: "Username must be at least 3 characters"},
                ]}>
                <Input prefix={<UserOutlined />} placeholder="team.lead" />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  {required: true, message: "Please enter your password"},
                  {min: 5, message: "Password must be at least 5 characters"},
                ]}>
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="••••••"
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={isSubmitting}>
                Login
              </Button>

              <Divider>OR</Divider>
            </Form>
          )}

          <Flex vertical gap={10}>
            {isScanningQr && (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="qr-scanner-video"
              />
            )}
            <Flex
              gap={8}
              justify="center"
              align="center"
              className="full-width">
              <Button
                className="full-width"
                icon={<CameraOutlined />}
                onClick={startQrScanner}
                disabled={isScanningQr || isSubmitting}>
                Scan QR login
              </Button>
              <Button
                className="full-width"
                icon={<QrcodeOutlined />}
                onClick={() => {
                  const payload = window.prompt(
                    "Paste the team QR login token",
                  );
                  if (payload) {
                    void submitQrPayload(payload);
                  }
                }}
                disabled={isSubmitting}>
                Paste QR
              </Button>
            </Flex>
            {isScanningQr ?
              <div className="qr-scanner-panel">
                <Button
                  icon={<StopOutlined />}
                  danger
                  variant="filled"
                  onClick={() => stopQrScanner()}>
                  Stop scanner
                </Button>
              </div>
            : null}
          </Flex>
        </Flex>
      </Card>
    </div>
  );
}
