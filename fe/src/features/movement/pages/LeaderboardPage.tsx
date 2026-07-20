import {Card, List, Tag} from "antd";
import {useEffect, useState} from "react";
import {getLeaderboard, type LeaderboardEntryResponse} from "../api";

export function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardEntryResponse[]>([]);
  useEffect(() => { void getLeaderboard().then(setRows); }, []);
  return <Card title="Leaderboard">
    <List dataSource={rows} renderItem={(row) =>
      <List.Item>
        <List.Item.Meta title={`${row.rank}. ${row.teamName}`}
          description={`${row.completedStations} stations · ${Math.round(row.totalPlaySeconds / 60)} min`} />
        <Tag color="gold">{row.totalPoints} pts</Tag>
      </List.Item>} />
  </Card>;
}
