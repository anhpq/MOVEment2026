import React from 'react';
import { Team, Station, TeamStationProgress } from '../../types/player.type';
import './TeamHeader.css';

interface TeamHeaderProps {
  team: Team;
  stations: Station[];
  progress: Record<string, TeamStationProgress>;
}

export const TeamHeader: React.FC<TeamHeaderProps> = ({
  team,
  stations,
  progress,
}) => {
  const completedCount = Object.values(progress).filter(
    (p) => p.status === 'COMPLETED'
  ).length;

  const totalStations = stations.length;
  const progressPercent = Math.round((completedCount / totalStations) * 100);

  const startTime = new Date(team.start_time);
  const elapsed = Math.floor(
    (new Date().getTime() - startTime.getTime()) / 60000
  );
  const hours = Math.floor(elapsed / 60);
  const minutes = elapsed % 60;

  return (
    <div className="team-header">
      <div className="team-header-top">
        <div className="team-name-section">
          <div className="team-color-indicator" style={{ backgroundColor: team.color }}>
          </div>
          <div className="team-details">
            <h1 className="team-name">{team.team_name}</h1>
            <div className="team-rank">Hạng {team.rank}</div>
          </div>
        </div>
        <div className="team-points-display">
          <div className="points-badge">{team.total_points}</div>
          <div className="points-label">Điểm</div>
        </div>
      </div>

      <div className="team-stats">
        <div className="stat-item">
          <span className="stat-icon">🎮</span>
          <span className="stat-value">{completedCount}/{totalStations}</span>
          <span className="stat-label">Trạm</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">⏱️</span>
          <span className="stat-value">
            {hours}:{String(minutes).padStart(2, '0')}
          </span>
          <span className="stat-label">Thời gian</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">📊</span>
          <span className="stat-value">{progressPercent}%</span>
          <span className="stat-label">Tiến độ</span>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-background">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <span className="progress-text">{completedCount} trạm hoàn thành</span>
      </div>
    </div>
  );
};
