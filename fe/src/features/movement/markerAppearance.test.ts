import {describe, expect, it} from "vitest";
import {
  COMPLETED_MARKER_OPACITY,
  getStationMarkerAppearance,
  isStationMarkerCompleted,
  SELECTED_COMPLETED_MARKER_OPACITY,
} from "./markerAppearance";

describe("station marker appearance", () => {
  it("uses backend completion as the authoritative signal", () => {
    expect(
      isStationMarkerCompleted({status: "New", backendStatus: "COMPLETED"}),
    ).toBe(true);
    expect(
      isStationMarkerCompleted({status: "Finished", backendStatus: "AVAILABLE"}),
    ).toBe(false);
  });

  it("falls back to the display status only when backend status is absent", () => {
    expect(isStationMarkerCompleted({status: "Finished"})).toBe(true);
    expect(isStationMarkerCompleted({status: "New"})).toBe(false);
  });

  it("dims completed markers and brightens them while selected", () => {
    expect(
      getStationMarkerAppearance({status: "Finished"}).opacity,
    ).toBe(COMPLETED_MARKER_OPACITY);
    expect(
      getStationMarkerAppearance({status: "Finished"}, true).opacity,
    ).toBe(SELECTED_COMPLETED_MARKER_OPACITY);
  });

  it("keeps locked appearance authoritative and fully opaque", () => {
    expect(
      getStationMarkerAppearance(
        {status: "Finished", backendStatus: "LOCKED"},
        true,
      ),
    ).toEqual({
      isCompleted: false,
      isLocked: true,
      opacity: 1,
      usesSilverPurple: true,
    });
  });

  it("keeps active and available markers fully opaque", () => {
    expect(
      getStationMarkerAppearance({status: "In Progress", backendStatus: "PLAYING"}),
    ).toMatchObject({isCompleted: false, isLocked: false, opacity: 1});
    expect(
      getStationMarkerAppearance({status: "New", backendStatus: "AVAILABLE"}),
    ).toMatchObject({isCompleted: false, isLocked: false, opacity: 1});
  });
});
