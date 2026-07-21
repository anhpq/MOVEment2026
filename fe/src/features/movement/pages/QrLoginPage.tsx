import {Button, Result, Spin, Typography} from "antd";
import {useEffect, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {loginWithQrToken} from "../api";
import {fetchPlayerDatabase, preloadPlayerMapImage} from "../playerData";
import {useMovementStore} from "../store";

type QrLoginState =
  | {type: "loading"; message: string}
  | {type: "error"; title: string; description: string; canRetry: boolean}
  | {type: "conflict"};

function extractQrToken(search: string) {
  return new URLSearchParams(search).get("token")?.trim() ?? "";
}

function getQrLoginError(error: unknown): QrLoginState {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("QR_LOGIN_EXPIRED")) {
    return {
      type: "error",
      title: "Mã QR đã hết hạn.",
      description: "Vui lòng liên hệ ban tổ chức để nhận mã QR mới.",
      canRetry: false,
    };
  }
  if (message.includes("QR_LOGIN_CONSUMED")) {
    return {
      type: "error",
      title: "Mã QR đã được sử dụng.",
      description: "Mỗi mã QR đăng nhập chỉ có thể sử dụng theo giới hạn đã cấu hình.",
      canRetry: false,
    };
  }
  if (message.includes("QR_LOGIN_REVOKED")) {
    return {
      type: "error",
      title: "Mã QR đã bị thu hồi.",
      description: "Vui lòng liên hệ ban tổ chức để nhận mã QR mới.",
      canRetry: false,
    };
  }
  if (message.includes("QR_LOGIN_INACTIVE_TEAM")) {
    return {
      type: "error",
      title: "Tài khoản đội không hoạt động.",
      description: "Vui lòng liên hệ ban tổ chức để kiểm tra trạng thái đội.",
      canRetry: false,
    };
  }
  if (message.includes("QR_LOGIN_RATE_LIMITED")) {
    return {
      type: "error",
      title: "Thử quá nhiều lần.",
      description: "Vui lòng chờ một lúc rồi thử lại.",
      canRetry: true,
    };
  }
  if (message.includes("QR_LOGIN_INVALID")) {
    return {
      type: "error",
      title: "Mã QR không hợp lệ.",
      description: "Vui lòng kiểm tra lại mã QR hoặc liên hệ ban tổ chức.",
      canRetry: false,
    };
  }

  return {
    type: "error",
    title: "Không thể xác thực mã QR.",
    description: "Vui lòng kiểm tra kết nối mạng rồi thử lại.",
    canRetry: true,
  };
}

export function QrLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const login = useMovementStore((state) => state.login);
  const loadDatabase = useMovementStore((state) => state.loadDatabase);
  const session = useMovementStore((state) => state.session);
  const initialToken = extractQrToken(location.search);
  const tokenRef = useRef(initialToken);
  const submittedRef = useRef(false);
  const inFlightRef = useRef(false);
  const [state, setState] = useState<QrLoginState>(() =>
    initialToken
      ? {type: "loading", message: "Đang xác thực mã QR..."}
      : {
          type: "error",
          title: "Liên kết QR không hợp lệ.",
          description: "Liên kết này thiếu mã xác thực QR.",
          canRetry: false,
        },
  );

  useEffect(() => {
    if (location.search) {
      window.history.replaceState(null, "", "/qr-login");
    }
  }, [location.search]);

  const submitQrLogin = async () => {
    const token = tokenRef.current;
    if (!token) {
      submittedRef.current = true;
      return;
    }
    if (inFlightRef.current) {
      return;
    }
    if (session) {
      submittedRef.current = true;
      setState({type: "conflict"});
      return;
    }

    submittedRef.current = true;
    inFlightRef.current = true;
    setState({type: "loading", message: "Đang xác thực mã QR..."});

    const controller = new AbortController();
    try {
      const teamResponse = await loginWithQrToken(
        token,
        "web-qr-url",
        controller.signal,
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
        // ProtectedRoute will retry player data on the authenticated screen.
      }
      navigate("/stations/map", {replace: true});
    } catch (error) {
      inFlightRef.current = false;
      setState(getQrLoginError(error));
    }
  };

  useEffect(() => {
    if (!submittedRef.current) {
      void submitQrLogin();
    }
  });

  if (state.type === "conflict") {
    return (
      <div className="login-screen">
        <Result
          status="warning"
          title="Bạn đang đăng nhập."
          subTitle="Hãy đăng xuất tài khoản hiện tại trước khi dùng mã QR của đội khác."
          extra={<Button onClick={() => navigate("/stations/map")}>Quay lại</Button>}
        />
      </div>
    );
  }

  if (state.type === "loading") {
    return (
      <div className="login-screen">
        <Spin size="large">
          <Typography.Title level={4}>{state.message}</Typography.Title>
        </Spin>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <Result
        status="error"
        title={state.title}
        subTitle={state.description}
        extra={
          state.canRetry ? (
            <Button
              type="primary"
              onClick={() => {
                submittedRef.current = false;
                void submitQrLogin();
              }}
            >
              Thử lại
            </Button>
          ) : (
            <Button type="primary" onClick={() => navigate("/login")}>
              Về trang đăng nhập
            </Button>
          )
        }
      />
    </div>
  );
}
