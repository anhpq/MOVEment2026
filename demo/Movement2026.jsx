import { useState } from 'react';
import './styles.css';

const stations = [
  { key: '10', label: '10', status: 'unplayed', pos: 's10', points: '10 PTS' },
  { key: '15-top', label: '15', status: 'unplayed', pos: 's15top', points: '10 PTS' },
  { key: 'ST15A', label: 'ST15A', status: 'unplayed', pos: 's15a', points: '10 PTS', long: true },
  { key: '02', label: '02', status: 'completed', pos: 's02', points: '10 PTS' },
  { key: '16', label: '16', status: 'unplayed', pos: 's16', points: '10 PTS' },
  { key: '07', label: '07', status: 'unplayed', pos: 's07', points: '10 PTS' },
  { key: '15-playing', label: '15', status: 'playing', pos: 'sactive', points: '10 PTS' },
  { key: '12', label: '12', status: 'unplayed', pos: 's12', points: '10 PTS' },
  { key: 'ST047', label: 'ST047', status: 'unplayed', pos: 's047', points: '10 PTS', long: true },
  { key: 'ST031', label: 'ST031', status: 'completed', pos: 's031', points: '10 PTS', long: true },
  { key: '23', label: '23', status: 'unplayed', pos: 's23', points: '10 PTS' },
  { key: 'ST052', label: 'ST052', status: 'locked', pos: 's052', points: '10 PTS', long: true },
];

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5v2a4 4 0 0 0 4 4m7-6h3v2a4 4 0 0 1-4 4M12 12v4m-3 3h6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <span className="lock-dot">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 10V8a5 5 0 0 1 10 0v2" />
        <rect x="5" y="10" width="14" height="10" rx="2" />
      </svg>
    </span>
  );
}

function StationMarker({ station, onClick }) {
  const statusLabel = {
    unplayed: 'chưa chơi',
    completed: 'đã hoàn thành',
    playing: 'đang chơi',
    locked: 'đã khóa',
  }[station.status];

  return (
    <button
      className={`station state-${station.status} ${station.pos}`}
      type="button"
      aria-label={`Trạm ${station.label}, ${statusLabel}`}
      onClick={() => onClick?.(station)}
    >
      <span className="marker-pin">
        <span className={`marker-label ${station.long ? 'marker-label-long' : ''}`}>{station.label}</span>
        {station.status === 'locked' && <LockIcon />}
      </span>
      <span className={`marker-meta ${station.trophy ? 'marker-meta-icon' : ''}`}>
        {station.trophy ? <TrophyIcon /> : station.points}
      </span>
      {station.status === 'playing' && <span className="radar" aria-hidden="true"><i /><i /><i /></span>}
    </button>
  );
}

export default function Movement2026({ onStationClick, onSettings, onLeaderboard, onScan, onMyTeam, onLegend }) {
  const [legendOpen, setLegendOpen] = useState(false);

  return (
    <main className="movement-app">
      <header className="hud-header">
        <div className="title-frame" aria-label="MOVEment 2026"><h1>MOVEment 2026</h1></div>
        <button className="settings-button" type="button" aria-label="Cài đặt" onClick={onSettings}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.14 12.94c.04-.31.06-.62.06-.94s-.02-.63-.06-.94l2.03-1.58-1.92-3.32-2.39.96a7.23 7.23 0 0 0-1.63-.94L14.87 3h-3.84l-.36 3.18c-.58.24-1.12.55-1.63.94l-2.39-.96-1.92 3.32 2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58 1.92 3.32 2.39-.96c.5.39 1.05.7 1.63.94l.36 3.18h3.84l.36-3.18c.58-.24 1.13-.55 1.63-.94l2.39.96 1.92-3.32-2.03-1.58ZM12.95 15.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Z" /></svg>
        </button>
      </header>

      <section className="score-card" aria-label="Tổng điểm 11">
        <div>
          <div className="score-line"><strong>11</strong><span>PTS</span></div>
          <div className="score-label">TỔNG ĐIỂM</div>
        </div>
      </section>

      <div className={`legend-control ${legendOpen ? 'is-open' : ''}`}>
        <button
          className="legend-toggle"
          type="button"
          aria-expanded={legendOpen}
          aria-controls="movement-legend"
          onClick={() => {
            const next = !legendOpen;
            setLegendOpen(next);
            onLegend?.(next);
          }}
        >
          <span className="legend-info-icon" aria-hidden="true">i</span>
          <span>CHÚ THÍCH</span>
          <span className="legend-chevron" aria-hidden="true">⌄</span>
        </button>

        <section id="movement-legend" className="legend-hud" aria-label="Chú thích màu marker" hidden={!legendOpen}>
          <span className="legend-item"><i className="legend-pin state-playing" /><b>ĐANG CHƠI</b></span>
          <span className="legend-item"><i className="legend-pin state-unplayed" /><b>CHƯA CHƠI</b></span>
          <span className="legend-item"><i className="legend-pin state-completed" /><b>HOÀN THÀNH</b></span>
          <span className="legend-item"><i className="legend-pin state-locked"><em>▣</em></i><b>ĐÃ KHÓA</b></span>
        </section>
      </div>

      <section className="station-layer" aria-label="Bản đồ trạm">
        {stations.map((station) => <StationMarker key={station.key} station={station} onClick={onStationClick} />)}
      </section>

      <nav className="footer-nav" aria-label="Điều hướng chính">
        <button className="footer-wing footer-left" type="button" onClick={onLeaderboard}>
          <span className="footer-content">
            <span className="footer-icon-wrap">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5v2a4 4 0 0 0 4 4m7-6h3v2a4 4 0 0 1-4 4M12 12v4m-3 3h6"/></svg>
            </span>
            <span className="footer-label">BXH</span>
          </span>
        </button>

        <button className="scan-button" type="button" aria-label="Quét mã" onClick={onScan}>
          <span className="scan-ring scan-ring-outer" />
          <span className="scan-ring scan-ring-inner" />
          <span className="scan-content">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V4h4M16 4h4v4M4 16v4h4M20 16v4h-4"/><path d="M8 8h4v4H8zM15 8h2v2h-2zM15 13h2v2h-2zM8 15h2v2H8zM12 15h2v2h-2zM17 17h2"/></svg>
            <span>QUÉT MÃ</span>
          </span>
        </button>

        <button className="footer-wing footer-right" type="button" onClick={onMyTeam}>
          <span className="footer-content">
            <span className="footer-icon-wrap">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="2.5"/><circle cx="16.5" cy="9" r="2"/><path d="M4 18c.5-3.4 2.4-5.2 5-5.2s4.5 1.8 5 5.2M14 14c2.8-.6 5 .9 5.6 3.8"/></svg>
            </span>
            <span className="footer-label">ĐỘI CỦA TÔI</span>
          </span>
        </button>
      </nav>
    </main>
  );
}
