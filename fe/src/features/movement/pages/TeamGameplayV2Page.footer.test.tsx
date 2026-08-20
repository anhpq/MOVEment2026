import {App} from "antd";
import {act, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";
import i18n from "../i18n";
import type {TeamStation} from "../types";
import {DemoFooter} from "./TeamGameplayV2Page";

const activeStation: TeamStation = {
  id: "progress-1",
  name: "Trạm đang chơi",
  status: "In Progress",
  description: null,
  durationMinutes: 10,
  trackingMode: "BOTH",
  youtubeUrl: null,
  imageUrls: [],
  imageCount: 0,
  score: 0,
  startTime: "2026-08-20T04:58:55.000Z",
  endTime: null,
  teamId: "1",
  stationId: "ST001",
  maxPoints: 20,
  backendStatus: "PLAYING",
  gameType: "ST",
};

function renderFooter(
  station: TeamStation | null = null,
  teamName = "Đội 03",
  language: "vi" | "en" = "vi",
) {
  const onActiveStation = vi.fn();
  const onLeaderboard = vi.fn();
  const onMyTeam = vi.fn();
  render(
    <App>
      <DemoFooter
        activeStation={station}
        footerScale={1}
        language={language}
        onActiveStation={onActiveStation}
        onLeaderboard={onLeaderboard}
        onMyTeam={onMyTeam}
        onScan={vi.fn()}
        teamName={teamName}
      />
    </App>,
  );
  return {onActiveStation, onLeaderboard, onMyTeam};
}

describe("Team Gameplay V2 footer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens the Leaderboard when there is no active Station", () => {
    const {onLeaderboard, onActiveStation} = renderFooter();

    fireEvent.click(screen.getByRole("button", {name: i18n.t("teamV2.leaderboardControl")}));

    expect(onLeaderboard).toHaveBeenCalledOnce();
    expect(onActiveStation).not.toHaveBeenCalled();
  });

  it.each([
    ["Đội 03", "vi", "Đội 3"],
    ["Team 03", "en", "Team 3"],
    ["Biệt đội Sao", "vi", "Biệt đội Sao"],
  ] as const)("shows compact Team name %s as %s", (teamName, language, expected) => {
    const {onMyTeam} = renderFooter(null, teamName, language);

    fireEvent.click(screen.getByRole("button", {name: expected}));

    expect(onMyTeam).toHaveBeenCalledOnce();
  });

  it("replaces the Leaderboard copy with a live timer and opens the active Station Detail", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T05:00:00.000Z"));
    const {onLeaderboard, onActiveStation} = renderFooter(activeStation);

    expect(screen.queryByText(i18n.t("teamV2.leaderboardControl"))).not.toBeInTheDocument();
    expect(screen.getByText("01:05")).toBeVisible();

    act(() => vi.advanceTimersByTime(1000));
    const timer = screen.getByText("01:06");
    fireEvent.click(timer.closest("button") as HTMLButtonElement);

    expect(onActiveStation).toHaveBeenCalledWith("ST001");
    expect(onLeaderboard).not.toHaveBeenCalled();
  });
});
