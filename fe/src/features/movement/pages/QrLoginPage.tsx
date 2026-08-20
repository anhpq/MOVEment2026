import {Button, Result, Spin, Typography} from "antd";
import {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {useLocation, useNavigate} from "react-router-dom";
import {ApiError, loginWithQrToken} from "../api";
import {LanguageSwitch} from "../components/LanguageSwitch";
import {fetchPlayerDatabase} from "../playerData";
import {useMovementStore} from "../store";

type QrLoginState =
  | {type: "loading"; message: string}
  | {type: "error"; title: string; description: string; canRetry: boolean};

function extractQrToken(search: string) {
  return new URLSearchParams(search).get("token")?.trim() ?? "";
}

function getQrLoginError(error: unknown, t: (key: string) => string): QrLoginState {
  const errorCode =
    error instanceof ApiError ? error.backendCode ?? error.reason : null;

  if (errorCode === "QR_LOGIN_CONSUMED") {
    return {
      type: "error",
      title: t("qrLogin.consumedTitle"),
      description: t("qrLogin.consumedDescription"),
      canRetry: false,
    };
  }
  if (errorCode === "QR_LOGIN_REVOKED") {
    return {
      type: "error",
      title: t("qrLogin.revokedTitle"),
      description: t("qrLogin.revokedDescription"),
      canRetry: false,
    };
  }
  if (errorCode === "QR_LOGIN_INACTIVE_TEAM") {
    return {
      type: "error",
      title: t("qrLogin.inactiveTitle"),
      description: t("qrLogin.inactiveDescription"),
      canRetry: false,
    };
  }
  if (errorCode === "QR_LOGIN_RATE_LIMITED") {
    return {
      type: "error",
      title: t("qrLogin.rateLimitedTitle"),
      description: t("qrLogin.rateLimitedDescription"),
      canRetry: true,
    };
  }
  if (errorCode === "QR_LOGIN_INVALID") {
    return {
      type: "error",
      title: t("qrLogin.invalidTitle"),
      description: t("qrLogin.invalidDescription"),
      canRetry: false,
    };
  }

  return {
    type: "error",
    title: t("qrLogin.genericTitle"),
    description: t("qrLogin.genericDescription"),
    canRetry: true,
  };
}

export function QrLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {t, i18n} = useTranslation();
  const login = useMovementStore((state) => state.login);
  const loadDatabase = useMovementStore((state) => state.loadDatabase);
  const initialToken = extractQrToken(location.search);
  const tokenRef = useRef(initialToken);
  const submittedRef = useRef(false);
  const inFlightRef = useRef(false);
  const [state, setState] = useState<QrLoginState>(() =>
    initialToken
      ? {type: "loading", message: t("qrLogin.loading")}
      : {
          type: "error",
          title: t("qrLogin.missingTitle"),
          description: t("qrLogin.missingDescription"),
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
    submittedRef.current = true;
    inFlightRef.current = true;
    setState({type: "loading", message: t("qrLogin.loading")});

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
        expiresAt: teamResponse.expiresAt,
      });
      try {
        loadDatabase(await fetchPlayerDatabase(i18n.language === "en" ? "en" : "vi"));
      } catch {
        // ProtectedRoute will retry player data on the authenticated screen.
      }
      navigate("/team/v2", {replace: true});
    } catch (error) {
      inFlightRef.current = false;
      setState(getQrLoginError(error, t));
    }
  };

  useEffect(() => {
    if (!submittedRef.current) {
      void submitQrLogin();
    }
  });

  if (state.type === "loading") {
    return (
      <div className="login-screen">
        <LanguageSwitch />
        <Spin size="large">
          <Typography.Title level={4}>{state.message}</Typography.Title>
        </Spin>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <LanguageSwitch />
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
              {t("qrLogin.retry")}
            </Button>
          ) : (
            <Button type="primary" onClick={() => navigate("/login")}>
              {t("qrLogin.login")}
            </Button>
          )
        }
      />
    </div>
  );
}
