import {App} from "antd";
import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {useState} from "react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import i18n from "../i18n";
import {TeamV2QrScanner} from "./TeamV2QrScanner";

vi.mock("../qrDetect", () => ({
  createQrFrameDetector: vi.fn(),
  normalizeDecodedQrValue: (value: string) => value.trim(),
  openQrCameraStream: vi.fn(),
  supportsCameraQrScan: () => false,
}));

beforeEach(() => {
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

    const input = await screen.findByRole("textbox");
    await user.type(input, "MV26-SQ1-I-TEST");
    const submit = screen.getByRole("button", {name: i18n.t("teamV2.submitQr")});

    await user.click(submit);
    await waitFor(() => expect(onSubmitToken).toHaveBeenCalledTimes(1));
    await user.click(submit);

    expect(onSubmitToken).toHaveBeenCalledTimes(1);
  });
});
