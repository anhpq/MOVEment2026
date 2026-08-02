import {
  ClockCircleOutlined,
  CrownFilled,
  QrcodeOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import {Alert, Card, Empty, List, Typography} from "antd";
import {useCallback, useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {
  getLeaderboard,
  getPlayerLeaderboard,
  isAuthFailure,
  type LeaderboardEntryResponse,
} from "../api";
import {useMovementStore} from "../store";
import {getLocalizedTeamName} from "../utils";
import {useVisibleOnlinePolling} from "../hooks/useVisibleOnlinePolling";
import "./LeaderboardPage.css";

export function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardEntryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(false);
  const [hasRefreshError, setHasRefreshError] = useState(false);
  const {i18n, t} = useTranslation();
  const logout = useMovementStore((state) => state.logout);
  const sessionRole = useMovementStore((state) => state.session?.role);
  const language = i18n.language === "en" ? "en" : "vi";

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const entries = sessionRole === "admin"
        ? await getLeaderboard()
        : await getPlayerLeaderboard();
      if (mountedRef.current) {
        setRows(entries);
        setHasRefreshError(false);
      }
    } catch (error: unknown) {
      if (mountedRef.current) {
        setHasRefreshError(true);
        if (isAuthFailure(error)) {
          logout();
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [logout, sessionRole]);

  useVisibleOnlinePolling(refresh);

  const playerTeamId = useMovementStore((state) => {
    if (state.session?.role !== "user") {
      return undefined;
    }
    return state.activeTeamId;
  });

  return (
    <Card className="leaderboard-card">
      <header className="leaderboard-heading">
        <span className="leaderboard-heading-icon" aria-hidden="true">
          <TrophyFilled />
        </span>
        <div className="leaderboard-heading-copy">
          <Typography.Title level={2}>{t("leaderboard.title")}</Typography.Title>
        </div>
        <span className="leaderboard-team-count">
          {rows.length} {t("common.teams")}
        </span>
      </header>

      {hasRefreshError && rows.length > 0 && (
        <Alert type="warning" showIcon message={t("leaderboard.staleData")} />
      )}

      <List
        className="leaderboard-list"
        loading={isLoading}
        dataSource={rows}
        locale={{emptyText: <Empty description={t("leaderboard.empty")} />}}
        renderItem={(row) => {
          const displayTeamName = getLocalizedTeamName(row.teamName, language);
          return (
          <List.Item
            className={`leaderboard-row rank-${Math.min(row.rank, 4)} ${
              String(row.teamId) === playerTeamId ? "is-current-team" : ""
            }`}>
            <div className="leaderboard-rank" aria-label={`${t("common.rank")} ${row.rank}`}>
              {row.rank === 1 && <CrownFilled className="rank-crown" />}
              <span>{row.rank}</span>
            </div>

            <div className="leaderboard-team">
              <div className="leaderboard-team-name">
                <Typography.Text strong>{displayTeamName}</Typography.Text>
                {String(row.teamId) === playerTeamId && (
                  <span className="current-team-badge">
                    {t("leaderboard.currentTeam")}
                  </span>
                )}
              </div>
              <div className="leaderboard-meta">
                <span>
                  <QrcodeOutlined />
                  {row.completedStations} {t("common.stations")}
                </span>
                <span>
                  <ClockCircleOutlined />
                  {Math.round(row.totalPlaySeconds / 60)} {t("common.minutes")}
                </span>
              </div>
            </div>

            <div className="leaderboard-points">
              <strong>{row.totalPoints}</strong>
              <span>{t("common.points")}</span>
            </div>
          </List.Item>
          );
        }}
      />
    </Card>
  );
}
