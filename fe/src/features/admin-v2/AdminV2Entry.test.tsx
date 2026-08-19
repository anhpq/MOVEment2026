import {render, screen} from "@testing-library/react";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import {afterEach, beforeEach, describe, expect, it} from "vitest";
import i18n from "../movement/i18n";
import {useMovementStore} from "../movement/store";
import {AdminV2Entry} from "./AdminV2Entry";

function renderAdminRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route path="/admin-v2/*" element={<AdminV2Entry />} /></Routes>
    </MemoryRouter>,
  );
}

describe("AdminV2Entry", () => {
  beforeEach(async () => {
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
  });

  it("redirects the namespace root to the Dashboard", async () => {
    renderAdminRoute("/admin-v2");

    expect(await screen.findByRole("heading", {name: "Event dashboard"})).toBeVisible();
    expect(screen.getByText("Monitor live operations and take the next action.")).toBeVisible();
  });

  it("keeps an unknown Admin V2 path inside the V2 fallback", async () => {
    renderAdminRoute("/admin-v2/not-a-module");

    expect(await screen.findByRole("heading", {name: "Admin V2 page not found"})).toBeVisible();
    expect(screen.getByRole("button", {name: /Back to Dashboard/})).toBeVisible();
  });
});
