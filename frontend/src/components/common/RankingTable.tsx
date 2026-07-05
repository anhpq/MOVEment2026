import React from 'react';
import type { Team } from '../../types/player.type';
import './RankingTable.css';

interface RankingTableProps {
  teams: Team[];
  currentTeamId: number;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  teams,
  currentTeamId,
}) => {
  // Lấy top 5
  const top5 = teams.slice(0, 5);

  // Tìm đội hiện tại
  const currentTeam = teams.find((t) => t.team_id === currentTeamId);

  // Hiển thị top 5 + đội hiện tại (nếu ngoài top 5)
  const displayTeams =
    currentTeam && currentTeam.rank > 5
      ? [...top5, currentTeam]
      : top5;

  return (
    <div className="ranking-table-container">
      <h3 className="ranking-title">🏆 Bảng Xếp Hạng</h3>
      <div className="ranking-table">
        {displayTeams.map((team) => (
          <div
            key={team.team_id}
            className={`ranking-row ${
              team.team_id === currentTeamId ? 'current-team' : ''
            }`}
          >
            <div className="rank-badge" style={{ backgroundColor: team.color }}>
              {team.rank}
            </div>
            <div className="team-info">
              <div className="team-name">{team.team_name}</div>
            </div>
            <div className="team-points">
              <span className="points-value">{team.total_points}</span>
              <span className="points-label">điểm</span>
            </div>
          </div>
        ))}
      </div>
      {currentTeam && currentTeam.rank > 5 && (
        <div className="ranking-note">
          Bạn đang xếp hạng {currentTeam.rank} trên {teams.length} đội
        </div>
      )}
    </div>
  );
};
