import {
  RightOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {Card, Empty, List, Typography} from "antd";
import {useNavigate} from "react-router-dom";
import {useMovementStore} from "../store";
import {getTeamThemeVars} from "../teamTheme";
import "./TeamListPage.css";

export function TeamListPage() {
  const navigate = useNavigate();
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
          return (
            <List.Item>
              <Card
                className="team-select-card"
                style={getTeamThemeVars(team.teamColor)}
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
