import {
  ClockCircleOutlined,
  CrownFilled,
  QrcodeOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import {Card, Empty, List, Typography} from "antd";
import {useEffect, useState} from "react";
import {getLeaderboard, type LeaderboardEntryResponse} from "../api";
import {useMovementStore} from "../store";
import "./LeaderboardPage.css";

export function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardEntryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void getLeaderboard()
      .then((entries) => {
        if (!cancelled) setRows(entries);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
          <Typography.Title level={2}>Leaderboard</Typography.Title>
        </div>
        <span className="leaderboard-team-count">{rows.length} teams</span>
      </header>

      <List
        className="leaderboard-list"
        loading={isLoading}
        dataSource={rows}
        locale={{emptyText: <Empty description="No ranking data" />}}
        renderItem={(row) => (
          <List.Item
            className={`leaderboard-row rank-${Math.min(row.rank, 4)} ${
              row.teamName === playerTeamName ? "is-current-team" : ""
            }`}>
            <div className="leaderboard-rank" aria-label={`Rank ${row.rank}`}>
              {row.rank === 1 && <CrownFilled className="rank-crown" />}
              <span>{row.rank}</span>
            </div>

            <div className="leaderboard-team">
              <div className="leaderboard-team-name">
                <Typography.Text strong>{row.teamName}</Typography.Text>
                {row.teamName === playerTeamName && (
                  <span className="current-team-badge">Your team</span>
                )}
              </div>
              <div className="leaderboard-meta">
                <span>
                  <QrcodeOutlined />
                  {row.completedStations} stations
                </span>
                <span>
                  <ClockCircleOutlined />
                  {Math.round(row.totalPlaySeconds / 60)} min
                </span>
              </div>
            </div>

            <div className="leaderboard-points">
              <strong>{row.totalPoints}</strong>
              <span>pts</span>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
}
