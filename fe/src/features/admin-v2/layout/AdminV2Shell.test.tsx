import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {render, screen, within} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import userEvent from "@testing-library/user-event";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../../movement/i18n";
import {useMovementStore} from "../../movement/store";
import {ensureAdminV2Resources} from "../i18n/resources";
import {AdminV2Shell} from "./AdminV2Shell";

describe("AdminV2Shell", () => {
  beforeEach(async () => {
    ensureAdminV2Resources();
    vi.stubGlobal("ResizeObserver", class {
      disconnect() {}
      observe() {}
      unobserve() {}
    });
    useMovementStore.setState({
      session: {
        accessToken: "test-token",
        expiresAt: "2099-01-01T00:00:00.000Z",
        role: "admin",
        teamId: null,
        username: "admin",
      },
    });
    await i18n.changeLanguage("en");
  });

  afterEach(() => {
    useMovementStore.setState({session: null});
    vi.unstubAllGlobals();
  });

  it("marks the Operations navigation item active for a child route", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin-v2/operations/score-queue"]}>
        <AdminV2Shell><div>content</div></AdminV2Shell>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("link", {name: "Operations"}).some((link) => link.getAttribute("aria-current") === "page")).toBe(true);
    expect(screen.getByRole("link", {name: "Score Queue"})).toBeVisible();
    expect(screen.getByRole("link", {name: "Skip to main content"})).toHaveAttribute("href", "#admin-v2-main");
    await user.hover(screen.getAllByRole("link", {name: "Dashboard"})[0]);
    expect(await screen.findByRole("tooltip", {name: "Dashboard"})).toBeInTheDocument();
  });

  it.each([
    ["Teams", "/admin-v2/teams/2/edit"],
    ["Stations", "/admin-v2/stations/ST001/qr"],
  ])("keeps %s active on a nested detail route", (label, path) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <AdminV2Shell><div>content</div></AdminV2Shell>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("link", {name: label}).some((link) => link.getAttribute("aria-current") === "page")).toBe(true);
  });

  it("applies the cyan route tone only to the Teams navigation icon", () => {
    render(
      <MemoryRouter initialEntries={["/admin-v2/leaderboard"]}>
        <AdminV2Shell><div>content</div></AdminV2Shell>
      </MemoryRouter>,
    );

    const teamsLink = screen.getAllByRole("link", {name: "Teams"})[0];
    const leaderboardLink = screen.getAllByRole("link", {name: "Leaderboard"})[0];
    expect(teamsLink.querySelector(".admin-v2-nav-icon")).toHaveClass("is-cyan");
    expect(leaderboardLink.querySelector(".admin-v2-nav-icon")).not.toHaveClass("is-cyan");
  });

  it("uses the localized Vietnamese navigation labels", async () => {
    await i18n.changeLanguage("vi");
    render(
      <MemoryRouter initialEntries={["/admin-v2/teams"]}>
        <AdminV2Shell><div>content</div></AdminV2Shell>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("link", {name: "Quản lý đội"})).not.toHaveLength(0);
    expect(screen.getAllByText("Trạm")).not.toHaveLength(0);
  });

  it("keeps the full sidebar at 1024px and uses rail/mobile only below it", () => {
    const styles = readFileSync(resolve(process.cwd(), "src/features/admin-v2/styles/admin-v2.css"), "utf8");
    const tokens = readFileSync(resolve(process.cwd(), "src/features/admin-v2/styles/tokens.css"), "utf8");
    const sidebar = readFileSync(resolve(process.cwd(), "src/features/admin-v2/layout/AdminV2Sidebar.tsx"), "utf8");
    const mobileNavigation = readFileSync(resolve(process.cwd(), "src/features/admin-v2/layout/AdminV2MobileNav.tsx"), "utf8");
    const foundationPage = readFileSync(resolve(process.cwd(), "src/features/admin-v2/pages/foundation/AdminV2FoundationPage.tsx"), "utf8");

    expect(styles).toContain("grid-template-columns: 200px minmax(0, 1fr)");
    expect(styles).toContain("@media (max-width: 1023px) and (min-width: 769px)");
    expect(styles).toContain("@media (max-width: 768px)");
    expect(styles).toContain("grid-template-columns: repeat(6, minmax(0, 1fr))");
    expect(styles).not.toContain(".admin-v2-root a { color: inherit; }");
    expect(styles).not.toContain(":where(.admin-v2-root a) { color: inherit; }");
    expect(styles).toMatch(/\.admin-v2-nav-link\s*\{[^}]*color:\s*inherit;/s);
    expect(styles).toContain("color: var(--admin-v2-nav-inactive)");
    expect(tokens).toContain("--admin-v2-nav-inactive: #9fb0c7");
    expect(styles).toMatch(/\.admin-v2-mobile-nav__link\.is-active\s*\{[^}]*background:\s*var\(--admin-v2-coral\);[^}]*color:\s*#fff;/s);
    expect(styles).toContain(".admin-v2-header__mobile-account { display: inline-flex; }");
    expect(styles).not.toContain(".admin-v2-nav-tooltip");
    expect(styles).not.toContain(".admin-v2-action-link");
    expect(sidebar).toContain('import {Tooltip} from "antd"');
    expect(mobileNavigation).toContain('import {Tooltip} from "antd"');
    expect(mobileNavigation).not.toContain("Popover");
    expect(mobileNavigation).not.toContain("MoreOutlined");
    expect(mobileNavigation).not.toContain("style={{");
    expect(mobileNavigation).toContain('<Tooltip key={route.key} placement="top" title={label}>');
    expect(mobileNavigation).not.toContain("admin-v2-mobile-nav__label");
    expect(styles).toMatch(/\.admin-v2-mobile-nav__link\s*\{[^}]*min-height:\s*44px;[^}]*min-width:\s*44px;/s);
    expect(styles).toContain("overflow: hidden");
    expect(foundationPage).toContain('import {Alert, Typography} from "antd"');
  });

  it("exposes the compact account popover with identity, build, and logout", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin-v2/dashboard"]}>
        <AdminV2Shell><div>content</div></AdminV2Shell>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", {name: "Open admin account menu"}));

    const accountPopover = document.querySelector(".ant-popover:not(.ant-popover-hidden)");
    expect(accountPopover).toBeInTheDocument();
    expect(await screen.findByText("Admin account: admin")).toBeInTheDocument();
    expect(screen.getAllByText(/Build:/)).toHaveLength(2);
    expect(screen.getByRole("button", {name: /Log out/})).toBeVisible();
    expect(within(accountPopover as HTMLElement).getByRole("menuitem", {name: /Log out/})).toBeInTheDocument();
  });

  it.each([
    ["Dashboard", "/admin-v2/dashboard"],
    ["Teams", "/admin-v2/teams"],
    ["Stations", "/admin-v2/stations"],
    ["Leaderboard", "/admin-v2/leaderboard"],
    ["Operations", "/admin-v2/operations"],
    ["Settings", "/admin-v2/settings"],
  ])("renders %s as a direct active mobile destination", async (label, path) => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={[path]}>
        <AdminV2Shell><div>content</div></AdminV2Shell>
      </MemoryRouter>,
    );

    const mobileNav = document.querySelector(".admin-v2-mobile-nav");
    expect(mobileNav?.querySelectorAll("a")).toHaveLength(6);
    expect(mobileNav?.querySelectorAll("button")).toHaveLength(0);
    const destination = within(mobileNav as HTMLElement).getByRole("link", {name: label});
    expect(destination).toHaveAttribute("href", path);
    expect(destination).toHaveAttribute("aria-label", label);
    expect(destination).toHaveAttribute("aria-current", "page");
    expect(destination).toHaveClass("is-active");
    await user.hover(destination);
    expect(await screen.findByRole("tooltip", {name: label})).toBeInTheDocument();
  });
});
