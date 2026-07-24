import {
  RightOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {Card, Empty, List, Tag, Typography} from "antd";
import {useNavigate} from "react-router-dom";
import {useMovementStore} from "../store";
import "./TeamListPage.css";

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

  const openTeam = (teamId: string) => {
    setActiveTeam(teamId);
    navigate(`/teams/${teamId}/stations`);
  };

  return (
    <section className="teams-page">
      <header className="teams-hero">
        <span className="teams-hero-icon">
          <TeamOutlined />
        </span>
        <div className="teams-hero-copy">
          <Typography.Title level={2}>Teams</Typography.Title>
          <Typography.Text>
            Select a team to open its Station dashboard.
          </Typography.Text>
        </div>
        <div className="teams-total">
          <strong>{teams.length}</strong>
          <span>Total teams</span>
        </div>
      </header>

      <List
        className="teams-list"
        dataSource={sortedTeams}
        locale={{emptyText: <Empty description="No teams available" />}}
        renderItem={(team) => {
          const isActive = team.id === activeTeamId;

          return (
            <List.Item>
              <Card
                className={`team-select-card ${isActive ? "is-active" : ""}`}
                hoverable
                role="button"
                tabIndex={0}
                aria-label={`Open ${team.name}`}
                onClick={() => openTeam(team.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openTeam(team.id);
                  }
                }}>
                <div className="team-select-header">
                  <div className="team-select-identity">
                    <div className="team-select-name-row">
                      <Typography.Title level={3}>
                        {team.name}
                      </Typography.Title>
                      {isActive && <Tag>Current team</Tag>}
                    </div>
                    <Typography.Text>{team.id}</Typography.Text>
                  </div>
                  <span className="team-select-arrow">
                    <RightOutlined />
                  </span>
                </div>

              </Card>
            </List.Item>
          );
        }}
      />
    </section>
  );
}
