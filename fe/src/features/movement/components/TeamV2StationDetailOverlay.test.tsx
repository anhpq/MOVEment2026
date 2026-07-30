import {App} from "antd";
import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, it, vi} from "vitest";
import i18n from "../i18n";
import type {TeamStation} from "../types";
import {TeamV2StationDetailOverlay} from "./TeamV2StationDetailOverlay";

vi.mock("./TeamV2StationImageGallery", () => ({
  TeamV2StationImageGallery: () => <button type="button">gallery</button>,
}));

const station: TeamStation = {
  id: "progress-1",
  name: "Trạm thử nghiệm",
  status: "New",
  description: "Mô tả Station",
  durationMinutes: 10,
  trackingMode: "BOTH",
  youtubeUrl: null,
  imageUrls: [],
  imageCount: 0,
  score: 0,
  startTime: null,
  endTime: null,
  teamId: "1",
  stationId: "ST001",
  maxPoints: 10,
  backendStatus: "AVAILABLE",
  gameType: "STANDARD",
};

function renderDetail(
  overrides: Partial<TeamStation> = {},
  callbacks: {
    onClose?: () => void;
    onRequestScan?: (intent: "START" | "COMPLETE") => void;
    onCancel?: () => Promise<void>;
  } = {},
) {
  const props = {
    onClose: callbacks.onClose ?? vi.fn(),
    onRequestScan: callbacks.onRequestScan ?? vi.fn(),
    onCancel: callbacks.onCancel ?? vi.fn().mockResolvedValue(undefined),
  };
  render(
    <App>
      <TeamV2StationDetailOverlay
        station={{...station, ...overrides}}
        playingTeamCount={2}
        opacity={85}
        language="vi"
        {...props}
      />
    </App>,
  );
  return props;
}

describe("TeamV2StationDetailOverlay", () => {
  it("offers scan-to-start only for an available Station", async () => {
    const user = userEvent.setup();
    const {onRequestScan} = renderDetail();

    await user.click(screen.getByRole("button", {name: i18n.t("teamV2.scanToStart")}));

    expect(onRequestScan).toHaveBeenCalledWith("START");
    expect(screen.queryByRole("button", {name: i18n.t("stationDetail.completedButton")})).not.toBeInTheDocument();
    expect(screen.queryByRole("button", {name: i18n.t("stationDetail.cancelStation")})).not.toBeInTheDocument();
  });

  it("shows timer, complete and cancel for an in-progress Station", async () => {
    const user = userEvent.setup();
    const onRequestScan = vi.fn();
    const onCancel = vi.fn().mockResolvedValue(undefined);
    renderDetail({
      status: "In Progress",
      backendStatus: "PLAYING",
      startTime: new Date(Date.now() - 65_000).toISOString(),
    }, {onRequestScan, onCancel});

    expect(screen.getByLabelText(i18n.t("teamV2.elapsedTime"))).toBeInTheDocument();
    await user.click(screen.getByRole("button", {name: i18n.t("stationDetail.completedButton")}));
    await user.click(screen.getByRole("button", {name: i18n.t("stationDetail.cancelStation")}));

    expect(onRequestScan).toHaveBeenCalledWith("COMPLETE");
    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
  });

  it("renders a finished Station without gameplay actions", () => {
    renderDetail({status: "Finished", backendStatus: "COMPLETED", score: 10});

    expect(screen.getByText(i18n.t("status.Finished"))).toBeInTheDocument();
    expect(screen.queryByRole("button", {name: i18n.t("teamV2.scanToStart")})).not.toBeInTheDocument();
    expect(screen.queryByRole("button", {name: i18n.t("stationDetail.completedButton")})).not.toBeInTheDocument();
    expect(screen.queryByRole("button", {name: i18n.t("stationDetail.cancelStation")})).not.toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDetail({}, {onClose});

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from the close control and backdrop", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const {container} = render(
      <App>
        <TeamV2StationDetailOverlay
          station={station}
          playingTeamCount={2}
          opacity={85}
          language="vi"
          onClose={onClose}
          onRequestScan={vi.fn()}
          onCancel={vi.fn().mockResolvedValue(undefined)}
        />
      </App>,
    );

    await user.click(screen.getByRole("button", {name: i18n.t("teamV2.closeStationDetail")}));
    await user.click(container.querySelector(".team-v2-detail-layer") as HTMLElement);

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
