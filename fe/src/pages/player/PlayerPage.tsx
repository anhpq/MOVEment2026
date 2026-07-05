import React, { useState } from 'react';
import type { Station, TeamStationProgress } from '../../types/player.type';
import { DUMMY_TEAMS, DUMMY_STATIONS, DUMMY_PROGRESS } from '../../services/dummyData';
import { TeamHeader } from '../../components/common/TeamHeader';
import { StationMap } from '../../components/map/StationMap';
import { StationDetailModal } from '../../components/map/StationDetailModal';
import { RankingTable } from '../../components/common/RankingTable';
import './PlayerPage.css';

const PlayerPage: React.FC = () => {
  // Dummy state - current team is "Savage Hunters" (team_id 6)
  const currentTeamId = 6;
  const currentTeam = DUMMY_TEAMS.find((t) => t.team_id === currentTeamId)!;

  // Modal states
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState<Record<string, TeamStationProgress>>(
    DUMMY_PROGRESS
  );

  // Handle station click
  const handleStationClick = (station: Station) => {
    setSelectedStation(station);
    setIsModalOpen(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Optional: clear selected station after animation
    setTimeout(() => setSelectedStation(null), 300);
  };

  // Handle play game
  const handlePlayGame = (stationId: string) => {
    console.log('Playing game for station:', stationId);
    // Update progress to PLAYING
    setProgress((prev) => ({
      ...prev,
      [stationId]: {
        ...prev[stationId],
        status: 'PLAYING',
      },
    }));
    // In real app, navigate to game component
    handleCloseModal();
  };

  // Handle scan QR
  const handleScanQR = (stationId: string) => {
    console.log('Scanning QR for station:', stationId);
    // In real app, open QR scanner
    alert('Mở camera để quét QR của trạm ' + stationId);
  };

  // Get current station progress
  const currentStationProgress = selectedStation
    ? progress[selectedStation.id]
    : null;

  return (
    <div className="player-page">
      {/* Header */}
      <div className="page-header">
        <TeamHeader
          team={currentTeam}
          stations={DUMMY_STATIONS}
          progress={progress}
        />
      </div>

      {/* Main Content */}
      <div className="page-content">
        {/* Map Section */}
        <section className="map-section">
          <StationMap
            stations={DUMMY_STATIONS}
            progress={progress}
            onStationClick={handleStationClick}
          />
        </section>

        {/* Ranking Section */}
        <section className="ranking-section">
          <RankingTable teams={DUMMY_TEAMS} currentTeamId={currentTeamId} />
        </section>

        {/* Info Section */}
        <section className="info-section">
          <div className="info-card">
            <h3>📖 Hướng dẫn chơi</h3>
            <ol>
              <li>Click vào các trạm trên bản đồ để xem chi tiết</li>
              <li>Nhập mật thư để mở khóa trạm</li>
              <li>Quét QR để xác nhận và bắt đầu chơi</li>
              <li>Hoàn thành trò chơi để nhận điểm</li>
              <li>Trạm hoàn thành có thể chơi lại sau 30 phút</li>
            </ol>
          </div>
        </section>
      </div>

      {/* Station Detail Modal */}
      <StationDetailModal
        station={selectedStation}
        progress={currentStationProgress}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onPlayGame={handlePlayGame}
        onScanQR={handleScanQR}
      />
    </div>
  );
};

export default PlayerPage;
