import {CameraOutlined, LockOutlined, QrcodeOutlined, UserOutlined} from "@ant-design/icons";
import {
  Alert,
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
import {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useMovementStore} from "../store";
import {loginTeam, loginTeamWithQr, loginUser} from "../api";
import logo from "../../../assets/ST-logo.png";

type LoginFormValues = {
  username: string;
  password: string;
};

type ParsedQrLoginPayload =
  | {kind: "credentials"; credentials: LoginFormValues}
  | {kind: "teamQr"; qrToken: string};

type DetectedBarcode = {
  rawValue: string;
};

type BarcodeDetectorInstance = {
  detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>;
};

type BarcodeDetectorConstructor = {
  new (options?: {formats?: string[]}): BarcodeDetectorInstance;
};

function mapBackendRole(role: string) {
  return role === "ADMIN" ? "admin" : role === "SYSTEM_ADMIN" ? "system-admin" : "user";
}

function parseQrLoginPayload(rawValue: string): ParsedQrLoginPayload | null {
  const value = rawValue.trim();
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<LoginFormValues> & {
      qrToken?: string;
      token?: string;
      loginQrToken?: string;
      u?: string;
      p?: string;
    };
    const qrToken = parsed.qrToken ?? parsed.loginQrToken ?? parsed.token;
    if (qrToken) {
      return {kind: "teamQr", qrToken};
    }

    const username = parsed.username ?? parsed.u;
    const password = parsed.password ?? parsed.p;
    if (username && password) {
      return {kind: "credentials", credentials: {username, password}};
    }
  } catch {
    // Plain text QR payloads are handled below.
  }

  if (/^MV26-TEAM-\d{2}-LOGIN$/i.test(value)) {
    return {kind: "teamQr", qrToken: value};
  }

  const separator = value.includes(":") ? ":" : value.includes("/") ? "/" : null;
  if (!separator) {
    return null;
  }

  const [username, password] = value.split(separator).map((part) => part.trim());
  return username && password
    ? {kind: "credentials", credentials: {username, password}}
    : null;
}

function getBarcodeDetector() {
  return (window as Window & {BarcodeDetector?: BarcodeDetectorConstructor})
    .BarcodeDetector;
}

export function LoginPage() {
  const navigate = useNavigate();
  const login = useMovementStore((state) => state.login);
  const session = useMovementStore((state) => state.session);
  const [form] = Form.useForm<LoginFormValues>();
  const {message} = AntdApp.useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanningQr, setIsScanningQr] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  const stopQrScanner = () => {
    if (scanTimerRef.current !== null) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsScanningQr(false);
  };

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
        message.success("Login successful");
        navigate("/stations");
        return;
      } catch {
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
    const parsed = parseQrLoginPayload(rawValue);
    if (!parsed) {
      message.error("QR code must contain a team QR token or username/password credentials");
      return;
    }

    stopQrScanner();
    if (parsed.kind === "credentials") {
      form.setFieldsValue(parsed.credentials);
      window.setTimeout(() => form.submit(), 0);
      return;
    }

    setIsSubmitting(true);
    try {
      const teamResponse = await loginTeamWithQr(parsed.qrToken, "web-qr");
      login({
        username: teamResponse.team.username,
        role: "user",
        teamId: String(teamResponse.team.id),
        accessToken: teamResponse.accessToken,
      });
      message.success("QR login successful");
      navigate("/stations");
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Invalid team QR token";
      message.error(messageText || "Invalid team QR token");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startQrScanner = async () => {
    const BarcodeDetector = getBarcodeDetector();
    if (!BarcodeDetector || !navigator.mediaDevices?.getUserMedia) {
      message.error("This browser does not support camera QR scanning");
      return;
    }

    setIsScanningQr(true);
    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    const video = videoRef.current;
    if (!video) {
      setIsScanningQr(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: "environment"},
      });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      const detector = new BarcodeDetector({formats: ["qr_code"]});
      scanTimerRef.current = window.setInterval(async () => {
        const codes = await detector.detect(video);
        const firstCode = codes[0]?.rawValue;
        if (firstCode) {
          void submitQrPayload(firstCode);
        }
      }, 500);
    } catch (error) {
      stopQrScanner();
      const messageText =
        error instanceof Error ? error.message : "Unable to start camera";
      message.error(messageText);
    }
  };

  useEffect(() => {
    if (session) {
      navigate("/stations", {replace: true});
    }
  }, [navigate, session]);

  useEffect(() => stopQrScanner, []);

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

          <Alert
            type="info"
            showIcon
            description={
              <Flex vertical gap={4}>
                <Typography.Text strong>Demo Account</Typography.Text>
                <Typography.Text>
                  Example teams use unique QR login tokens or `team01/team01` through `team25/team25`.
                  Admin account is `admin/admin123`.
                </Typography.Text>
              </Flex>
            }
          />

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
                    "Paste QR payload, for example MV26-TEAM-01-LOGIN",
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
