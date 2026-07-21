import {CameraOutlined, LockOutlined, QrcodeOutlined, UserOutlined} from "@ant-design/icons";
import {
  App as AntdApp,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Space,
  Typography,
  Image,
} from "antd";
import {useCallback, useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useMovementStore} from "../store";
import {isAuthFailure, loginTeam, loginTeamWithQr, loginUser, loginWithQrToken} from "../api";
import {fetchPlayerDatabase, preloadPlayerMapImage} from "../playerData";
import {
  createQrFrameDetector,
  openQrCameraStream,
  supportsCameraQrScan,
} from "../qrDetect";
import logo from "../../../assets/ST-logo.png";

type LoginFormValues = {
  username: string;
  password: string;
};

function mapBackendRole(role: string) {
  return role === "ADMIN" ? "admin" : "user";
}

function parseQrLoginPayload(rawValue: string): {type: "url"; token: string} | {type: "legacy"; token: string} | null {
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
  const scanRunRef = useRef(0);
  const qrSubmittingRef = useRef(false);

  const stopQrScanner = useCallback(() => {
    scanRunRef.current += 1;
    if (scanTimerRef.current !== null) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (scanFrameRef.current !== null) {
      window.cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsScanningQr(false);
  }, []);

  const submitLogin = async (values: LoginFormValues) => {
    const username = values.username.trim();
    const password = values.password.trim();

    setIsSubmitting(true);
    try {
      try {
        const teamResponse = await loginTeam(
          username,
          password,
          "web",
        );
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
          message.warning("Login succeeded. Player data will retry on the next screen.");
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
        error instanceof Error
          ? error.message
          : "Invalid username or password";
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
        qrPayload.type === "url"
          ? await loginWithQrToken(qrPayload.token, "web-qr")
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
        message.warning("Login succeeded. Player data will retry on the next screen.");
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
    setIsScanningQr(true);
    await new Promise<void>((resolve) => {
      scanFrameRef.current = window.requestAnimationFrame(() => {
        scanFrameRef.current = null;
        resolve();
      });
    });

    if (scanRunRef.current !== scanRun) {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      setIsScanningQr(false);
      return;
    }

    try {
      const stream = await openQrCameraStream();
      if (scanRunRef.current !== scanRun) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      const detector = createQrFrameDetector();
      let isDetecting = false;
      scanTimerRef.current = window.setInterval(() => {
        if (
          isDetecting ||
          qrSubmittingRef.current ||
          scanRunRef.current !== scanRun
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
              scanRunRef.current === scanRun
            ) {
              void submitQrPayload(firstCode);
            }
          })
          .catch((error: unknown) => {
            if (scanRunRef.current === scanRun) {
              stopQrScanner();
              const messageText =
                error instanceof Error ? error.message : "Unable to scan QR code";
              message.error(messageText);
            }
          })
          .finally(() => {
            isDetecting = false;
          });
      }, 500);
    } catch (error) {
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

  useEffect(() => stopQrScanner, [stopQrScanner]);

  return (
    <div className="login-screen">
      <Card className="surface-card login-card">
        <Flex vertical gap={18} className="full-width">
          <div>
            <Image
              src={logo}
              alt="MOVEment 2026"
              preview={false}
              className="login-logo"
            />
            <Typography.Title level={2} className="login-title">
              MOVEment 2026
            </Typography.Title>
          </div>

          <Flex vertical gap={10}>
            <Space.Compact block>
              <Button
                icon={<CameraOutlined />}
                onClick={startQrScanner}
                disabled={isScanningQr || isSubmitting}
              >
                Scan QR login
              </Button>
              <Button
                icon={<QrcodeOutlined />}
                onClick={() => {
                  const payload = window.prompt(
                    "Paste the team QR login token",
                  );
                  if (payload) {
                    void submitQrPayload(payload);
                  }
                }}
                disabled={isSubmitting}
              >
                Paste QR
              </Button>
            </Space.Compact>
            {isScanningQr ? (
              <div className="qr-scanner-panel">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className="qr-scanner-video"
                />
                <Button onClick={stopQrScanner}>Stop scanner</Button>
              </div>
            ) : null}
          </Flex>

          <Form
            form={form}
            layout="vertical"
            onFinish={submitLogin}>
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
              <Input.Password prefix={<LockOutlined />} placeholder="••••••" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={isSubmitting}
            >
              Login
            </Button>
          </Form>
        </Flex>
      </Card>
    </div>
  );
}
