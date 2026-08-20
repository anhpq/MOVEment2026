import {App} from "antd";
import {cleanup, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter} from "react-router-dom";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../../../movement/i18n";
import {ensureAdminV2Resources} from "../../i18n/resources";
import {AdminV2ScoreQueuePage} from "./AdminV2ScoreQueuePage";
import {isScoreWithinRange} from "./scoreQueueValidation";

const api = vi.hoisted(() => ({getAdminScoreQueue: vi.fn(), submitAdminProgressScore: vi.fn()}));
vi.mock("../../../movement/api", () => api);

const pendingScore = {
  id: 17, teamId: 2, stationId: "ST004", status: "PLAYING", checkedOutAt: "2026-08-19T03:32:00.000Z", completedAt: null, scoreAchieved: 0, notes: "Needs score review",
  station: {id: "ST004", name: "Trạm Gió", nameEn: "Wind Station", trackingMode: "SCORE"},
  game: {id: "game-4", type: "STANDARD", maxPoints: 30, scoreEntryMax: 105},
  scoreEntryMax: 105,
  team: {id: 2, name: "Team 02", username: "team02", captainName: "Minh", totalPoints: 40, totalPlaySeconds: 360, color: "#0066AA"},
};

function renderPage() {
  return render(<App><MemoryRouter><AdminV2ScoreQueuePage /></MemoryRouter></App>);
}

async function openAndFillReview(user: ReturnType<typeof userEvent.setup>, score = "20") {
  await user.click(await screen.findByRole("button", {name: "Enter score"}));
  const scoreInput = screen.getByRole("spinbutton", {name: "Score"});
  await user.clear(scoreInput);
  await user.type(scoreInput, score);
  await user.type(screen.getByRole("textbox", {name: "Reason"}), "Verified by operations");
}

describe("AdminV2ScoreQueuePage", () => {
  beforeEach(async () => {
    ensureAdminV2Resources();
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    await i18n.changeLanguage("en");
    api.getAdminScoreQueue.mockResolvedValue([pendingScore]);
    api.submitAdminProgressScore.mockResolvedValue({});
  });

  afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); });

  it("renders real pending queue fields, including score bounds, note, and pending count", async () => {
    renderPage();

    expect(await screen.findByText("Wind Station")).toBeVisible();
    expect(screen.getByText("Needs score review")).toBeVisible();
    expect(screen.getByText("1 pending scores")).toBeVisible();
    expect(screen.getByText("30")).toBeVisible();
    expect(screen.getByText("PLAYING")).toBeVisible();
  });

  it("renders the Score Queue in Vietnamese", async () => {
    await i18n.changeLanguage("vi");
    renderPage();
    expect(await screen.findByRole("heading", {name: "Hàng đợi chấm điểm"})).toBeVisible();
    expect(await screen.findByRole("button", {name: "Nhập điểm"})).toBeVisible();
  });

  it("shows the authoritative empty state", async () => {
    api.getAdminScoreQueue.mockResolvedValueOnce([]);
    renderPage();
    expect(await screen.findByText("No scores are pending.")).toBeVisible();
  });

  it("opens the supported review action and submits the existing Admin score mutation", async () => {
    const user = userEvent.setup();
    api.getAdminScoreQueue.mockResolvedValueOnce([pendingScore]).mockResolvedValueOnce([]);
    renderPage();

    await openAndFillReview(user);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Team 02");
    expect(dialog).toHaveTextContent("ST004 · Wind Station");
    expect(dialog).toHaveTextContent("Reference points");
    await user.click(screen.getByRole("button", {name: "Save score"}));

    await waitFor(() => expect(api.submitAdminProgressScore).toHaveBeenCalledWith(17, 20, "Verified by operations"));
    await waitFor(() => expect(api.getAdminScoreQueue).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("No scores are pending.")).toBeVisible();
  }, 10000);

  it("validates the integer score range used by the score form", () => {
    expect(isScoreWithinRange(-1, 105)).toBe(false);
    expect(isScoreWithinRange(0, 105)).toBe(true);
    expect(isScoreWithinRange(105, 105)).toBe(true);
    expect(isScoreWithinRange(106, 105)).toBe(false);
    expect(isScoreWithinRange(12.5, 105)).toBe(false);
  });

  it("sets the Score input bounds from the authoritative global cap", async () => {
    const user = userEvent.setup();
    renderPage();
    await openAndFillReview(user, "20");
    const scoreInput = screen.getByRole("spinbutton", {name: "Score"});
    expect(scoreInput).toHaveAttribute("aria-valuemin", "0");
    expect(scoreInput).toHaveAttribute("aria-valuemax", "105");
  });

  it("warns without blocking when a valid score exceeds the reference", async () => {
    const user = userEvent.setup();
    api.getAdminScoreQueue.mockResolvedValueOnce([pendingScore]).mockResolvedValueOnce([]);
    renderPage();
    await openAndFillReview(user, "31");

    await waitFor(() => expect(screen.getByRole("dialog")).toHaveTextContent("This score exceeds the 30 reference points but remains valid."));
    await user.click(screen.getByRole("button", {name: "Save score"}));
    await waitFor(() => expect(api.submitAdminProgressScore).toHaveBeenCalledWith(17, 31, "Verified by operations"));
  });

  it("locks the confirmation while the score mutation is in flight", async () => {
    const user = userEvent.setup();
    let resolveMutation: (() => void) | undefined;
    api.submitAdminProgressScore.mockImplementationOnce(() => new Promise<void>((resolve) => { resolveMutation = resolve; }));
    renderPage();
    await openAndFillReview(user);
    await user.click(screen.getByRole("button", {name: "Save score"}));

    await waitFor(() => expect(api.submitAdminProgressScore).toHaveBeenCalledTimes(1));
    const savingButton = screen.getByRole("button", {name: /Saving…/});
    expect(savingButton).toHaveClass("ant-btn-loading");
    await user.click(savingButton);
    expect(api.submitAdminProgressScore).toHaveBeenCalledTimes(1);
    resolveMutation?.();
  });

  it("keeps the review open and reports a score API failure", async () => {
    const user = userEvent.setup();
    api.submitAdminProgressScore.mockRejectedValueOnce(new Error("stale progress"));
    renderPage();
    await openAndFillReview(user);
    await user.click(screen.getByRole("button", {name: "Save score"}));

    const dialog = screen.getByRole("dialog");
    await waitFor(() => expect(dialog.querySelector(".admin-v2-score-queue__mutation-error")).toHaveTextContent("Unable to complete the score. Check the values and try again."));
  });

  it("distinguishes an initial queue API failure from an empty queue", async () => {
    api.getAdminScoreQueue.mockRejectedValueOnce(new Error("offline"));
    renderPage();
    expect(await screen.findByText("Unable to load Score Queue")).toBeVisible();
  });
});
