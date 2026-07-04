import React, { useState } from 'react';
import { Station, TeamStationProgress } from '../../types/player.type';
import './StationDetailModal.css';

interface StationDetailModalProps {
  station: Station | null;
  progress: TeamStationProgress | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayGame: (stationId: string) => void;
  onScanQR: (stationId: string) => void;
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  station,
  progress,
  isOpen,
  onClose,
  onPlayGame,
  onScanQR,
}) => {
  const [showCipherInput, setShowCipherInput] = useState(false);
  const [cipherAnswer, setCipherAnswer] = useState('');
  const [showYouTube, setShowYouTube] = useState(false);

  if (!isOpen || !station || !progress) return null;

  const isCooldownActive = progress.cooldown_expires_at
    ? new Date(progress.cooldown_expires_at) > new Date()
    : false;

  const cooldownMinutesLeft = isCooldownActive
    ? Math.ceil(
        (new Date(progress.cooldown_expires_at!).getTime() -
          new Date().getTime()) /
          60000
      )
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#4caf50';
      case 'PLAYING':
        return '#ff9800';
      case 'UNLOCKED':
        return '#2196f3';
      case 'LOCKED':
        return '#f44336';
      default:
        return '#ccc';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '✓ Hoàn thành';
      case 'PLAYING':
        return '⚡ Đang chơi';
      case 'UNLOCKED':
        return '◯ Mở khóa';
      case 'LOCKED':
        return '🔒 Khóa';
      default:
        return 'Không xác định';
    }
  };

  const handlePlayGame = () => {
    // Kiểm tra nếu đội cần nhập mật thư trước
    if (progress.status === 'UNLOCKED') {
      setShowCipherInput(true);
    } else if (progress.status === 'PLAYING' || progress.status === 'COMPLETED') {
      onPlayGame(station.id);
    }
  };

  const handleSubmitCipher = () => {
    if (cipherAnswer.trim()) {
      // Giả lập: nếu nhập đúng sẽ chuyển trạng thái
      console.log('Mật thư:', cipherAnswer);
      onPlayGame(station.id);
      setShowCipherInput(false);
      setCipherAnswer('');
    }
  };

  const handleWatchVideo = () => {
    setShowYouTube(!showYouTube);
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-top">
            <div className="station-info">
              <h2 className="station-name">{station.name}</h2>
              <div className="station-meta">
                <span className="game-type">{station.game_type}</span>
                <span className="points-badge">{station.points} điểm</span>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="status-bar" style={{ backgroundColor: getStatusColor(progress.status) }}>
            <span className="status-icon">
              {getStatusLabel(progress.status)}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Thông tin trạm */}
          <div className="section">
            <h3 className="section-title">📋 Thông tin trạm</h3>
            <p className="clue-text">{station.clue_text}</p>
          </div>

          {/* Video YouTube */}
          {progress.status !== 'LOCKED' && (
            <div className="section">
              <div className="video-section">
                <button
                  className={`watch-video-btn ${
                    progress.status === 'COMPLETED' && isCooldownActive
                      ? 'disabled'
                      : ''
                  }`}
                  onClick={handleWatchVideo}
                  disabled={
                    progress.status === 'COMPLETED' && isCooldownActive
                  }
                >
                  📺 {showYouTube ? 'Ẩn Video' : 'Xem Video'}
                  {progress.status === 'COMPLETED' &&
                    isCooldownActive && (
                      <span className="cooldown-text">
                        ({cooldownMinutesLeft}p còn lại)
                      </span>
                    )}
                </button>

                {showYouTube && (
                  <div className="youtube-container">
                    <iframe
                      width="100%"
                      height="250"
                      src={station.youtube_url}
                      title={station.name}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Nhập mật thư nếu cần */}
          {showCipherInput && progress.status === 'UNLOCKED' && (
            <div className="section cipher-section">
              <h3 className="section-title">🔓 Nhập mật thư để chơi</h3>
              <div className="cipher-input-group">
                <input
                  type="text"
                  placeholder="Nhập mật thư..."
                  value={cipherAnswer}
                  onChange={(e) => setCipherAnswer(e.target.value.toUpperCase())}
                  className="cipher-input"
                  autoFocus
                />
                <button
                  className="cipher-submit-btn"
                  onClick={handleSubmitCipher}
                  disabled={!cipherAnswer.trim()}
                >
                  ✓
                </button>
              </div>
              <button
                className="cipher-cancel-btn"
                onClick={() => setShowCipherInput(false)}
              >
                Hủy
              </button>
            </div>
          )}

          {/* Thông tin tiến độ */}
          <div className="section progress-section">
            <h3 className="section-title">📊 Tiến độ</h3>
            <div className="progress-items">
              <div className="progress-item">
                <span className="progress-label">Trạng thái</span>
                <span className="progress-value">
                  {getStatusLabel(progress.status)}
                </span>
              </div>
              {progress.status !== 'LOCKED' && (
                <>
                  <div className="progress-item">
                    <span className="progress-label">Lần cố gắng</span>
                    <span className="progress-value">{progress.attempts}</span>
                  </div>
                  <div className="progress-item">
                    <span className="progress-label">Điểm đạt được</span>
                    <span className="progress-value">
                      {progress.score_achieved}/{station.points}
                    </span>
                  </div>
                </>
              )}
              {progress.status === 'LOCKED' && (
                <div className="lock-reason">
                  Hoàn thành các trạm khác để mở khóa trạm này
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Action Buttons */}
        <div className="modal-footer">
          {progress.status === 'LOCKED' && (
            <button className="action-btn disabled" disabled>
              🔒 Bị khóa
            </button>
          )}

          {progress.status === 'UNLOCKED' && (
            <>
              <button
                className="action-btn secondary"
                onClick={() => onScanQR(station.id)}
              >
                📱 Quét QR
              </button>
              <button className="action-btn primary" onClick={handlePlayGame}>
                🎮 Chơi Trò Chơi
              </button>
            </>
          )}

          {progress.status === 'PLAYING' && (
            <button className="action-btn playing" onClick={handlePlayGame}>
              ⚡ Tiếp tục chơi
            </button>
          )}

          {progress.status === 'COMPLETED' && (
            <>
              {isCooldownActive ? (
                <div className="cooldown-message">
                  ⏱️ Cooldown: {cooldownMinutesLeft} phút còn lại
                </div>
              ) : (
                <button
                  className="action-btn secondary"
                  onClick={() => onPlayGame(station.id)}
                >
                  🔄 Chơi lại
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
