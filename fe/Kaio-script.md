I. Yêu cầu:

- Đây là mobile web app, tất cả phải tối ưu cho thiết bị di động.
- Tạo các page sau, có router rõ ràng, có phân quyền user, admin, system-admin.
- UI thân thiện với user, chuẩn Ant design, dễ dàng maintenance.
- Code thân thiện với dev junior, comment rõ ràng, tách component, store theo file rõ ràng, dễ dàng maintenance.
- Nếu có Error thì phải thông báo rõ ràng cho user biết.
- Nếu có hành động nào sẽ thay đổi database sẽ show confirmation, nếu user đồng ý thì mới thực hiện.

II. Màn hình:
#1. Login screen:

- Tất cả role đều phải login.
- Logo công ty.
- Login form với username, password có validation tiêu chuẩn đơn giản.
- Sau khi login thành công thì tự động navigate tới screen #2.

#2. Station list:

- Tất cả role đều phải login thành công.
- Danh sách các trạm trò chơi ở suối tiên, dummy data với 5 trạm.
- Sort theo thứ tự:

* Status: In Progress > New > Finish.
* Name: A-Z0-9.
* Nếu có 1 trạm In progress thì tự động disable các trạm khác.
* Phải có điểm phân biệt giữa disable do đang có trạm In progress hay do trạm đã finish.

- Data model gồm các field: id, name, status, score, startTime, endTime, teamId, stationId.
- Đối với admin và system-admin sẽ cho phép edit nhanh trên từng item, khi click vào item sẽ show dialog cho phép edit.
- Đối với role user thì click vào list item:

* Nếu Status = New (Flow 1): Mở camera điện thoại để scan QR, scan thành công thì chuyển status thành In progress, navigate sang màn hình (Screen #3).
* Nếu Status = In progress: navigate sang màn hình (Screen #3).
* Nếu Status = Finish: Disable item, không cho click.

- Đối với role khác user thì click vào list item: navigate sang màn hình (Screen #3)

#3. Station detail:

1. Đối với role User:

- Hiển thị clock hh:mm:ss, tăng dần, tính từ startTime.
- Button Finish, click vào button show camera cho quét QR, quét thành công > show dialog nhập điểm (default 0) > set endTime = thời điểm quét thành công > show success message > quay về màn hình #2.

2. Khác role User:

- Hiện thị input nhập score. Nếu có giá trị trước đó thì cũng hiện lên luôn.
- Button Save: Show confirmation > yes > set endTime = thời điểm hiện tại, score = input score ở trên.
- Button reset status: Show confirmation > yes > set status = new, startTime = null hoặc undefined.

#4. Team List:

- Chỉ có role khác user mới được access.
- Show danh sách Team.
- Dummy data 10 teams.
- Data model của team: id, name, score, finish(ví dụ 5, nghĩa là đã hoàn thành 5/5 trạm), totalTime.
- Sort theo thứ tự:

* Name: A-Z0-9
* Finish: Số trạm hoàn thành cao lên trước.
* Time: Cùng số Trạm hoàn thành, nếu totalTime ngắn hơn thì lên trước.

- Click vào item sẽ navigate sang Screen #2.

#5. System Configuration:

- Có 2 tabs: Station list, Team List.

1. Station list:

- Add new Station.
- Show station list.
- Delete station > Show confirmation,
- Click vào item > show create/edit station screen (#6)

2. Team list

- Add new Team.
- Show Team list.
- Delet Team > Show confirmation,
- Click vào item > show create/edit station screen (#7)

3. Map (new)

- dùng https://www.npmjs.com/package/react-konva
- Hiển thị map, có thể click trên map để add marker (station).
- chọn marker có sẵn để thay đổi hoặc xóa station.
- Có thể zoom in, zoom out

#6. Create/Edit station

- Form: id (edit mode only), name.

#7. Create/Edit team

- Form: id (edit mode only), name, score, finish, totalTime.

#8. Stations Map (new)

- sử dụng hình suoitien-map1.png
- dựa vào danh sách stations trong data hãy thêm các marker (latitude, longitude)
- có thể click được để xem chi tiết trạm trong bottom drawer.
- Có thể zoom in, zoom out, vị trí marker phải giữ đúng như database config.
