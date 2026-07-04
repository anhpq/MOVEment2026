import React, { useRef, useEffect, useState } from 'react';
import { Station, TeamStationProgress } from '../../types/player.type';
import './StationMap.css';

interface StationMapProps {
  stations: Station[];
  progress: Record<string, TeamStationProgress>;
  onStationClick: (station: Station) => void;
}

export const StationMap: React.FC<StationMapProps> = ({
  stations,
  progress,
  onStationClick,
}) => {
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const mapBackgroundRef = useRef<HTMLDivElement>(null);
  const [mapScale, setMapScale] = useState(1);
  const [mapTranslateX, setMapTranslateX] = useState(0);
  const [mapTranslateY, setMapTranslateY] = useState(0);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const grabStartRef = useRef({ x: 0, y: 0 });

  const getStatusColor = (stationId: string) => {
    const stationProgress = progress[stationId];
    if (!stationProgress) return '#ccc';

    switch (stationProgress.status) {
      case 'COMPLETED':
        return '#4caf50'; // Xanh - Hoàn thành
      case 'PLAYING':
        return '#ff9800'; // Cam - Đang chơi
      case 'UNLOCKED':
        return '#2196f3'; // Xanh dương - Mở khóa
      case 'LOCKED':
        return '#f44336'; // Đỏ - Khóa
      default:
        return '#ccc';
    }
  };

  const getStatusText = (stationId: string) => {
    const stationProgress = progress[stationId];
    if (!stationProgress) return 'UNKNOWN';

    switch (stationProgress.status) {
      case 'COMPLETED':
        return '✓';
      case 'PLAYING':
        return '⚡';
      case 'UNLOCKED':
        return '◯';
      case 'LOCKED':
        return '🔒';
      default:
        return '?';
    }
  };

  const updateMapTransform = (scale: number, translateX: number, translateY: number) => {
    if (mapWrapperRef.current) {
      mapWrapperRef.current.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
  };

  const zoomMap = (factor: number) => {
    const oldScale = mapScale;
    const newScale = Math.max(0.5, Math.min(3, mapScale * factor));
    setMapScale(newScale);

    if (mapBackgroundRef.current) {
      const centerX = mapBackgroundRef.current.clientWidth / 2;
      const centerY = mapBackgroundRef.current.clientHeight / 2;
      const scaleDiff = newScale - oldScale;
      
      const newTranslateX = mapTranslateX - centerX * scaleDiff;
      const newTranslateY = mapTranslateY - centerY * scaleDiff;
      
      setMapTranslateX(newTranslateX);
      setMapTranslateY(newTranslateY);
      updateMapTransform(newScale, newTranslateX, newTranslateY);
    }
  };

  const resetMap = () => {
    setMapScale(1);
    setMapTranslateX(0);
    setMapTranslateY(0);
    updateMapTransform(1, 0, 0);
  };

  // Update transform whenever scale/translate changes
  useEffect(() => {
    updateMapTransform(mapScale, mapTranslateX, mapTranslateY);
  }, [mapScale, mapTranslateX, mapTranslateY]);

  const handleMouseWheel = (e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    zoomMap(factor);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't grab if clicking marker or button
    if ((e.target as HTMLElement).closest('.station-marker') || 
        (e.target as HTMLElement).closest('.map-controls')) {
      return;
    }
    
    setIsGrabbing(true);
    grabStartRef.current = {
      x: e.clientX - mapTranslateX,
      y: e.clientY - mapTranslateY,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isGrabbing) return;
    
    const newTranslateX = e.clientX - grabStartRef.current.x;
    const newTranslateY = e.clientY - grabStartRef.current.y;
    
    setMapTranslateX(newTranslateX);
    setMapTranslateY(newTranslateY);
  };

  const handleMouseUp = () => {
    setIsGrabbing(false);
  };

  useEffect(() => {
    const mapBg = mapBackgroundRef.current;
    if (!mapBg) return;

    mapBg.addEventListener('wheel', handleMouseWheel, { passive: false });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      mapBg.removeEventListener('wheel', handleMouseWheel);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isGrabbing, mapTranslateX, mapTranslateY]);

  const handleMarkerClick = (station: Station, e: React.MouseEvent) => {
    e.stopPropagation();
    onStationClick(station);
  };

  return (
    <div className="station-map-container">
      <div
        className={`map-background ${isGrabbing ? 'grabbing' : ''}`}
        ref={mapBackgroundRef}
        onMouseDown={handleMouseDown}
      >
        <div className="map-wrapper" ref={mapWrapperRef}>
          <img
            src="/images/map/suoitien-map1.png"
            alt="Bản đồ Suối Tiên"
            className="map-image"
          />

          {/* Hiển thị các điểm trạm */}
          {stations.map((station) => (
            <div
              key={station.id}
              className="station-marker"
              style={{
                left: `${station.position.x}%`,
                top: `${station.position.y}%`,
                backgroundColor: getStatusColor(station.id),
              }}
              onClick={(e) => handleMarkerClick(station, e)}
              title={station.name}
            >
              <div className="station-marker-inner">
                <span className="station-status-icon">
                  {getStatusText(station.id)}
                </span>
              </div>
              <div className="station-tooltip">{station.name}</div>
            </div>
          ))}
        </div>

        {/* Map Controls */}
        <div className="map-controls">
          <button className="map-btn" onClick={() => zoomMap(1.2)} title="Phóng to">+</button>
          <button className="map-btn" onClick={() => zoomMap(0.8)} title="Thu nhỏ">−</button>
          <button className="map-btn" onClick={resetMap} title="Reset">⟲</button>
        </div>
      </div>

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#4caf50' }}></span>
          <span>Hoàn thành</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ff9800' }}></span>
          <span>Đang chơi</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#2196f3' }}></span>
          <span>Mở khóa</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#f44336' }}></span>
          <span>Khóa</span>
        </div>
      </div>
    </div>
  );
};
