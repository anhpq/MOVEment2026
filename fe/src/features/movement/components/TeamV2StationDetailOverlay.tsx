import {
  CheckCircleOutlined,
  CloseOutlined,
  FlagOutlined,
  PlayCircleFilled,
  ReloadOutlined,
  StarFilled,
  TeamOutlined,
  YoutubeFilled,
} from "@ant-design/icons";
import {Button, Tag} from "antd";
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import type {SupportedLanguage, TeamStation} from "../types";
import {
  formatDateTime,
  formatDurationFromMs,
  getStationDisplayCode,
  getStationEffectiveMaxPoints,
} from "../utils";
import {TeamV2StationImageGallery} from "./TeamV2StationImageGallery";
import "./TeamV2StationDetailOverlay.css";

export type TeamV2StationDetailOverlayProps = {
  station: TeamStation;
  playingTeamCount: number;
  opacity: number;
  language: SupportedLanguage;
  onClose: () => void;
  onRequestScan: (intent: "START" | "COMPLETE") => void;
  onCancel: () => Promise<void>;
};

export function TeamV2StationDetailOverlay({
  station,
  playingTeamCount,
  opacity,
  language,
  onClose,
  onRequestScan,
  onCancel,
}: TeamV2StationDetailOverlayProps) {
  const {t} = useTranslation();
  const [clockTick, setClockTick] = useState(() => Date.now());
  const [isCancelling, setIsCancelling] = useState(false);
  const isAvailable =
    station.status === "New" &&
    (!station.backendStatus || station.backendStatus === "AVAILABLE");
  const isInProgress = station.status === "In Progress";
  const stationMaxPoints = getStationEffectiveMaxPoints(station);
  const elapsed =
    isInProgress && station.startTime ?
      formatDurationFromMs(clockTick - new Date(station.startTime).getTime())
    : "00:00:00";

  useEffect(() => {
    if (!isInProgress || !station.startTime) {
      return;
    }
    const timer = globalThis.setInterval(() => setClockTick(Date.now()), 1000);
    return () => globalThis.clearInterval(timer);
  }, [isInProgress, station.startTime]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const openVideo = () => {
    if (!station.youtubeUrl) return;
    const videoWindow = window.open(station.youtubeUrl, "_blank", "noopener,noreferrer");
    if (videoWindow) videoWindow.opener = null;
  };

  return (
    <div
      className="team-v2-overlay-layer team-v2-detail-layer"
      style={{opacity: opacity / 100}}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}>
      <section
        className="team-v2-overlay team-v2-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-v2-detail-title">
        <header className="team-v2-detail-header">
          <span className="team-v2-detail-code" aria-hidden="true">
            {getStationDisplayCode(station.stationId)}
          </span>
          <div className="team-v2-detail-heading-copy">
            <div className="team-v2-detail-title-row">
              <h2 id="team-v2-detail-title">{station.name}</h2>
              <Tag className={`team-v2-detail-status is-${station.status.toLowerCase().replaceAll(" ", "-")}`}>
                {t(`status.${station.status}`)}
              </Tag>
            </div>
            {station.description && <p>{station.description}</p>}
          </div>
          <button
            type="button"
            className="team-v2-icon-button"
            onClick={onClose}
            aria-label={t("teamV2.closeStationDetail")}>
            <CloseOutlined />
          </button>
        </header>

        <div className="team-v2-detail-stats">
          <div><TeamOutlined /><span><small>{t("common.playingTeams")}</small><strong>{playingTeamCount}</strong></span></div>
          <div><StarFilled /><span><small>{t("common.scoreMax")}</small><strong>{station.score} / {stationMaxPoints}</strong></span></div>
          <div><PlayCircleFilled /><span><small>{t("common.startTime")}</small><strong>{formatDateTime(station.startTime, language)}</strong></span></div>
          <div><FlagOutlined /><span><small>{t("common.endTime")}</small><strong>{formatDateTime(station.endTime, language)}</strong></span></div>
        </div>

        {isInProgress && (
          <div className="team-v2-detail-timer" aria-label={t("teamV2.elapsedTime")}>
            <small>{t("teamV2.elapsedTime")}</small>
            <strong>{elapsed}</strong>
          </div>
        )}

        <div className="team-v2-detail-media">
          <Button
            block
            className="team-v2-detail-media-button team-v2-detail-youtube-button"
            icon={<YoutubeFilled />}
            disabled={station.gameType !== "ST" || !station.youtubeUrl}
            onClick={openVideo}>
            {t("common.watchVideo")}
          </Button>
          <TeamV2StationImageGallery
            stationId={station.stationId}
            imageCount={station.imageCount}
            imageUrls={station.imageUrls}
          />
        </div>

        <div className="team-v2-detail-actions">
          {isAvailable && (
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleFilled />}
              aria-label={t("teamV2.scanToStart")}
              onClick={() => onRequestScan("START")}>
              {t("teamV2.scanToStart")}
            </Button>
          )}
          {isInProgress && (
            <>
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                aria-label={t("stationDetail.completedButton")}
                onClick={() => onRequestScan("COMPLETE")}>
                {t("stationDetail.completedButton")}
              </Button>
              <Button
                danger
                icon={<ReloadOutlined />}
                aria-label={t("stationDetail.cancelStation")}
                loading={isCancelling}
                onClick={async () => {
                  setIsCancelling(true);
                  try {
                    await onCancel();
                  } finally {
                    setIsCancelling(false);
                  }
                }}>
                {t("stationDetail.cancelStation")}
              </Button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
