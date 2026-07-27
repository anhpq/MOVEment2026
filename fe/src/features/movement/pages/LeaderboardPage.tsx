import {
  ClockCircleOutlined,
  CrownFilled,
  QrcodeOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import {Card, Empty, List, Typography} from "antd";
import {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {
  getLeaderboard,
  isAuthFailure,
  type LeaderboardEntryResponse,
} from "../api";
import {useMovementStore} from "../store";
import {getLocalizedTeamName} from "../utils";
import "./LeaderboardPage.css";

export function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardEntryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const {i18n, t} = useTranslation();
  const logout = useMovementStore((state) => state.logout);
  const language = i18n.language === "en" ? "en" : "vi";

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      if (
        cancelled ||
        isFetchingRef.current ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      isFetchingRef.current = true;
      try {
        const entries = await getLeaderboard();
        if (!cancelled) {
          setRows(entries);
        }
      } catch (error: unknown) {
        if (!cancelled && isAuthFailure(error)) {
          logout();
        }
      } finally {
        isFetchingRef.current = false;
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [logout]);

  const playerTeamName = useMovementStore((state) => {
    if (state.session?.role !== "user") {
      return undefined;
    }
    const activeTeamId = state.activeTeamId;
    return state.teams.find((team) => team.id === activeTeamId)?.name;
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
              row.teamName === playerTeamName ? "is-current-team" : ""
            }`}>
            <div className="leaderboard-rank" aria-label={`${t("common.rank")} ${row.rank}`}>
              {row.rank === 1 && <CrownFilled className="rank-crown" />}
              <span>{row.rank}</span>
            </div>

            <div className="leaderboard-team">
              <div className="leaderboard-team-name">
                <Typography.Text strong>{displayTeamName}</Typography.Text>
                {row.teamName === playerTeamName && (
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
