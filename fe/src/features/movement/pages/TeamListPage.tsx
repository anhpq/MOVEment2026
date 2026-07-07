import {Card, Flex, List, Tag, Typography} from "antd";
import {useNavigate} from "react-router-dom";
import {useMovementStore} from "../store";

export function TeamListPage() {
  const navigate = useNavigate();
  const activeTeamId = useMovementStore((state) => state.activeTeamId);
  const teams = useMovementStore((state) => state.teams);
  const setActiveTeam = useMovementStore((state) => state.setActiveTeam);

  const sortedTeams = [...teams].sort((left, right) => {
    if (right.finish !== left.finish) {
      return right.finish - left.finish;
    }

    if (left.totalTimeMinutes !== right.totalTimeMinutes) {
      return left.totalTimeMinutes - right.totalTimeMinutes;
    }

    return left.name.localeCompare(right.name, "vi");
  });

  return (
    <Flex vertical gap={16} className="full-width">
      <Card className="surface-card compact-card">
        <Typography.Title level={3} className="section-title">
          Guide
        </Typography.Title>
        <Typography.Text className="muted-copy compact-copy">
          Select a team to reopen the Station List screen for that team.
        </Typography.Text>
      </Card>

      <List
        className="card-list"
        dataSource={sortedTeams}
        renderItem={(team) => (
          <List.Item>
            <Card
              className="surface-card station-card"
              onClick={() => {
                setActiveTeam(team.id);
                navigate("/stations");
              }}>
              <div className="station-row">
                <div className="full-width">
                  <Flex
                    gap={8}
                    justify="space-between"
                    align="center"
                    className="full-width">
                    <Typography.Title level={4} className="card-title">
                      {team.name}
                    </Typography.Title>
                    {team.id === activeTeamId && (
                      <Tag color="gold">Active team</Tag>
                    )}
                  </Flex>
                  <Typography.Text className="muted-copy compact-copy">
                    {team.id} · Score {team.score}
                  </Typography.Text>
                </div>

                <Flex gap={4} align="flex-end">
                  <Tag color="blue">Finish {team.finish}/5</Tag>
                  <Tag color="geekblue">{team.totalTimeMinutes} min</Tag>
                </Flex>
              </div>
            </Card>
          </List.Item>
        )}
      />
    </Flex>
  );
}
