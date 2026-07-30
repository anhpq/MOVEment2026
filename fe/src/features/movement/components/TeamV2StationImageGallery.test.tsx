import {App} from "antd";
import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../i18n";
import {fetchPlayerStationImageUrls} from "../playerData";
import {TeamV2StationImageGallery} from "./TeamV2StationImageGallery";

vi.mock("../playerData", () => ({
  fetchPlayerStationImageUrls: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(fetchPlayerStationImageUrls).mockReset();
});

function renderGallery(imageCount: number) {
  render(
    <App>
      <TeamV2StationImageGallery
        stationId="ST001"
        imageCount={imageCount}
        imageUrls={[]}
      />
    </App>,
  );
  return screen.getByRole("button", {name: i18n.t("common.viewImages")});
}

describe("TeamV2StationImageGallery", () => {
  it("disables the V2 gallery action when the Station has no images", () => {
    expect(renderGallery(0)).toBeDisabled();
  });

  it("loads Station images lazily when the V2 gallery opens", async () => {
    vi.mocked(fetchPlayerStationImageUrls).mockResolvedValue([
      "https://example.com/station.jpg",
    ]);
    const user = userEvent.setup();

    await user.click(renderGallery(1));

    await waitFor(() => {
      expect(fetchPlayerStationImageUrls).toHaveBeenCalledWith("ST001");
    });
  });
});
