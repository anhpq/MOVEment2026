import {App as AntdApp} from "antd";
import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../../../movement/i18n";
import {ensureAdminV2Resources} from "../../i18n/resources";
import {AdminV2EventControlPage} from "./AdminV2EventControlPage";
import {validCancelCooldownMinutes, validNotifyBeforeMinutes, validTimezone} from "./eventControlValidation";

const api = vi.hoisted(() => ({getAdminEventConfig: vi.fn(), updateAdminEventConfig: vi.fn()}));
vi.mock("../../../movement/api", () => api);

const config = (overrides: Record<string, unknown> = {}) => ({
  eventEndTime: "23:54", finalStartsAt: "23:59", notifyBeforeMinutes: 15,
  cancelCooldownMinutes: 0, timezone: "Asia/Ho_Chi_Minh", serverNow: "2026-08-19T12:00:00.000Z",
  isPastEventEnd: false, isPastFinalStart: false, secondsUntilFinal: 3600, ...overrides,
});

function renderPage() { return render(<AntdApp><AdminV2EventControlPage /></AntdApp>); }

describe("AdminV2EventControlPage", () => {
  beforeEach(async () => { ensureAdminV2Resources(); await i18n.changeLanguage("en"); api.getAdminEventConfig.mockResolvedValue(config()); api.updateAdminEventConfig.mockResolvedValue(config()); });
  afterEach(() => vi.clearAllMocks());

  it("loads config and renders existing values without converting its timezone", async () => {
    renderPage();
    expect(await screen.findByDisplayValue("23:54")).toBeVisible();
    expect(screen.getByDisplayValue("23:59")).toBeVisible();
    expect(screen.getByDisplayValue("Asia/Ho_Chi_Minh")).toBeVisible();
    expect(screen.getByText("5 minutes before Final")).toBeVisible();
    expect(screen.getByText(/Server time: 2026-08-19T12:00:00.000Z/)).toBeVisible();
  });

  it("shows the timing advisory but allows a non-recommended configuration", async () => {
    api.getAdminEventConfig.mockResolvedValue(config({eventEndTime: "23:50"}));
    const user = userEvent.setup(); renderPage();
    expect(await screen.findByText("Review the timing gap")).toBeVisible();
    await user.click(screen.getByRole("button", {name: /Save configuration/}));
    await waitFor(() => expect(api.updateAdminEventConfig).toHaveBeenCalledWith(expect.objectContaining({eventEndTime: "23:50", finalStartsAt: "23:59"})));
  });

  it("validates notification, cooldown, and timezone bounds before saving", () => {
    expect(validNotifyBeforeMinutes(1)).toBe(true); expect(validNotifyBeforeMinutes(0)).toBe(false); expect(validNotifyBeforeMinutes(1.5)).toBe(false);
    expect(validCancelCooldownMinutes(0)).toBe(true); expect(validCancelCooldownMinutes(-1)).toBe(false);
    expect(validTimezone("Asia/Ho_Chi_Minh")).toBe(true); expect(validTimezone("Nope/Invalid")).toBe(false);
  });

  it("prevents duplicate save, refreshes after success, and shows save errors", async () => {
    let resolve!: (value: unknown) => void;
    api.updateAdminEventConfig.mockImplementation(() => new Promise((done) => { resolve = done; }));
    const user = userEvent.setup(); renderPage(); await screen.findByDisplayValue("23:54");
    const save = screen.getByRole("button", {name: /Save configuration/});
    await user.click(save); await user.click(save);
    expect(api.updateAdminEventConfig).toHaveBeenCalledTimes(1);
    expect(save).toBeDisabled();
    resolve(config());
    await waitFor(() => expect(api.getAdminEventConfig).toHaveBeenCalledTimes(2));
    api.updateAdminEventConfig.mockRejectedValueOnce(new Error("offline"));
    await user.click(screen.getByRole("button", {name: /Save configuration/}));
    expect((await screen.findAllByText("Unable to update event configuration")).some((element) => element.closest("[role=alert]") !== null)).toBe(true);
  });
});
