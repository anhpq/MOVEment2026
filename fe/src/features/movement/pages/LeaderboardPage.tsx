import {Card, List, Tag} from "antd";
import {useEffect, useState} from "react";
import {getLeaderboard, type LeaderboardEntryResponse} from "../api";
import {useMovementStore} from "../store";

export function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardEntryResponse[]>([]);
  useEffect(() => {
    void getLeaderboard().then(setRows);
  }, []);
  // Get current login user's team and highlight it in the leaderboard
  const activeTeamName = useMovementStore((state) => {
    const activeTeamId = state.activeTeamId;
    const activeTeam = state.teams.find((team) => team.id === activeTeamId);
    return activeTeam?.name;
  });

  return (
    <Card title="Leaderboard">
      <List
        dataSource={rows}
        renderItem={(row) => (
          <List.Item
            className={
              row.teamName === activeTeamName ? "active-team" : "other-team"
            }>
            <List.Item.Meta
              title={`${row.rank}. ${row.teamName}`}
              description={`${row.completedStations} stations · ${Math.round(row.totalPlaySeconds / 60)} min`}
            />
            <Tag color="gold">{row.totalPoints} pts</Tag>
          </List.Item>
        )}
      />
    </Card>
  );
}
