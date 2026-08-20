import {App as AntdApp} from "antd";
import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../../../movement/i18n";
import {ensureAdminV2Resources} from "../../i18n/resources";
import {AdminV2FinalChallengePage} from "./AdminV2FinalChallengePage";
import {toFinalConfigUpdate} from "./adminV2FinalChallengeData";
import {isValidOptionalKeywordRotation} from "./finalChallengeValidation";

const api = vi.hoisted(() => ({getAdminFinalConfig: vi.fn(), getAdminFinalSubmissions: vi.fn(), getAdminEventConfig: vi.fn(), updateAdminFinalConfig: vi.fn()}));
vi.mock("../../../movement/api", () => api);

const config = (overrides: Record<string, unknown> = {}) => ({id: 1, title: "Final title", clueText: "Find the answer", startsAt: "2026-08-19T12:00:00.000Z", maxWinners: 10, pointsByRank: [40, 30, 25], isActive: true, currentKeyword: "DO NOT DISPLAY", ...overrides});
const submissions = () => [
  {id: 1, answerSubmitted: "EVERY MOVE COUNTS", isCorrect: true, winnerRank: 1, pointsAwarded: 40, submittedAt: "2026-08-19T12:05:00.000Z", team: {id: 7, name: "Team 07"}},
  {id: 2, answerSubmitted: "WRONG", isCorrect: false, winnerRank: null, pointsAwarded: 0, submittedAt: "2026-08-19T12:04:00.000Z", team: {id: 8, name: "Team 08"}},
];

function renderPage() { return render(<AntdApp><AdminV2FinalChallengePage /></AntdApp>); }
function mockLoad() {
  api.getAdminFinalConfig.mockResolvedValue(config());
  api.getAdminFinalSubmissions.mockResolvedValue(submissions());
  api.getAdminEventConfig.mockResolvedValue({finalStartsAt: "12:00"});
  api.updateAdminFinalConfig.mockResolvedValue(config());
}

describe("AdminV2FinalChallengePage", () => {
  beforeEach(async () => {
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    ensureAdminV2Resources(); await i18n.changeLanguage("en"); mockLoad();
  });
  afterEach(() => vi.clearAllMocks());

  it("loads supported config and does not redisplay the configured keyword", async () => {
    renderPage();
    expect(await screen.findByDisplayValue("Final title")).toBeVisible();
    expect(screen.getByText("12:00")).toBeVisible();
    expect(screen.getByText("Rank 1: 40")).toBeVisible();
    expect(screen.queryByText("DO NOT DISPLAY")).not.toBeInTheDocument();
  });

  it("preserves the current keyword when the rotation field is blank and sends a nonblank rotation unchanged for Backend normalization", async () => {
    const user = userEvent.setup(); renderPage();
    await screen.findByDisplayValue("Final title");
    await user.click(screen.getByRole("button", {name: /Save Final configuration/}));
    await waitFor(() => expect(api.updateAdminFinalConfig).toHaveBeenLastCalledWith({title: "Final title", clueText: "Find the answer", isActive: true}));
    await user.type(screen.getByLabelText("New keyword"), "  Every Move Counts  ");
    await user.click(screen.getByRole("button", {name: /Save Final configuration/}));
    await waitFor(() => expect(api.updateAdminFinalConfig).toHaveBeenLastCalledWith({title: "Final title", clueText: "Find the answer", isActive: true, answer: "  Every Move Counts  "}));
  });

  it("renders Backend-ordered submissions with their submitted answer, result, rank, and points", async () => {
    renderPage();
    expect(await screen.findByText("EVERY MOVE COUNTS")).toBeVisible();
    expect(screen.getByText("WRONG")).toBeVisible();
    expect(screen.getByText("Correct")).toBeVisible();
    expect(screen.getByText("Incorrect")).toBeVisible();
    expect(screen.getByText("40")).toBeVisible();
  });

  it("validates whitespace-only rotations before saving", async () => {
    const user = userEvent.setup(); renderPage();
    await screen.findByDisplayValue("Final title");
    await user.type(screen.getByLabelText("New keyword"), "   ");
    await user.click(screen.getByRole("button", {name: /Save Final configuration/}));
    expect(await screen.findByText("A new keyword cannot contain only whitespace.")).toBeInTheDocument();
    expect(api.updateAdminFinalConfig).not.toHaveBeenCalled();
  });

  it("prevents duplicate configuration submits and keeps the form usable after a Backend post-open error", async () => {
    let resolve!: (value: unknown) => void;
    api.updateAdminFinalConfig.mockImplementation(() => new Promise((done) => { resolve = done; }));
    const user = userEvent.setup(); renderPage();
    await screen.findByDisplayValue("Final title");
    const save = screen.getByRole("button", {name: /Save Final configuration/});
    await user.click(save); await user.click(save);
    expect(api.updateAdminFinalConfig).toHaveBeenCalledTimes(1);
    expect(save).toBeDisabled();
    resolve(config());
    await waitFor(() => expect(api.getAdminFinalConfig).toHaveBeenCalledTimes(2));
    api.updateAdminFinalConfig.mockRejectedValueOnce(new Error("Cannot update final config after it opens"));
    await user.click(screen.getByRole("button", {name: /Save Final configuration/}));
    expect((await screen.findAllByText("Unable to update Final configuration")).some((element) => element.closest("[role=alert]") !== null)).toBe(true);
  });

  it("keeps the helper behavior explicit for keyword validation and blank payloads", () => {
    expect(isValidOptionalKeywordRotation("")).toBe(true);
    expect(isValidOptionalKeywordRotation("  ")).toBe(false);
    expect(toFinalConfigUpdate({title: "A", clueText: "B", isActive: true, answer: "  "})).toEqual({title: "A", clueText: "B", isActive: true});
  });
});
