# MOVEment 2026 - iOS Safari QR Camera Fix

## Vai trò của tài liệu

Tài liệu này là **Feature Analysis** cho QR Camera Scanning trên:

- Safari trên iPhone/iPad;
- Chrome trên iOS;
- các browser hỗ trợ `getUserMedia`;
- Login QR scanner;
- Station Check-in và Check-out QR scanner.

Tài liệu này mô tả:

- confirmed browser behavior;
- accepted camera and decoder strategy;
- scanner lifecycle;
- UI state;
- error handling;
- cleanup requirement;
- verification checklist;
- current implementation status.

Tài liệu này không phải Source of Truth cho toàn bộ Business Rule.

Business Rule chính thức nằm tại:

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
```

Feature routing nằm tại:

```text
docs/analysis/FEATURE_INDEX.md
```

Implementation history nằm tại:

```text
docs/analysis/BACKEND_AUDIT.md
```

Nếu tài liệu này mâu thuẫn với `OPEN_QUESTIONS_AND_DECISIONS.md`, Source of Truth được ưu tiên.

---

# 1. Mục tiêu

QR Camera Scanning phải hoạt động khi browser:

1. đang chạy trong Secure Context;
2. hỗ trợ `navigator.mediaDevices.getUserMedia`;
3. được user cấp camera permission;
4. có camera stream hoạt động;
5. có ít nhất một decoder khả dụng.

Scanner không được phụ thuộc hoàn toàn vào native `BarcodeDetector`.

iPhone Safari và Chrome trên iOS vẫn phải có khả năng quét QR bằng camera thông qua `jsQR` canvas-frame fallback khi `BarcodeDetector` không tồn tại.

Manual paste hoặc manual token entry phải luôn được giữ làm fallback.

---

# 2. Confirmed Business Rules

| Chủ đề | Quyết định |
| --- | --- |
| Secure Context | Camera scanning chỉ được bật trong HTTPS hoặc localhost Secure Context. |
| Camera Capability | Camera availability được xác định bằng `navigator.mediaDevices.getUserMedia`, không được xác định chỉ bằng `BarcodeDetector`. |
| Preferred Decoder | Ưu tiên native `BarcodeDetector` khi browser hỗ trợ và hoạt động. |
| Fallback Decoder | Dùng `jsQR` canvas-frame decoding khi native `BarcodeDetector` không khả dụng hoặc không được chọn. |
| iOS | Safari và Chrome trên iOS phải dùng được camera scanner thông qua `getUserMedia` và `jsQR` fallback. |
| Camera Selection | Ưu tiên camera sau bằng `facingMode: { ideal: "environment" }`, nhưng không được fail chỉ vì browser không đáp ứng chính xác camera constraint. |
| User Gesture | Camera start phải bắt đầu từ user action rõ ràng như nhấn nút mở scanner. |
| Video Element | Video preview phải dùng `autoPlay`, `muted` và `playsInline`. |
| Decoder Start | Chỉ bắt đầu decode sau khi video metadata sẵn sàng, `video.play()` thành công và video có kích thước khác 0. |
| Manual Fallback | Luôn giữ Paste QR hoặc manual token entry. |
| Error UX | Lỗi camera và scanner phải hiển thị thông báo an toàn, dễ hiểu và cho phép retry khi phù hợp. |
| Cleanup | Phải dừng camera tracks, timer và animation frame khi stop, success, error, close hoặc unmount. |
| Duplicate Protection | Một QR decode thành công không được tạo nhiều submit hoặc API request do nhiều frame, rerender hoặc React Strict Mode. |
| Security | Không log raw QR token trong production. |

---

# 3. Root Cause đã xác nhận

## 3.1 Native Decoder bị dùng sai như Camera Capability

Behavior cũ kiểm tra `BarcodeDetector` trước khi cho phép mở camera.

Điều này sai vì:

```text
Camera capability != Native QR decoder capability
```

Một browser có thể:

- hỗ trợ `getUserMedia`;
- mở được camera;
- hiển thị được video preview;
- nhưng không hỗ trợ native `BarcodeDetector`.

Trong trường hợp đó, camera vẫn phải mở và `jsQR` phải thực hiện decoding.

Correct capability gate:

```text
navigator.mediaDevices?.getUserMedia
```

Không dùng điều kiện sau làm camera gate duy nhất:

```text
"BarcodeDetector" in window
```

---

## 3.2 Scanner Lifecycle không ổn định

Behavior cũ có thể khởi động camera thông qua React effect sau khi state mở modal thay đổi.

Cleanup của effect có thể chạy khi component rerender và dừng stream ngay trong quá trình khởi động bình thường.

Triệu chứng có thể thấy:

- camera preview hiện màu đen;
- preview xuất hiện rất ngắn;
- scanner tự đóng hoặc reset;
- camera permission đã cấp nhưng không decode;
- stream vừa mở đã bị stop.

Camera start phải được điều khiển từ explicit user action và scanner resources phải được quản lý bằng stable refs.

---

## 3.3 Decode bắt đầu quá sớm

Decode không được bắt đầu ngay khi vừa gán `srcObject`.

Phải chờ:

1. `loadedmetadata`;
2. `video.play()` resolve;
3. `video.videoWidth > 0`;
4. `video.videoHeight > 0`.

Nếu canvas đọc frame khi dimensions vẫn bằng 0, scanner có thể fail hoặc tạo vòng decode không có dữ liệu hợp lệ.

---

# 4. Accepted Architecture

## 4.1 Shared QR Detection Layer

Login QR và Station QR scanner nên sử dụng chung một detection layer.

Shared layer chịu trách nhiệm:

- kiểm tra camera capability;
- phát hiện native `BarcodeDetector`;
- chọn decoder;
- khởi động decode loop;
- chống overlapping decode;
- trả decoded text;
- dừng scanner an toàn.

UI component chịu trách nhiệm:

- mở hoặc đóng scanner;
- hiển thị preview;
- hiển thị state;
- hiển thị error;
- chuyển decoded payload vào Feature flow tương ứng.

QR detection layer không tự quyết định:

- đây là Team QR hay Station QR;
- đây là Check-in hay Check-out;
- token có hợp lệ hay không;
- API nào được gọi;
- user có quyền thực hiện action hay không.

Những quyết định đó thuộc Feature parser và backend validation.

---

## 4.2 Decoder Selection

Decoder strategy:

```text
if native BarcodeDetector is available and usable
    use BarcodeDetector
