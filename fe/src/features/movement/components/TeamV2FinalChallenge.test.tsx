import {App} from "antd";
import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {TeamV2FinalChallenge} from "./TeamV2FinalChallenge";

const mocks = vi.hoisted(() => ({
  getPlayerFinal: vi.fn(),
  submitFinalAnswer: vi.fn(),
  executePlayerMutation: vi.fn(),
}));

vi.mock("../api", () => ({
  getPlayerFinal: mocks.getPlayerFinal,
  submitFinalAnswer: mocks.submitFinalAnswer,
}));

vi.mock("../playerData", () => ({
  executePlayerMutation: mocks.executePlayerMutation,
}));

const finalResponse = {
  id: 1,
  title: "Final Challenge",
  clueText: null,
  startsAt: new Date(0).toISOString(),
  eventEndTime: "09:15",
  finalStartsAt: "09:20",
  maxWinners: 10,
  pointsByRank: [40, 30, 25, 22, 20, 18, 16, 14, 12, 10],
  isOpen: true,
  canSubmit: true,
  blockedByActiveStation: false,
  activeStationId: null,
  teamSubmission: null,
  wrongAttemptCount: 0,
  cooldownSeconds: 0,
  nextAttemptAt: null,
  serverNow: new Date(0).toISOString(),
  answerLength: 17,
  notifyBeforeMinutes: 15,
  secondsUntilFinal: 0,
  stationCheckInClosed: true,
  phase: "FINAL_STARTED" as const,
  pendingScoreStationId: null,
};

describe("TeamV2FinalChallenge input", () => {
  beforeEach(() => {
    mocks.getPlayerFinal.mockResolvedValue(finalResponse);
    mocks.submitFinalAnswer.mockResolvedValue({isCorrect: true});
    mocks.executePlayerMutation.mockImplementation(async (mutation: () => Promise<unknown>) => ({
      result: await mutation(),
    }));
  });

  it("keeps every rapidly typed character and marks all filled slots", async () => {
    const user = userEvent.setup();
    const {container} = render(
      <App>
        <TeamV2FinalChallenge language="vi" />
      </App>,
    );

    const input = await screen.findByRole("textbox");
    await user.type(input, "every move counts");

    expect(input).toHaveValue("EVERY MOVE COUNTS");
    expect(container.querySelectorAll(".team-v2-final-slot.is-filled")).toHaveLength(17);
    expect(container.querySelectorAll(".team-v2-final-slot.is-space")).toHaveLength(2);
    expect([...container.querySelectorAll(".team-v2-final-slot")].map((slot) => slot.textContent).join(""))
      .toBe("EVERYMOVECOUNTS");

    await user.keyboard("{Enter}");
    await waitFor(() => expect(mocks.submitFinalAnswer).toHaveBeenCalledWith("EVERY MOVE COUNTS"));
  });

  it("supports whole-answer paste without collapsing internal spaces", async () => {
    const user = userEvent.setup();
    render(
      <App>
        <TeamV2FinalChallenge language="en" />
      </App>,
    );

    const input = await screen.findByRole("textbox");
    await user.click(input);
    await user.paste("every move counts");

    expect(input).toHaveValue("EVERY MOVE COUNTS");
  });
});
