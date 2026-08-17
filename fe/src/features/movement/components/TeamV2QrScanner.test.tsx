import {App} from "antd";
import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {useState} from "react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../i18n";
import {TeamV2QrScanner} from "./TeamV2QrScanner";

const qrMocks = vi.hoisted(() => ({
  supported: false,
  createQrFrameDetector: vi.fn(),
  openQrCameraStream: vi.fn(),
}));

vi.mock("../qrDetect", () => ({
  createQrFrameDetector: qrMocks.createQrFrameDetector,
  getVideoMediaStream: () => null,
  normalizeDecodedQrValue: (value: string) => value.trim(),
  openQrCameraStream: qrMocks.openQrCameraStream,
  supportsCameraQrScan: () => qrMocks.supported,
}));

beforeEach(() => {
  qrMocks.supported = false;
  qrMocks.createQrFrameDetector.mockReset();
  qrMocks.openQrCameraStream.mockReset();
  class FakeMediaStream {
    active = false;
    getTracks() {
      return [];
    }
  }
  vi.stubGlobal("MediaStream", FakeMediaStream);
  Object.defineProperty(window, "isSecureContext", {
    configurable: true,
    value: true,
  });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function ScannerHarness({
  onSubmitToken,
}: {
  onSubmitToken: (token: string) => Promise<{
    status: "rejected";
    message: string;
  }>;
}) {
  const [value, setValue] = useState("");
  return (
    <App>
      <TeamV2QrScanner
        value={value}
        onChange={setValue}
        onSubmitToken={onSubmitToken}
        placeholder="QR"
      />
    </App>
  );
}

describe("TeamV2QrScanner manual duplicate guard", () => {
  it("does not resubmit the same manually rejected token", async () => {
    const onSubmitToken = vi.fn().mockResolvedValue({
      status: "rejected" as const,
      message: "rejected",
    });
    const user = userEvent.setup();
    render(<ScannerHarness onSubmitToken={onSubmitToken} />);

    await user.click(screen.getByRole("tab", {name: i18n.t("teamV2.pasteQrTab")}));
    const input = await screen.findByRole("textbox");
    await user.type(input, "MV26-SQ1-I-TEST");
    const submit = screen.getByRole("button", {name: i18n.t("teamV2.submitQr")});

    await user.click(submit);
    await waitFor(() => expect(onSubmitToken).toHaveBeenCalledTimes(1));
    await user.click(submit);

    expect(onSubmitToken).toHaveBeenCalledTimes(1);
  });

  it("stops the camera when switching to the paste tab", async () => {
    const stop = vi.fn();
    const dispose = vi.fn();
    qrMocks.supported = true;
    qrMocks.openQrCameraStream.mockResolvedValue({
      active: true,
      getTracks: () => [{stop}],
    });
    qrMocks.createQrFrameDetector.mockReturnValue({
      detect: vi.fn().mockResolvedValue(null),
      dispose,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "readyState", {
      configurable: true,
      get: () => HTMLMediaElement.HAVE_METADATA,
    });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();

    const user = userEvent.setup();
    render(<ScannerHarness onSubmitToken={vi.fn().mockResolvedValue({status: "rejected", message: "rejected"})} />);

    await waitFor(() => expect(qrMocks.openQrCameraStream).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole("tab", {name: i18n.t("teamV2.pasteQrTab")}));

    await waitFor(() => expect(stop).toHaveBeenCalled());
    expect(dispose).toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toBeVisible();
  });
});
