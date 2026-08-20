import {App as AntdApp} from "antd";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../../../movement/i18n";
import {ensureAdminV2Resources} from "../../i18n/resources";
import {AdminV2SettingsPage} from "./AdminV2SettingsPage";

function renderPage() { return render(<AntdApp><AdminV2SettingsPage /></AntdApp>); }

describe("AdminV2SettingsPage", () => {
  beforeEach(async () => {
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
    ensureAdminV2Resources(); await i18n.changeLanguage("en"); window.localStorage.clear();
  });
  afterEach(() => vi.clearAllMocks());

  it("contains only Admin V2 preferences and diagnostics", () => {
    renderPage();
    expect(screen.getByRole("heading", {name: "System Settings"})).toBeVisible();
    expect(screen.getByText(/Team, Station, map, QR, Event Control, and Final Challenge/)).toBeVisible();
    expect(screen.queryByRole("link", {name: /Teams|Stations|Station Map|QR/})).not.toBeInTheDocument();
  });

  it("persists the navigation density locally without an API request", async () => {
    const user = userEvent.setup(); renderPage();
    await user.click(screen.getByLabelText("Navigation density"));
    await user.click(screen.getByText("Compact"));
    await user.click(screen.getByRole("button", {name: /Save preferences/}));
    expect(JSON.parse(window.localStorage.getItem("movement.admin-v2.settings") ?? "{}")).toEqual({navigationDensity: "compact"});
    expect(screen.getAllByText("Preferences saved").some((element) => element.closest(".ant-alert")?.closest(".admin-v2-settings") !== null)).toBe(true);
  });

  it("resets local preferences to the supported default", async () => {
    window.localStorage.setItem("movement.admin-v2.settings", JSON.stringify({navigationDensity: "compact"}));
    const user = userEvent.setup(); renderPage();
    await user.click(screen.getByRole("button", {name: /Reset preferences/}));
    expect(window.localStorage.getItem("movement.admin-v2.settings")).toBeNull();
  });
});
