# iOS Safari QR Camera Fix Guide

Last updated: 2026-07-21

## Summary

Android Chrome can scan QR with the camera. iPhone Safari cannot and shows:

> This browser does not support camera QR scanning

**Root cause:** the frontend requires the Chromium-only `BarcodeDetector` API. Safari does not implement it, so the app fails before opening the camera.

This guide explains diagnosis, the recommended fix, exact files to change, and how to verify on iPhone.

---

## 1. Problem statement

| Platform | Browser | Camera QR today | Why |
| --- | --- | --- | --- |
| Android phone | Chrome | Works | `window.BarcodeDetector` exists |
| iPhone | Safari | Fails | `window.BarcodeDetector` is `undefined` |
| Desktop | Safari / Firefox | Fails | Same missing API |
| Desktop | Chrome / Edge | Works | Same as Android Chrome |

Manual fallback still works on all browsers:

- Login: **Paste QR**
- Station flow: type/paste token into the input

---

## 2. Where the failure happens

### Login scan

File: `fe/src/features/movement/pages/LoginPage.tsx`

Flow:

1. User taps **Scan QR login**
2. `startQrScanner()` runs
3. Code checks `BarcodeDetector` and `getUserMedia`
4. If `BarcodeDetector` is missing, it shows the error and returns
5. Camera is never opened

Relevant logic:

```ts
const BarcodeDetector = getBarcodeDetector();
if (!BarcodeDetector || !navigator.mediaDevices?.getUserMedia) {
  message.error("This browser does not support camera QR scanning");
  return;
}
```

### Station check-in / check-out scan

File: `fe/src/features/movement/components/QrTokenInput.tsx`

Flow:

1. Component computes `canUseBarcodeDetector = Boolean(getBarcodeDetector())`
2. On Safari this is `false`
3. **Scan with Camera** is disabled
4. Warning alert tells the user to enter the token manually

Same dependency: native `BarcodeDetector` only.

---

## 3. Confirm on a real iPhone (before coding)

Open the deployed or local HTTPS site in Safari, then run in Web Inspector console:

```js
!!window.BarcodeDetector
// Expected Safari: false
// Expected Chrome Android: true

!!navigator.mediaDevices?.getUserMedia
// Expected on HTTPS / localhost: true
// Expected on plain http://LAN-IP in Safari: often false
```

Then tap **Scan QR login**:

- Current bug: error toast immediately, no camera preview
- After fix: camera preview appears, QR can decode

### HTTPS requirement (separate from BarcodeDetector)

Even after adding a JS decoder, iOS Safari only allows camera access in a **secure context**:

- `https://...` — OK
- `http://localhost` — OK on some setups
- `http://192.168.x.x` — usually blocked on iPhone

If you test a LAN build on iPhone, use HTTPS (tunnel, reverse proxy, or deployed frontend), not raw HTTP LAN IP.

---

## 4. Recommended fix approach

Keep the camera pipeline (`getUserMedia` + `<video playsInline>`), but change decode strategy:

1. Prefer native `BarcodeDetector` when available (Chrome / Android)
2. Fall back to a pure JS decoder (`jsQR`) when `BarcodeDetector` is missing (Safari / iOS)
3. Gate camera UI on `navigator.mediaDevices.getUserMedia`, not on `BarcodeDetector`
4. Keep paste/manual token input as the last-resort fallback

### Why this approach

- Minimal product change: same buttons and flows
- Android behavior stays fast via native detector
- Safari gets working camera scan without a native API
- No backend / QR payload changes

### Alternative libraries (optional)

| Library | Notes |
| --- | --- |
| `jsqr` | Lightweight, common canvas-frame decoder; recommended default |
| `@zxing/browser` | Heavier, more barcode formats |
| `qr-scanner` (nimiq) | Wrapper that already prefers BarcodeDetector then falls back |

This guide uses `jsqr`.

---

## 5. Implementation steps

### Step A — Install dependency

From `fe/`:

```bash
npm install jsqr
```

`jsqr` ships its own TypeScript types (`dist/index.d.ts`). No `@types/jsqr` package is needed.

### Step B — Add a shared detector helper

Create:

`fe/src/features/movement/qrDetect.ts`

