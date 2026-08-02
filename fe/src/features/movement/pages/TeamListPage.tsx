import {
  RightOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {Card, Empty, List, Typography} from "antd";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import {useMovementStore} from "../store";
import {getTeamThemeVars} from "../teamTheme";
import {getLocalizedTeamName} from "../utils";
import "./TeamListPage.css";

export function TeamListPage() {
  const navigate = useNavigate();
  const {i18n, t} = useTranslation();
  const teams = useMovementStore((state) => state.teams);
  const setActiveTeam = useMovementStore((state) => state.setActiveTeam);
  const language = i18n.language === "en" ? "en" : "vi";
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
          <Typography.Title level={2}>{t("teamsPage.title")}</Typography.Title>
        </div>
        <div className="teams-total">
          <strong>{teams.length}</strong>
          <span>{t("teamsPage.totalTeams")}</span>
        </div>
      </header>

      <List
        className="teams-list"
        dataSource={sortedTeams}
        locale={{emptyText: <Empty description={t("teamsPage.empty")} />}}
        renderItem={(team) => {
          const displayName = getLocalizedTeamName(team.name, language);
          return (
            <List.Item>
              <Card
                className="team-select-card"
                style={getTeamThemeVars(team.teamColor)}
                hoverable
                role="button"
                tabIndex={0}
                aria-label={t("teamsPage.openTeam", {team: displayName})}
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
                        <span title={displayName}>{displayName}</span>
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