else
    use jsQR canvas-frame decoding
```

Native decoder failure không được làm mất manual fallback.

Implementation có thể fallback sang `jsQR` nếu native decoder khởi tạo hoặc decode thất bại theo cách cho thấy browser implementation không dùng được.

Không được chạy nhiều decoder loop song song trên cùng một video stream nếu không có lý do và cơ chế synchronization rõ ràng.

---

## 4.3 Camera Constraints

Preferred initial constraints:

```ts
{
  audio: false,
  video: {
    facingMode: { ideal: "environment" }
  }
}
```

`ideal` được ưu tiên thay vì `exact` để tránh fail trên thiết bị hoặc browser không cung cấp camera sau theo đúng constraint.

Implementation có thể bổ sung resolution preference hợp lý, nhưng không được yêu cầu resolution quá cao khiến camera không mở được trên thiết bị thật.

---

# 5. Scanner State Machine

Scanner phải có explicit state.

Recommended states:

```text
idle
requestingPermission
active
decoding
success
error
```

## `idle`

- camera chưa mở;
- không có active stream;
- không có decode loop;
- user có thể nhấn mở scanner.

## `requestingPermission`

- đã gọi `getUserMedia`;
- đang chờ permission hoặc camera initialization;
- disable nút start lặp;
- có thể hiển thị `Đang mở camera...`.

## `active`

- stream đã gắn vào video;
- metadata đã sẵn sàng;
- video playback đã bắt đầu;
- preview đang hoạt động.

## `decoding`

- decoder đang đọc frame;
- chỉ một decode operation được chạy tại một thời điểm;
- frame mới không được tạo overlapping work khi frame trước chưa hoàn thành.

## `success`

- đã nhận một QR payload;
- khóa duplicate success;
- dừng decode loop;
- dừng camera stream;
- chuyển payload đúng một lần sang Feature handler.

## `error`

- scanner không thể tiếp tục;
- cleanup resources;
- hiển thị safe error;
- cho phép retry nếu error có thể phục hồi;
- manual input vẫn khả dụng.

---

# 6. Start Flow

Camera phải được mở từ button handler hoặc explicit user gesture.

Recommended flow:

1. Kiểm tra component chưa ở trạng thái start hoặc active.
2. Reset previous safe error.
3. Chuyển state sang `requestingPermission`.
4. Kiểm tra Secure Context.
5. Kiểm tra `navigator.mediaDevices.getUserMedia`.
6. Gọi `getUserMedia`.
7. Lưu stream vào stable ref.
8. Gắn stream vào `video.srcObject`.
9. Chờ `loadedmetadata`.
10. Gọi `video.play()`.
11. Chờ video dimensions khác 0.
12. Chuyển state sang `active`.
13. Khởi động đúng một decoder loop.
14. Chuyển state sang `decoding` trong lúc đọc frame.

Không được phụ thuộc vào một state-triggered effect có cleanup làm stop camera trong normal rerender.

---

# 7. Video Element Requirements

Video preview phải có các thuộc tính tương đương:

```tsx
<video
  autoPlay
  muted
  playsInline
