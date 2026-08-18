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
    mocks.getPlayerFinal.mockReset();
    mocks.submitFinalAnswer.mockReset();
    mocks.executePlayerMutation.mockReset();
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

  it("revalidates an expired wrong-answer cooldown and submits a second answer", async () => {
    const staleAfterWrong = {
      ...finalResponse,
      canSubmit: false,
      wrongAttemptCount: 1,
      cooldownSeconds: 3,
      nextAttemptAt: new Date(Date.now() - 10).toISOString(),
    };
    const readyForRetry = {
      ...staleAfterWrong,
      canSubmit: true,
      nextAttemptAt: null,
    };
    const correctSubmission = {
      id: 9,
      teamId: 1,
      isCorrect: true,
      winnerRank: 1,
      pointsAwarded: 40,
      submittedAt: new Date().toISOString(),
    };
    const completed = {...readyForRetry, canSubmit: false, teamSubmission: correctSubmission};
    const onCompleted = vi.fn();
    mocks.getPlayerFinal
      .mockResolvedValueOnce(finalResponse)
      .mockResolvedValueOnce(staleAfterWrong)
      .mockResolvedValueOnce(readyForRetry)
      .mockResolvedValue(completed);
    mocks.submitFinalAnswer
      .mockResolvedValueOnce({isCorrect: false})
      .mockResolvedValueOnce({isCorrect: true});

    const user = userEvent.setup();
    render(
      <App>
        <TeamV2FinalChallenge language="vi" onCompleted={onCompleted} />
      </App>,
    );

    const input = await screen.findByRole("textbox");
    await user.type(input, "AAAAAAAAAAAAAAAAA");
    await user.keyboard("{Enter}");
    await waitFor(() => expect(mocks.getPlayerFinal).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(input).toBeEnabled());

    await user.type(input, "every move counts");
    const submit = screen.getByRole("button", {name: /final\.submit/});
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => expect(mocks.submitFinalAnswer).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(onCompleted).toHaveBeenCalled());
    expect(document.querySelector(".team-v2-final-trophy")).toBeTruthy();
  });
});
