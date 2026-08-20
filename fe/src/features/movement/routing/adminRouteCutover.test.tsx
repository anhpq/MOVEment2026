import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {MemoryRouter, useLocation, useNavigate} from "react-router-dom";
import App from "../../../App";
import {adminV2PrimaryRoutes} from "../../admin-v2/routes/adminV2RouteConfig";
import i18n from "../i18n";
import {MovementRoutes} from "../routes";
import {useMovementStore} from "../store";
import type {Session} from "../types";
import {
  ADMIN_PRIMARY_PATH,
  ADMIN_V1_HOME_PATH,
  ADMIN_V1_LEGACY_PATH,
  ADMIN_V2_HOME_PATH,
  getRoleHomePath,
} from "./adminRoutePaths";

const adminSession: Session = {
  accessToken: "admin-test-token",
  expiresAt: "2099-01-01T00:00:00.000Z",
  role: "admin",
  teamId: null,
  username: "admin",
};

function RouterProbe() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div>
      <output data-testid="pathname">{location.pathname}</output>
      <button onClick={() => navigate(-1)} type="button">Back</button>
      <button onClick={() => navigate(1)} type="button">Forward</button>
      <button onClick={() => navigate("/admin-v2/teams")} type="button">Open V2 Teams</button>
    </div>
  );
}

function renderMovementRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RouterProbe />
      <MovementRoutes />
    </MemoryRouter>,
  );
}

function expectPath(path: string) {
  return waitFor(() => expect(screen.getByTestId("pathname")).toHaveTextContent(path));
}

describe("Admin controlled cutover routing", () => {
  beforeEach(async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline test")));
    useMovementStore.setState({session: adminSession});
    await i18n.changeLanguage("en");
  });

  afterEach(() => {
    useMovementStore.setState({session: null});
    vi.unstubAllGlobals();
  });

  it("makes /admin and the shared Admin home destination enter Admin V2", async () => {
    expect(getRoleHomePath("admin")).toBe(ADMIN_PRIMARY_PATH);
    renderMovementRoute(ADMIN_PRIMARY_PATH);
    await expectPath(ADMIN_V2_HOME_PATH);
  });

  it("keeps Admin V1 available from the explicit legacy entry", async () => {
    renderMovementRoute(ADMIN_V1_LEGACY_PATH);
    await expectPath(ADMIN_V1_HOME_PATH);
  });

  it("preserves expired-session cleanup at the cutover entry", async () => {
    useMovementStore.setState({
      session: {...adminSession, expiresAt: "2000-01-01T00:00:00.000Z"},
    });

    render(
      <MemoryRouter initialEntries={[ADMIN_PRIMARY_PATH]}>
        <RouterProbe />
        <App />
      </MemoryRouter>,
    );

    await expectPath("/login");
    expect(useMovementStore.getState().session).toBeNull();
  });

  it.each(adminV2PrimaryRoutes)("supports direct navigation to $path", async ({path}) => {
    renderMovementRoute(path);
    await expectPath(path);
  });

  it("keeps V2 navigation in V2 and supports browser Back/Forward", async () => {
    const user = userEvent.setup();
    renderMovementRoute(ADMIN_PRIMARY_PATH);
    await expectPath(ADMIN_V2_HOME_PATH);

    await user.click(screen.getByRole("button", {name: "Open V2 Teams"}));
    await expectPath("/admin-v2/teams");

    await user.click(screen.getByRole("button", {name: "Back"}));
    await expectPath(ADMIN_V2_HOME_PATH);

    await user.click(screen.getByRole("button", {name: "Forward"}));
    await expectPath("/admin-v2/teams");
  });
});