/>
```

## `autoPlay`

Hỗ trợ playback sau khi stream được gắn.

## `muted`

Giúp browser cho phép autoplay đối với local media preview và đảm bảo scanner không phát audio.

## `playsInline`

Ngăn iPhone tự đưa video vào fullscreen player và giữ preview trong scanner UI.

Ngoài JSX attributes, implementation vẫn phải xử lý promise trả về từ:

```ts
await video.play()
```

Không được bỏ qua `video.play()` rejection.

---

# 8. Frame Decoding

## 8.1 Canvas Fallback

Khi dùng `jsQR`:

1. Lấy `videoWidth` và `videoHeight`.
2. Đồng bộ canvas dimensions với video frame.
3. Draw current frame vào canvas.
4. Lấy `ImageData`.
5. Gọi `jsQR`.
6. Nếu chưa tìm thấy QR, schedule frame tiếp theo.
7. Nếu tìm thấy QR, khóa success và cleanup.

Không decode khi:

```text
videoWidth <= 0
videoHeight <= 0
video.readyState chưa đủ
scanner đã stop
component đã unmount
decode operation khác đang chạy
```

---

## 8.2 Decode Scheduling

Có thể dùng:

```text
requestAnimationFrame
```

hoặc một interval được kiểm soát.

`requestAnimationFrame` được ưu tiên cho video-frame loop thông thường.

Implementation phải giữ ID của scheduled callback để cancel trong cleanup.

Không cần decode mọi frame ở full camera framerate nếu gây tải CPU cao.

Có thể throttle decode hợp lý miễn không làm UX chậm rõ rệt.

---

## 8.3 Overlapping Work

Phải có guard tương đương:

```text
isDecodingRef
```

Khi decoder của frame trước chưa hoàn thành:

- bỏ qua việc tạo decoder work mới;
- không tạo nhiều canvas processing đồng thời;
- không gửi nhiều success callback.

---

# 9. Duplicate Submission Protection

QR Camera Scanner chỉ được trả một success cho mỗi scanner run.

Phải chống:

- nhiều frame liên tiếp chứa cùng QR;
- native decoder trả nhiều barcode;
- rerender;
- React Strict Mode;
- double callback;
- API request đang pending;
- modal close và success xảy ra gần nhau.

Recommended protection:

```text
scannerRunId
hasSucceededRef
isSubmittingRef
```

Khi success đầu tiên được chấp nhận:

1. đánh dấu scanner run đã success;
2. stop decode scheduling;
3. stop media stream;
4. disable thêm success callback;
5. chuyển payload đúng một lần vào Feature handler.

Backend vẫn phải chống duplicate request độc lập.

Frontend protection không thay thế backend idempotency hoặc state validation.

---

# 10. Cleanup Contract

Một shared `stopScanner(reason)` phải idempotent.

Gọi nhiều lần không được throw hoặc làm state sai.

Cleanup phải:

1. cancel `requestAnimationFrame`;
2. clear interval hoặc timeout nếu có;
3. invalidate active scanner run;
4. stop tất cả `MediaStreamTrack`;
5. xóa `video.srcObject`;
6. reset decoder guard;
7. release canvas references khi cần;
8. không update state sau unmount;
9. không gọi success callback sau stop.

Cleanup phải chạy khi:

```text
User bấm đóng scanner
User bấm cancel
QR decode thành công
Camera start fail
Decoder initialization fail
Video playback fail
Component unmount
Feature navigation rời khỏi page
Một scanner run mới thay thế run cũ
```

---

# 11. Error Handling

Error UI phải dùng tiếng Việt rõ ràng và không lộ internal stack trace.

## Secure Context Error

```text
Camera chỉ hoạt động trên HTTPS hoặc localhost.
```

## Camera API Unavailable

```text
Trình duyệt này không hỗ trợ mở camera.
```

## Permission Denied

```text
Bạn chưa cấp quyền sử dụng camera. Hãy cho phép camera rồi thử lại.
```

## Camera Not Found

```text
Không tìm thấy camera trên thiết bị.
```

## Camera In Use

```text
Camera đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại.
```

## Camera Constraint Error

```text
Không thể mở camera với cấu hình hiện tại. Hãy thử lại.
```

## Video Playback Error

```text
Không thể phát hình ảnh từ camera. Hãy đóng scanner rồi thử lại.
```

## Scanner Initialization Error

```text
Không thể khởi tạo trình quét QR.
```

## QR Not Detected

Không cần hiển thị error cho mỗi frame không tìm thấy QR.

Có thể hiển thị instruction ổn định:

```text
Đưa mã QR vào giữa khung hình.
```

## Unknown Error

```text
Không thể mở trình quét QR. Hãy thử lại hoặc nhập mã thủ công.
```

Manual paste hoặc token entry phải vẫn hiển thị khi camera error.

---

# 12. Development Diagnostics

Development-only diagnostics có thể ghi:

- `window.isSecureContext`;
- `navigator.mediaDevices` availability;
- camera permission result;
- selected camera label sau khi permission được cấp;
- MediaStream state;
- track ready state;
- video ready state;
- video dimensions;
- `video.play()` success hoặc failure;
- selected decoder;
- scanner state transition;
- stop reason.

Không log:

- raw Team QR token;
- raw Station QR token;
- password;
- JWT;
- refresh token;
- Authorization header;
- production secret;
- full QR URL chứa authentication token.

Production logging phải loại bỏ hoặc redact sensitive payload.

---

# 13. Feature Integration

## 13.1 Login QR Scanner

Sau khi decode:

1. trả raw decoded text về Login QR parser;
2. parser xác định accepted Login QR format;
3. auth flow gọi đúng endpoint;
4. auth state được cập nhật;
5. session policy được backend enforce;
6. scanner không tự quyết định Team identity.

Legacy format chỉ được chấp nhận khi compatibility rule còn hiệu lực.

Không đưa username/password plaintext vào QR.

---

## 13.2 Station QR Scanner

Sau khi decode:

1. trả raw decoded text về Station QR handler;
2. backend validate token;
3. backend resolve Station và purpose từ token record;
4. backend validate Team state và Event Config;
5. thực hiện Check-in hoặc Check-out;
6. scanner không tin trực tiếp purpose code hiển thị trong payload.

Camera layer không parse `stationId` để quyết định gameplay action.

---

# 14. Manual Fallback

Manual fallback không phải temporary debugging feature.

Nó là accepted fallback khi:

- user từ chối camera permission;
- thiết bị không có camera;
- browser không hỗ trợ camera API;
- camera đang được app khác sử dụng;
- decoder không đọc được QR;
- ánh sáng hoặc chất lượng camera không đủ;
- iOS browser gặp lifecycle issue;
- user đã copy token hoặc payload.

Manual input phải đi qua cùng parser và backend validation như camera-decoded input.

Không tạo validation yếu hơn cho manual input.

---

# 15. Current Implementation Status

Theo implementation audit gần nhất:

## Implemented

- Camera availability được gate bằng `getUserMedia`.
- Rear-facing camera được ưu tiên bằng `facingMode: { ideal: "environment" }`.
- Native `BarcodeDetector` được ưu tiên khi có.
- `jsQR` canvas-frame fallback đã được thêm.
- Login QR và Station QR input dùng shared detection behavior.
- Video dùng `muted` và `playsInline`.
- Login QR video đã được bổ sung `autoPlay`.
- Scanner tránh overlapping frame work.
- Stream, timer và animation frame được cleanup.
- Manual paste/token entry được giữ lại.
- Station scanner đã được chuyển sang explicit lifecycle state.
- Decode chỉ bắt đầu sau metadata, `video.play()` và non-zero dimensions.
- Vietnamese safe camera errors đã được bổ sung.
- Development-only lifecycle diagnostics đã được bổ sung.

## Automated Verification đã ghi nhận

Các verification sau đã được ghi nhận là pass trong audit:

```text
Frontend lint
Standalone TypeScript build
Frontend production build
build:prod
```

`jsqr` đã được thêm vào frontend dependencies.

## Chưa xác nhận trên thiết bị thật

```text
Real iPhone Safari HTTPS camera test
Real iPhone Chrome iOS HTTPS camera test
```

Không được đánh dấu iOS camera Feature hoàn tất hoàn toàn cho đến khi manual device verification pass.

---

# 16. Manual Device Test Matrix

## 16.1 iPhone Safari trên Production HTTPS

Preconditions:

- website chạy HTTPS;
- camera permission chưa bị block trong iOS Settings;
- QR test không chứa production secret cần ghi lại;
- manual fallback khả dụng.

Test:

1. Mở Login QR scanner.
2. Nhấn nút mở camera.
3. Cho phép camera.
4. Xác nhận preview hiển thị inline.
5. Xác nhận camera sau được ưu tiên nếu khả dụng.
6. Scan QR hợp lệ.
7. Xác nhận chỉ xử lý một lần.
8. Mở scanner lại.
9. Đóng scanner trước khi scan.
10. Xác nhận camera indicator tắt.
11. Thử QR không hợp lệ.
12. Xác nhận safe Feature error.
13. Thử Station Check-in QR.
14. Thử Station Check-out QR.
15. Xác nhận manual input vẫn hoạt động.

---

## 16.2 iPhone Chrome trên iOS

Lặp lại toàn bộ Safari matrix.

Không được mặc định Chrome trên iOS có native `BarcodeDetector`.

Xác nhận `jsQR` fallback hoạt động.

---

## 16.3 Permission Denied

1. Deny camera permission.
2. Mở scanner.
3. Xác nhận hiển thị permission error.
4. Xác nhận không có infinite loading.
5. Xác nhận manual input còn dùng được.
6. Cho phép lại permission.
7. Retry scanner.

---

## 16.4 Repeated Open and Close

1. Open scanner.
2. Close scanner.
3. Open lại.
4. Lặp ít nhất 5 lần.
5. Xác nhận không có frozen preview.
6. Xác nhận không giữ nhiều active camera tracks.
7. Xác nhận decode không chạy sau khi đóng.

---

## 16.5 Navigation and Unmount

1. Open scanner.
2. Navigate sang page khác.
3. Xác nhận camera track dừng.
4. Quay lại page.
5. Open scanner lại.
6. Xác nhận scanner hoạt động bình thường.

---

## 16.6 Duplicate QR Frame

1. Giữ cùng một QR trước camera nhiều giây.
2. Xác nhận chỉ có một Feature submit.
3. Xác nhận không có duplicate API request.
4. Xác nhận backend không tạo duplicate action.

---

# 17. Automated Verification Checklist

Khi sửa scanner implementation, chạy các command phù hợp với repository hiện tại.

Minimum:

```text
Frontend lint
Frontend TypeScript build
Frontend production build
```

Nếu test runner đã tồn tại, bổ sung test cho:

- camera capability dựa trên `getUserMedia`;
- native decoder selection;
- `jsQR` fallback selection;
- scanner start;
- cleanup;
- duplicate success guard;
- permission error mapping;
- video metadata wait;
- `video.play()` rejection;
- zero-dimension protection;
- manual fallback visibility.

Không thêm một test framework mới chỉ cho một fix nhỏ nếu project chưa có test runner, trừ khi user yêu cầu hoặc scope chấp nhận thay đổi đó.

---

# 18. Acceptance Criteria

Feature đạt Acceptance Criteria khi:

- [ ] Camera button khả dụng khi `getUserMedia` có, kể cả khi không có `BarcodeDetector`.
- [ ] Scanner chạy trong HTTPS hoặc localhost.
- [ ] Safari trên iPhone mở được inline camera preview.
- [ ] Chrome trên iOS mở được inline camera preview.
- [ ] `jsQR` fallback decode được QR trên iOS.
- [ ] Native `BarcodeDetector` vẫn được dùng trên browser hỗ trợ.
- [ ] Scanner không reset do normal React rerender.
- [ ] Decoder chỉ chạy sau metadata, playback và non-zero dimensions.
- [ ] Không có overlapping decode work.
- [ ] Một scanner run chỉ submit một lần.
- [ ] Camera track dừng khi close, success, error và unmount.
- [ ] Camera error có message tiếng Việt an toàn.
- [ ] Manual paste hoặc manual token entry luôn khả dụng.
- [ ] Raw QR token không xuất hiện trong production log.
- [ ] Frontend lint pass.
- [ ] Frontend TypeScript build pass.
- [ ] Frontend production build pass.
- [ ] Manual test trên iPhone Safari HTTPS pass.
- [ ] Manual test trên iPhone Chrome iOS HTTPS pass.

---

# 19. Known Remaining Risk

Current remaining risk:

```text
Real iPhone Safari and Chrome iOS verification has not yet been recorded as passed.
```

Build success không chứng minh camera lifecycle hoạt động trên thiết bị iOS thật.

Cho đến khi manual device test hoàn tất:

- giữ Acceptance items của iPhone ở trạng thái pending;
- không ghi "fully verified on iOS";
- không xóa manual fallback;
- không đóng backlog item liên quan iOS production verification.

---

# 20. Documentation Update Rules

Sau khi QR Camera behavior thay đổi:

Cập nhật:

```text
docs/analysis/IOS_SAFARI_QR_CAMERA_FIX.md
docs/analysis/BACKEND_AUDIT.md
docs/analysis/IMPLEMENTATION_BACKLOG.md
```

Chỉ cập nhật:

```text
docs/analysis/OPEN_QUESTIONS_AND_DECISIONS.md
```

khi Business Rule thay đổi.

Cập nhật:

```text
docs/analysis/FEATURE_INDEX.md
```

chỉ khi Feature routing hoặc document inventory thay đổi.

Không đưa implementation history dài vào Source of Truth.
