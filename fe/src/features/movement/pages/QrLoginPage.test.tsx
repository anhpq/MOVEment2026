import {render, waitFor} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../i18n";
import {useMovementStore} from "../store";
import type {Session} from "../types";
import {QrLoginPage} from "./QrLoginPage";

const api = vi.hoisted(() => ({loginWithQrToken: vi.fn()}));
const playerData = vi.hoisted(() => ({fetchPlayerDatabase: vi.fn()}));

vi.mock("../api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api")>()),
  loginWithQrToken: api.loginWithQrToken,
}));

vi.mock("../playerData", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../playerData")>()),
  fetchPlayerDatabase: playerData.fetchPlayerDatabase,
}));

const existingSession: Session = {
  accessToken: "old-device-token",
  expiresAt: "2099-01-01T00:00:00.000Z",
  role: "user",
  teamId: "1",
  username: "team01",
};

describe("QrLoginPage", () => {
  beforeEach(async () => {
    api.loginWithQrToken.mockResolvedValue({
      accessToken: "replacement-token",
      expiresAt: "2099-01-01T00:00:00.000Z",
      team: {id: 2, username: "team02"},
    });
    playerData.fetchPlayerDatabase.mockResolvedValue({});
    useMovementStore.setState({session: existingSession});
    await i18n.changeLanguage("en");
  });

  afterEach(() => {
    useMovementStore.getState().logout();
    vi.clearAllMocks();
  });

  it("replaces an existing local session when a Team QR is scanned", async () => {
    render(
      <MemoryRouter initialEntries={["/qr-login?token=opaque-team-qr-token"]}>
        <QrLoginPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(api.loginWithQrToken).toHaveBeenCalledWith(
      "opaque-team-qr-token",
      "web-qr-url",
      expect.anything(),
    ));
    await waitFor(() => expect(useMovementStore.getState().session).toMatchObject({
      accessToken: "replacement-token",
      teamId: "2",
      username: "team02",
    }));
  });
});