Responsibilities:

- `supportsCameraQrScan()` → `Boolean(navigator.mediaDevices?.getUserMedia)`
- `openQrCameraStream()` → `getUserMedia` with rear camera preference
- `createQrFrameDetector().detect(video)` →
  - try `BarcodeDetector` first
  - else draw video frame to canvas and run `jsQR`

Reference implementation:

```ts
import jsQR from "jsqr";

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{rawValue?: string}>>;
};

type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorLike;

function getBarcodeDetector(): BarcodeDetectorConstructor | null {
  const candidate = (
    globalThis as typeof globalThis & {
      BarcodeDetector?: BarcodeDetectorConstructor;
    }
  ).BarcodeDetector;

  return candidate ?? null;
}

/** Camera QR works when getUserMedia is available (HTTPS or localhost). */
export function supportsCameraQrScan(): boolean {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

/**
 * Prefers native BarcodeDetector (Chrome/Android).
 * Falls back to jsQR for Safari/iOS.
 */
export function createQrFrameDetector() {
  const Detector = getBarcodeDetector();
  const barcodeDetector = Detector
    ? new Detector({formats: ["qr_code"]})
    : null;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", {willReadFrequently: true});

  return {
    async detect(video: HTMLVideoElement): Promise<string | null> {
      if (barcodeDetector) {
        try {
          const codes = await barcodeDetector.detect(video);
          const value = codes[0]?.rawValue?.trim();
          if (value) {
            return value;
          }
        } catch {
          // Native detector can fail on some frames; try jsQR below.
        }
      }

      if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
        return null;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      return result?.data?.trim() || null;
    },
  };
}

export async function openQrCameraStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: {ideal: "environment"},
    },
    audio: false,
  });
}
```

Notes:

- Use `facingMode: {ideal: "environment"}` instead of a hard `"environment"` requirement; iOS is more tolerant.
- Keep `<video muted playsInline>` — required for iOS inline playback.
- Reuse one canvas inside the detector for performance.

### Step C — Update `LoginPage.tsx`

File: `fe/src/features/movement/pages/LoginPage.tsx`

Changes:

1. Remove local `BarcodeDetector` types / `getBarcodeDetector()` if no longer needed.
2. Import helpers from `../qrDetect`.
3. In `startQrScanner()`:
   - check `supportsCameraQrScan()` instead of `BarcodeDetector`
   - open stream with `openQrCameraStream()`
   - decode with `createQrFrameDetector()`
4. Keep existing `parseQrLoginPayload()` and `submitQrPayload()` unchanged.
5. Keep **Paste QR** unchanged.

Suggested `startQrScanner` shape:

```ts
const startQrScanner = async () => {
  if (!supportsCameraQrScan()) {
    message.error(
      "This browser does not support camera QR scanning. Use Paste QR or open the site over HTTPS.",
    );
    return;
  }

  setIsScanningQr(true);
  await new Promise((resolve) => window.requestAnimationFrame(resolve));

  const video = videoRef.current;
  if (!video) {
    setIsScanningQr(false);
    return;
  }

  try {
    const stream = await openQrCameraStream();
    streamRef.current = stream;
    video.srcObject = stream;
    await video.play();

    const detector = createQrFrameDetector();
    let isDetecting = false;
    scanTimerRef.current = window.setInterval(() => {
      if (isDetecting) {
        return;
      }
      isDetecting = true;
      void detector
        .detect(video)
        .then((firstCode) => {
          if (firstCode) {
            void submitQrPayload(firstCode);
          }
        })
        .finally(() => {
          isDetecting = false;
        });
    }, 350);
  } catch (error) {
    stopQrScanner();
    const messageText =
      error instanceof Error ? error.message : "Unable to start camera";
    message.error(messageText);
  }
};
```

Overlap guard (`isDetecting`) avoids stacking slow `jsQR` calls.

### Step D — Update `QrTokenInput.tsx`

File: `fe/src/features/movement/components/QrTokenInput.tsx`

Changes:

1. Replace local `BarcodeDetector` helpers with imports from `../qrDetect`.
2. Replace `canUseBarcodeDetector` with `canUseCamera = supportsCameraQrScan()`.
3. Enable the camera button when `canUseCamera` is true.
4. In the camera effect, use `openQrCameraStream()` + `createQrFrameDetector()`.
5. Update the warning copy so it mentions HTTPS / manual entry, not “browser does not expose QR camera scanning” as a Safari dead-end.

Behavior after fix:

- Safari: button enabled, camera opens, `jsQR` decodes
- Chrome Android: button enabled, native detector preferred
- No `getUserMedia`: button disabled + manual input warning

### Step E — Do not change these

No backend or payload changes required:

- `POST /api/auth/team-qr-login`
- station check-in / check-out QR endpoints
- token formats in `docs/analysis/QR_PAYLOADS.md`
  - team: `MV26-TEAM-01-LOGIN`
  - station: `MV26-STATION-<id>-CHECK_IN` / `CHECK_OUT`

---

## 6. Verification checklist

### Build / lint

From `fe/`:

```bash
npm run lint
npm run build
```

### Android regression

1. Open site in Chrome.
2. Login → **Scan QR login** with `MV26-TEAM-01-LOGIN`.
3. Confirm login succeeds.
4. Open a station → **Scan with Camera** for check-in / check-out.
5. Confirm native path still works (no functional regression).

### iPhone Safari acceptance

Prerequisites:

- Site served over **HTTPS**
- Camera permission allowed when prompted
- Good lighting / QR not too small on screen

Cases:

1. Login scan with team QR → camera preview → successful team login
2. Station check-in scan → token filled / submitted
3. Station check-out scan → token filled / submitted
4. Deny camera permission → clear error, manual paste still works
5. Paste QR / manual token still works without camera

### Console checks after fix

```js
!!window.BarcodeDetector          // false on Safari is OK
!!navigator.mediaDevices?.getUserMedia  // must be true
```

Safari can still scan successfully with `BarcodeDetector === false` once `jsQR` fallback is wired.

---

## 7. Common pitfalls

| Symptom | Likely cause | What to do |
| --- | --- | --- |
| Still get “does not support camera QR scanning” | Code still gates on `BarcodeDetector` | Switch gate to `getUserMedia` |
| Camera never opens on iPhone over LAN | `http://192.168.x.x` insecure context | Serve HTTPS |
| Preview black / no decode | Missing `playsInline` / `muted` | Keep both on `<video>` |
| Permission denied | User blocked camera | Show error; keep paste fallback |
| Decode slow / laggy | Overlapping `jsQR` frames | Use detecting lock / ~300–500ms interval |
| Front camera opens | Facing mode too strict / unsupported | Use `{ideal: "environment"}` |
| Works in Chrome iOS? | Chrome on iOS still uses WebKit | Same Safari limitations apply; fallback still required |

Important: **Chrome on iPhone is still WebKit**. It also lacks `BarcodeDetector`. The `jsQR` fallback is required for all iOS browsers, not only Safari branding.

---

## 8. Suggested docs updates after implementing

When the code fix lands, update:

- `docs/analysis/IMPLEMENTATION_BACKLOG.md`  
  Note that QR camera uses `BarcodeDetector` + `jsQR` Safari fallback.
- `docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md`  
  Add a decision row for QR camera strategy and HTTPS requirement.
- `docs/analysis/BACKEND_AUDIT.md`  
  Record the Safari verification result.

Payload docs (`QR_PAYLOADS.md`, `TEAM_LOGIN_DATA.md`) do not need content changes unless token formats change.

---

## 9. Out of scope

- Changing QR token formats
- Native iOS app / Capacitor wrapper
- Server-side QR decoding
- Removing manual paste fallback (keep it for accessibility and permission failures)

---

## 10. Definition of done

- [ ] Shared `qrDetect` helper exists and uses `BarcodeDetector` then `jsQR`
- [ ] `LoginPage` camera gate no longer requires `BarcodeDetector`
- [ ] `QrTokenInput` camera button works without `BarcodeDetector`
- [ ] `npm run lint` and `npm run build` pass in `fe/`
- [ ] iPhone Safari over HTTPS can scan login + station QR
- [ ] Android Chrome still works
- [ ] Paste / manual token still works
- [ ] Analysis docs updated with the decision and verification note
